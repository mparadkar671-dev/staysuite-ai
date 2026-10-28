import asyncio
import asyncpg

async def setup():
    conn = await asyncpg.connect(user='postgres', database='postgres', host='127.0.0.1', port=5432)
    user_exists = await conn.fetchval("SELECT 1 FROM pg_roles WHERE rolname = 'staysuite'")
    if not user_exists:
        await conn.execute("CREATE ROLE staysuite WITH LOGIN SUPERUSER PASSWORD 'staysuite';")
        print("Created role staysuite")
    else:
        await conn.execute("ALTER ROLE staysuite WITH SUPERUSER PASSWORD 'staysuite';")
        print("Updated role staysuite")

    db_exists = await conn.fetchval("SELECT 1 FROM pg_database WHERE datname = 'staysuite'")
    if not db_exists:
        await conn.execute("CREATE DATABASE staysuite OWNER staysuite;")
        print("Created database staysuite")
    else:
        print("Database staysuite already exists")

    await conn.close()

if __name__ == "__main__":
    asyncio.run(setup())
