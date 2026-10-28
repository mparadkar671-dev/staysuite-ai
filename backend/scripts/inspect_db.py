#!/usr/bin/env python3
"""Database Multi-Format Inspector & Visualizer for StaySuite AI.

View the PostgreSQL database in ALL formats:
  - Table / Grid format
  - JSON format (--format json)
  - CSV format (--format csv)
  - Markdown format (--format md)
  - Mermaid ER Diagram (--format erd)
"""
import argparse
import asyncio
import csv
import json
import os
import sys
from io import StringIO
from typing import Any

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from sqlalchemy import text
from app.core.config import get_settings
from app.core.db import SessionFactory, engine


async def get_all_tables(session) -> list[str]:
    query = text("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
          AND table_name != 'alembic_version'
        ORDER BY table_name;
    """)
    result = await session.execute(query)
    return [row[0] for row in result.fetchall()]


async def get_table_schema(session, table_name: str) -> list[dict[str, Any]]:
    query = text("""
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = :table_name
        ORDER BY ordinal_position;
    """)
    result = await session.execute(query, {"table_name": table_name})
    return [
        {
            "column": row[0],
            "type": row[1],
            "nullable": row[2] == "YES",
            "default": row[3],
        }
        for row in result.fetchall()
    ]


async def get_table_data(session, table_name: str, limit: int = 50) -> list[dict[str, Any]]:
    query = text(f'SELECT * FROM "{table_name}" LIMIT :limit;')
    result = await session.execute(query, {"limit": limit})
    keys = result.keys()
    rows = []
    for row in result.fetchall():
        row_dict = {}
        for k, v in zip(keys, row):
            if isinstance(v, (dict, list)):
                row_dict[k] = v
            else:
                row_dict[k] = str(v) if v is not None else None
        rows.append(row_dict)
    return rows


async def generate_erd_mermaid(session, tables: list[str]) -> str:
    lines = ["erDiagram"]
    fk_query = text("""
        SELECT
            tc.table_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public';
    """)
    fk_res = await session.execute(fk_query)
    fks = fk_res.fetchall()

    for fk in fks:
        lines.append(f"    {fk[2].upper()} ||--o{{ {fk[0].upper()} : \"{fk[1]}\"")

    for t in tables:
        schema = await get_table_schema(session, t)
        lines.append(f"    {t.upper()} {{")
        for col in schema[:8]:  # Limit top 8 columns for diagram readability
            c_type = col["type"].replace(" ", "_").replace("character_varying", "varchar")
            lines.append(f"        {c_type} {col['column']}")
        lines.append("    }")

    return "\n".join(lines)


async def main():
    parser = argparse.ArgumentParser(description="StaySuite Postgres Multi-Format Database Inspector")
    parser.add_argument("--format", choices=["table", "json", "csv", "md", "erd"], default="table",
                        help="Output format: table (default), json, csv, md (markdown), erd (mermaid)")
    parser.add_argument("--table", type=str, default=None, help="Inspect specific table name")
    parser.add_argument("--limit", type=int, default=25, help="Max rows per table (default 25)")
    args = parser.parse_args()

    settings = get_settings()

    try:
        async with SessionFactory() as session:
            tables = await get_all_tables(session)
            if not tables:
                print("No user tables found in database. Run alembic upgrade head first.")
                return

            target_tables = [args.table] if args.table and args.table in tables else tables

            if args.format == "erd":
                erd = await generate_erd_mermaid(session, tables)
                print(erd)
                return

            db_dump = {}
            for t in target_tables:
                schema = await get_table_schema(session, t)
                rows = await get_table_data(session, t, limit=args.limit)
                db_dump[t] = {
                    "columns": schema,
                    "row_count": len(rows),
                    "rows": rows,
                }

            if args.format == "json":
                print(json.dumps(db_dump, indent=2, default=str))

            elif args.format == "csv":
                for t, data in db_dump.items():
                    print(f"\n--- TABLE: {t} ---")
                    if not data["rows"]:
                        print("Empty table.")
                        continue
                    output = StringIO()
                    writer = csv.DictWriter(output, fieldnames=data["rows"][0].keys())
                    writer.writeheader()
                    writer.writerows(data["rows"])
                    print(output.getvalue())

            elif args.format == "md":
                for t, data in db_dump.items():
                    print(f"\n### Table: `{t}` (Rows: {data['row_count']})")
                    if not data["rows"]:
                        print("_Empty table._")
                        continue
                    headers = list(data["rows"][0].keys())
                    print("| " + " | ".join(headers) + " |")
                    print("| " + " | ".join(["---"] * len(headers)) + " |")
                    for row in data["rows"]:
                        vals = [str(row.get(h, "")).replace("\n", " ") for h in headers]
                        print("| " + " | ".join(vals) + " |")

            else:  # table format
                print("=" * 80)
                print(" STAYSUITE AI — POSTGRESQL MULTI-FORMAT DATABASE EXPLORER")
                print("=" * 80)
                for t, data in db_dump.items():
                    print(f"\n📦 Table: {t}  ({data['row_count']} rows shown)")
                    print("-" * 60)
                    cols_str = ", ".join([f"{c['column']} ({c['type']})" for c in data['columns'][:6]])
                    print(f"Columns: {cols_str} ...")
                    if data["rows"]:
                        first_row = data["rows"][0]
                        print(f"Sample Row: {json.dumps(first_row, default=str)[:140]}...")
                    else:
                        print("  [0 rows / ready for sync]")
                print("\nTip: Use --format json, --format csv, --format md, or --format erd to export in any format.")

    except Exception as e:
        print(f"Database connection error: {e}", file=sys.stderr)
        print("Ensure PostgreSQL is running via `docker compose up -d postgres`.", file=sys.stderr)
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
