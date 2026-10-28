"""Database Studio: In-browser visual database explorer, ER diagram viewer,
and multi-format exporter (Table, JSON, CSV, Markdown, Mermaid ERD, and SQL Console).
Available directly at http://localhost:8000/db with zero setup.
"""
import csv
import json
from io import StringIO
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import HTMLResponse, PlainTextResponse, Response
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import Base, SessionFactory, get_session
import app.all_models  # noqa: F401

router = APIRouter(tags=["database_studio"])


class QueryRequest(BaseModel):
    sql: str


@router.get("/api/v1/db/metadata")
async def get_db_metadata():
    """Returns all registered tables and their columns from SQLAlchemy metadata."""
    tables_meta = []
    for table_name, table in Base.metadata.tables.items():
        columns = [
            {
                "name": col.name,
                "type": str(col.type),
                "nullable": col.nullable,
                "primary_key": col.primary_key,
                "foreign_keys": [str(fk.target_fullname) for fk in col.foreign_keys],
            }
            for col in table.columns
        ]
        foreign_keys = [
            {
                "constrained_columns": [c.name for c in fk.constraint.columns] if fk.constraint else [fk.parent.name],
                "referred_table": fk.column.table.name,
                "referred_columns": [fk.column.name],
            }
            for fk in table.foreign_keys
        ]
        tables_meta.append({
            "name": table_name,
            "columns": columns,
            "foreign_keys": foreign_keys,
            "column_count": len(columns),
        })

    return {"tables": sorted(tables_meta, key=lambda t: t["name"])}


@router.get("/api/v1/db/table/{table_name}")
async def get_table_data(
    table_name: str,
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_session),
):
    """Fetches live rows for a specific table."""
    if table_name not in Base.metadata.tables:
        raise HTTPException(404, f"Table '{table_name}' not found in registered schema.")

    try:
        # Get total count
        count_res = await session.execute(text(f'SELECT COUNT(*) FROM "{table_name}"'))
        total_count = count_res.scalar() or 0

        # Fetch rows
        rows_res = await session.execute(
            text(f'SELECT * FROM "{table_name}" LIMIT :limit OFFSET :offset'),
            {"limit": limit, "offset": offset},
        )
        keys = list(rows_res.keys())
        rows = []
        for r in rows_res.fetchall():
            row_dict = {}
            for k, v in zip(keys, r):
                if isinstance(v, (dict, list)):
                    row_dict[k] = v
                else:
                    row_dict[k] = str(v) if v is not None else None
            rows.append(row_dict)

        return {
            "table": table_name,
            "columns": keys,
            "total_count": total_count,
            "limit": limit,
            "offset": offset,
            "rows": rows,
        }
    except Exception as e:
        # Fallback to schema only if table is not yet migrated/created in Postgres
        table = Base.metadata.tables[table_name]
        return {
            "table": table_name,
            "columns": [c.name for c in table.columns],
            "total_count": 0,
            "limit": limit,
            "offset": offset,
            "rows": [],
            "note": f"Table schema registered in ORM. (Database message: {str(e)[:120]})",
        }


@router.post("/api/v1/db/query")
async def execute_custom_query(
    body: QueryRequest,
    session: AsyncSession = Depends(get_session),
):
    """Runs a read-only SQL query and returns rows."""
    sql = body.sql.strip()
    if not sql.upper().startswith("SELECT"):
        raise HTTPException(400, "Only read-only SELECT queries are permitted in Database Studio.")

    try:
        res = await session.execute(text(sql))
        keys = list(res.keys())
        rows = []
        for r in res.fetchmany(100):
            row_dict = {}
            for k, v in zip(keys, r):
                row_dict[k] = str(v) if v is not None else None
            rows.append(row_dict)
        return {"columns": keys, "rows": rows, "count": len(rows)}
    except Exception as e:
        raise HTTPException(400, f"Query error: {str(e)}")


@router.get("/api/v1/db/export/{table_name}")
async def export_table_data(
    table_name: str,
    format: str = Query("json", pattern="^(json|csv|md)$"),
    session: AsyncSession = Depends(get_session),
):
    """Exports table data in JSON, CSV, or Markdown format."""
    data = await get_table_data(table_name=table_name, limit=500, offset=0, session=session)
    rows = data.get("rows", [])
    cols = data.get("columns", [])

    if format == "csv":
        output = StringIO()
        if rows:
            writer = csv.DictWriter(output, fieldnames=cols)
            writer.writeheader()
            writer.writerows(rows)
        content = output.getvalue()
        return Response(
            content=content,
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{table_name}.csv"'},
        )

    elif format == "md":
        lines = []
        lines.append(f"# Table: `{table_name}` ({len(rows)} rows)")
        lines.append("")
        if cols:
            lines.append("| " + " | ".join(cols) + " |")
            lines.append("| " + " | ".join(["---"] * len(cols)) + " |")
            for r in rows:
                row_vals = [str(r.get(c, "")).replace("\n", " ").replace("|", "\\|") for c in cols]
                lines.append("| " + " | ".join(row_vals) + " |")
        return PlainTextResponse("\n".join(lines), media_type="text/markdown")

    return Response(
        content=json.dumps(data, indent=2, default=str),
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="{table_name}.json"'},
    )


