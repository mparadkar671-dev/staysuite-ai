"""Per-property real-time fan-out over WebSockets.

Events are published to Redis (`staysuite:ws:{property_id}`) so every API worker/instance
delivers them to its own local sockets. If Redis is unavailable the hub degrades to
in-process delivery, which is correct for a single-worker deployment.
"""
import asyncio
import contextlib
import json
import logging
import uuid
from collections import defaultdict

from fastapi import WebSocket
from redis import asyncio as aioredis

logger = logging.getLogger("staysuite.realtime")
_CHANNEL_PREFIX = "staysuite:ws:"


class RealtimeHub:
    def __init__(self) -> None:
        self._sockets: dict[uuid.UUID, set[WebSocket]] = defaultdict(set)
        self._redis: aioredis.Redis | None = None
        self._listener: asyncio.Task | None = None

    async def start(self, redis_url: str | None) -> None:
        if not redis_url:
            return
        try:
            self._redis = aioredis.from_url(redis_url, decode_responses=True)
            await self._redis.ping()
        except Exception:
            logger.warning("Redis unavailable - realtime hub running in single-process mode")
            self._redis = None
            return
        self._listener = asyncio.create_task(self._listen(redis_url), name="realtime-listener")

    async def stop(self) -> None:
        if self._listener:
            self._listener.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self._listener
            self._listener = None
        if self._redis:
            await self._redis.aclose()
            self._redis = None

    def register(self, property_id: uuid.UUID, ws: WebSocket) -> None:
        self._sockets[property_id].add(ws)

    def unregister(self, property_id: uuid.UUID, ws: WebSocket) -> None:
        sockets = self._sockets.get(property_id)
        if sockets:
            sockets.discard(ws)
            if not sockets:
                self._sockets.pop(property_id, None)

    async def broadcast(self, property_id: uuid.UUID, event: dict) -> None:
        payload = json.dumps(event, default=str)
        if self._redis is not None:
            try:
                await self._redis.publish(f"{_CHANNEL_PREFIX}{property_id}", payload)
                return
            except Exception:
                logger.warning("Redis publish failed - delivering locally", exc_info=True)
        await self._deliver(property_id, payload)

    async def _deliver(self, property_id: uuid.UUID, payload: str) -> None:
        dead: list[WebSocket] = []
        for ws in list(self._sockets.get(property_id, ())):
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.unregister(property_id, ws)

    async def _listen(self, redis_url: str) -> None:
        backoff = 1.0
        while True:
            client = aioredis.from_url(redis_url, decode_responses=True)
            pubsub = client.pubsub()
            try:
                await pubsub.psubscribe(f"{_CHANNEL_PREFIX}*")
                backoff = 1.0
                async for message in pubsub.listen():
                    if message.get("type") != "pmessage":
                        continue
                    try:
                        property_id = uuid.UUID(message["channel"].removeprefix(_CHANNEL_PREFIX))
                    except ValueError:
                        continue
                    await self._deliver(property_id, message["data"])
            except asyncio.CancelledError:
                raise
            except Exception:
                logger.warning("Realtime listener error, reconnecting in %.0fs", backoff, exc_info=True)
                await asyncio.sleep(backoff)
                backoff = min(backoff * 2, 30.0)
            finally:
                with contextlib.suppress(Exception):
                    await pubsub.aclose()
                    await client.aclose()


hub = RealtimeHub()