@router.get("/db", response_class=HTMLResponse, include_in_schema=False)
@router.get("/database-studio", response_class=HTMLResponse, include_in_schema=False)
async def database_studio_ui():
    """Renders the executive-grade single-page Database Studio Web App."""
    html_content = r"""<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>StaySuite AI — PostgreSQL Database Studio</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
    mermaid.initialize({ startOnLoad: false, theme: 'dark' });
    window.mermaid = mermaid;
  </script>
  <style>
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 font-sans min-h-screen flex flex-col">

  <!-- Top Header -->
  <header class="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 py-3 flex items-center justify-between sticky top-0 z-40">
    <div class="flex items-center space-x-3">
      <div class="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-sm text-white shadow-md shadow-indigo-500/20">
        DB
      </div>
      <div>
        <div class="flex items-center space-x-2">
          <span class="font-bold text-white tracking-tight">StaySuite AI Database Studio</span>
          <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            PostgreSQL Multi-Format
          </span>
        </div>
        <p class="text-xs text-slate-400">All Formats: Interactive Grid • JSON • CSV • Markdown • Visual ER Diagram • SQL Runner</p>
      </div>
    </div>

    <div class="flex items-center space-x-2">
      <a href="/docs" target="_blank" class="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition">
        Swagger Docs
      </a>
      <button onclick="loadMetadata()" class="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3 py-1.5 rounded-lg transition flex items-center space-x-1">
        <span>Refresh Schema</span>
      </button>
    </div>
  </header>

  <div class="flex-1 flex overflow-hidden">
    <!-- Left Sidebar: Tables List -->
    <aside class="w-72 border-r border-slate-800 bg-slate-900/50 flex flex-col">
      <div class="p-3 border-b border-slate-800">
        <input
          type="text"
          id="tableSearch"
          oninput="filterTables()"
          placeholder="Filter tables..."
          class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div class="p-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 flex justify-between">
        <span>Registered Tables</span>
        <span id="tableCountBadge" class="font-mono text-indigo-400">0</span>
      </div>

      <nav id="tablesList" class="flex-1 overflow-y-auto p-2 space-y-0.5 text-xs"></nav>
    </aside>

    <!-- Main Content Area -->
    <main class="flex-1 flex flex-col overflow-hidden bg-slate-950">
      <!-- Action Bar & Format Switcher -->
      <div class="p-4 border-b border-slate-800 bg-slate-900/30 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="currentTableName" class="text-lg font-bold text-white">Select a Table</h2>
          <p id="currentTableMeta" class="text-xs text-slate-400">Choose any table from the sidebar to inspect schema & data.</p>
        </div>

        <!-- Format Tabs -->
        <div class="flex items-center space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
          <button onclick="setFormat('grid')" id="tab-grid" class="px-3 py-1 rounded-md font-medium transition bg-indigo-600 text-white">Grid View</button>
          <button onclick="setFormat('json')" id="tab-json" class="px-3 py-1 rounded-md font-medium transition text-slate-400 hover:text-white">JSON</button>
          <button onclick="setFormat('csv')" id="tab-csv" class="px-3 py-1 rounded-md font-medium transition text-slate-400 hover:text-white">CSV</button>
          <button onclick="setFormat('md')" id="tab-md" class="px-3 py-1 rounded-md font-medium transition text-slate-400 hover:text-white">Markdown</button>
          <button onclick="setFormat('erd')" id="tab-erd" class="px-3 py-1 rounded-md font-medium transition text-slate-400 hover:text-white">Visual ERD</button>
          <button onclick="setFormat('sql')" id="tab-sql" class="px-3 py-1 rounded-md font-medium transition text-slate-400 hover:text-white">SQL Console</button>
        </div>
      </div>

      <!-- Content Panels -->
      <div class="flex-1 overflow-auto p-6">
        <!-- 1. Grid View -->
        <div id="view-grid" class="space-y-4">
          <div class="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
            <table class="w-full text-left text-xs border-collapse">
              <thead id="gridHead" class="bg-slate-900 text-slate-300 font-semibold border-b border-slate-800 sticky top-0"></thead>
              <tbody id="gridBody" class="divide-y divide-slate-800/60 text-slate-300 font-mono"></tbody>
            </table>
          </div>
        </div>

        <!-- 2. JSON View -->
        <div id="view-json" class="hidden space-y-2">
          <div class="flex justify-end space-x-2">
            <button onclick="copyToClipboard('jsonOutput')" class="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded text-slate-200">Copy JSON</button>
            <button onclick="downloadActiveTable('json')" class="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-xs rounded text-white font-medium">Download .json</button>
          </div>
          <pre id="jsonOutput" class="p-4 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 font-mono text-xs overflow-auto max-h-[70vh]"></pre>
        </div>

        <!-- 3. CSV View -->
        <div id="view-csv" class="hidden space-y-2">
          <div class="flex justify-end space-x-2">
            <button onclick="copyToClipboard('csvOutput')" class="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded text-slate-200">Copy CSV</button>
            <button onclick="downloadActiveTable('csv')" class="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-xs rounded text-white font-medium">Download .csv</button>
          </div>
          <pre id="csvOutput" class="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-mono text-xs overflow-auto max-h-[70vh]"></pre>
        </div>

        <!-- 4. Markdown View -->
        <div id="view-md" class="hidden space-y-2">
          <div class="flex justify-end space-x-2">
            <button onclick="copyToClipboard('mdOutput')" class="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded text-slate-200">Copy Markdown</button>
          </div>
          <pre id="mdOutput" class="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-mono text-xs overflow-auto max-h-[70vh]"></pre>
        </div>

        <!-- 5. Visual ERD View -->
        <div id="view-erd" class="hidden space-y-4">
          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 overflow-auto">
            <div id="erdDiagramContainer" class="mermaid flex justify-center"></div>
          </div>
        </div>

        <!-- 6. SQL Console View -->
        <div id="view-sql" class="hidden space-y-4">
          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-300">Read-Only SQL Query Console</span>
              <button onclick="runCustomSql()" class="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold">
                Run Query (Ctrl+Enter)
              </button>
            </div>
            <textarea
              id="sqlInput"
              rows="4"
              class="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-indigo-300 font-mono focus:outline-none focus:border-indigo-500"
              placeholder="SELECT * FROM properties LIMIT 10;"
            ></textarea>
          </div>

          <div id="sqlResultsWrapper" class="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
            <table class="w-full text-left text-xs border-collapse">
              <thead id="sqlHead" class="bg-slate-900 text-slate-300 font-semibold border-b border-slate-800"></thead>
              <tbody id="sqlBody" class="divide-y divide-slate-800/60 text-slate-300 font-mono"></tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  </div>

  <script>
    let currentTable = null;
    let tablesData = [];
    let currentFormat = 'grid';
    let currentRows = [];
    let currentCols = [];

    async function loadMetadata() {
      try {
        const res = await fetch('/api/v1/db/metadata');
        const data = await res.json();
        tablesData = data.tables || [];
        document.getElementById('tableCountBadge').textContent = tablesData.length;
        renderTablesList(tablesData);
        if (tablesData.length > 0 && !currentTable) {
          selectTable(tablesData[0].name);
        }
      } catch (err) {
        console.error('Failed to load DB schema:', err);
      }
    }

    function renderTablesList(list) {
      const el = document.getElementById('tablesList');
      el.innerHTML = '';
      list.forEach(t => {
        const btn = document.createElement('button');
        btn.className = `w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition ${
          currentTable === t.name ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-300 hover:bg-slate-800'
        }`;
        btn.onclick = () => selectTable(t.name);
        btn.innerHTML = `
          <span class="truncate">${t.name}</span>
          <span class="text-[10px] opacity-60 font-mono">${t.column_count} cols</span>
        `;
        el.appendChild(btn);
      });
    }

    function filterTables() {
      const q = document.getElementById('tableSearch').value.toLowerCase();
      const filtered = tablesData.filter(t => t.name.toLowerCase().includes(q));
      renderTablesList(filtered);
    }

    async function selectTable(name) {
      currentTable = name;
      renderTablesList(tablesData);
      document.getElementById('currentTableName').textContent = name;

      const tMeta = tablesData.find(t => t.name === name);
      if (tMeta) {
        document.getElementById('currentTableMeta').textContent = `${tMeta.column_count} Columns • Foreign Keys: ${tMeta.foreign_keys.length}`;
      }

      // Fetch rows
      try {
        const res = await fetch(`/api/v1/db/table/${name}`);
        const json = await res.json();
        currentCols = json.columns || [];
        currentRows = json.rows || [];

        renderGridView(currentCols, currentRows);
        renderJsonView(json);
        renderCsvView(currentCols, currentRows);
        renderMarkdownView(name, currentCols, currentRows);
        renderErdView();
      } catch (err) {
        console.error('Error fetching table rows:', err);
      }
    }

    function setFormat(fmt) {
      currentFormat = fmt;
      ['grid', 'json', 'csv', 'md', 'erd', 'sql'].forEach(f => {
        document.getElementById(`view-${f}`).classList.add('hidden');
        document.getElementById(`tab-${f}`).className = 'px-3 py-1 rounded-md font-medium transition text-slate-400 hover:text-white';
      });

      document.getElementById(`view-${fmt}`).classList.remove('hidden');
      document.getElementById(`tab-${fmt}`).className = 'px-3 py-1 rounded-md font-medium transition bg-indigo-600 text-white';

      if (fmt === 'erd') {
        renderErdView();
      }
    }

    function renderGridView(cols, rows) {
      const head = document.getElementById('gridHead');
      const body = document.getElementById('gridBody');
      head.innerHTML = `<tr>${cols.map(c => `<th class="py-2.5 px-3 whitespace-nowrap">${c}</th>`).join('')}</tr>`;

      if (rows.length === 0) {
        body.innerHTML = `<tr><td colspan="${cols.length || 1}" class="text-center py-8 text-slate-500 font-sans">0 rows returned (Ready for data entry)</td></tr>`;
        return;
      }

      body.innerHTML = rows.map(r => `
        <tr class="hover:bg-slate-800/40">
          ${cols.map(c => `<td class="py-2.5 px-3 max-w-xs truncate" title="${r[c] !== null ? String(r[c]) : ''}">${r[c] !== null ? String(r[c]) : '<span class="text-slate-600">NULL</span>'}</td>`).join('')}
        </tr>
      `).join('');
    }

    function renderJsonView(data) {
      document.getElementById('jsonOutput').textContent = JSON.stringify(data, null, 2);
    }

    function renderCsvView(cols, rows) {
      let csv = cols.join(',') + '\\n';
      rows.forEach(r => {
        csv += cols.map(c => `"${String(r[c] || '').replace(/"/g, '""')}"`).join(',') + '\\n';
      });
      document.getElementById('csvOutput').textContent = csv;
    }

    function renderMarkdownView(name, cols, rows) {
      let md = `### Table: \`${name}\`\\n\\n`;
      md += '| ' + cols.join(' | ') + ' |\\n';
      md += '| ' + cols.map(() => '---').join(' | ') + ' |\\n';
      rows.forEach(r => {
        md += '| ' + cols.map(c => String(r[c] || '').replace(/\\n/g, ' ')).join(' | ') + ' |\\n';
      });
      document.getElementById('mdOutput').textContent = md;
    }

    async function renderErdView() {
      const container = document.getElementById('erdDiagramContainer');
      let erd = 'erDiagram\\n';
      tablesData.forEach(t => {
        t.foreign_keys.forEach(fk => {
          erd += `    ${fk.referred_table.toUpperCase()} ||--o{ ${t.name.toUpperCase()} : references\\n`;
        });
      });

      tablesData.slice(0, 10).forEach(t => {
        erd += `    ${t.name.toUpperCase()} {\\n`;
        t.columns.slice(0, 6).forEach(c => {
          const sanitizedType = c.type.split('(')[0].replace(/\\s+/g, '_');
          erd += `        ${sanitizedType} ${c.name}\\n`;
        });
        erd += `    }\\n`;
      });

      container.removeAttribute('data-processed');
      container.innerHTML = erd;
      if (window.mermaid) {
        try {
          await window.mermaid.run({ nodes: [container] });
        } catch (e) {
          console.error('Mermaid render error:', e);
        }
      }
    }

    async function runCustomSql() {
      const sql = document.getElementById('sqlInput').value;
      const head = document.getElementById('sqlHead');
      const body = document.getElementById('sqlBody');
      try {
        const res = await fetch('/api/v1/db/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'SQL Query failed');

        head.innerHTML = `<tr>${data.columns.map(c => `<th class="py-2.5 px-3">${c}</th>`).join('')}</tr>`;
        body.innerHTML = data.rows.map(r => `
          <tr class="hover:bg-slate-800/40">
            ${data.columns.map(c => `<td class="py-2 px-3">${r[c] || ''}</td>`).join('')}
          </tr>
        `).join('');
      } catch (err) {
        alert(err.message);
      }
    }

    function copyToClipboard(elementId) {
      const text = document.getElementById(elementId).textContent;
      navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    }

    function downloadActiveTable(fmt) {
      if (!currentTable) return;
      window.open(`/api/v1/db/export/${currentTable}?format=${fmt}`, '_blank');
    }

    window.onload = loadMetadata;
  </script>
</body>
</html>"""
    return HTMLResponse(content=html_content)
