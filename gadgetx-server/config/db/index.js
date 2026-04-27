const sqlite3 = require("sqlite3").verbose();
const path = require("path");
// NOTE: Do NOT call dotenv.config() here — it is already loaded by server.js
// In production (Electron), DB_FILE is injected directly via fork() env vars.

const dbPath = process.env.DB_FILE && path.isAbsolute(process.env.DB_FILE)
  ? process.env.DB_FILE
  : path.resolve(__dirname, "../../", process.env.DB_FILE || "gadgetx.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Failed to connect to SQLite database:", err.message);
  } else {
    console.log("✅ Connected to SQLite database at:", dbPath);
    // Enable foreign keys
    db.run("PRAGMA foreign_keys = ON;");
  }
});

// Helper to run queries as promises
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    let sqliteSql = sql;

    // ── 1. PostgreSQL → SQLite function translations ───────────────────────

    sqliteSql = sqliteSql.replace(
      /TO_CHAR\s*\(\s*([^,]+?)\s*,\s*'YYYY-MM-DD'\s*\)/gi,
      "strftime('%Y-%m-%d', $1)"
    );
    sqliteSql = sqliteSql.replace(
      /TO_CHAR\s*\(\s*([^,]+?)\s*,\s*'YYYY-MM'\s*\)/gi,
      "strftime('%Y-%m', $1)"
    );
    sqliteSql = sqliteSql.replace(
      /TRIM\s*\(\s*TO_CHAR\s*\([^,]+,\s*'Month'\s*\)\s*\)/gi,
      "strftime('%m', date)" 
    );
    sqliteSql = sqliteSql.replace(
      /DATE_TRUNC\s*\(\s*'month'\s*,\s*([^)]+)\)/gi,
      "strftime('%Y-%m', $1)"
    );
    sqliteSql = sqliteSql.replace(
      /DATE_TRUNC\s*\(\s*'year'\s*,\s*([^)]+)\)/gi,
      "strftime('%Y', $1)"
    );
    sqliteSql = sqliteSql.replace(
      /DATE_TRUNC\s*\(\s*'day'\s*,\s*([^)]+)\)/gi,
      "DATE($1)"
    );
    sqliteSql = sqliteSql.replace(
      /EXTRACT\s*\(\s*YEAR\s+FROM\s+([^)]+)\)/gi,
      "CAST(strftime('%Y', $1) AS INTEGER)"
    );
    sqliteSql = sqliteSql.replace(
      /EXTRACT\s*\(\s*MONTH\s+FROM\s+([^)]+)\)/gi,
      "CAST(strftime('%m', $1) AS INTEGER)"
    );
    sqliteSql = sqliteSql.replace(
      /STRING_AGG\s*\(\s*(DISTINCT\s+)?([^,]+?),\s*',\s*'\s*\)/gi,
      (_, distinct, expr) => `GROUP_CONCAT(${distinct ? 'DISTINCT ' : ''}${expr.trim()})`
    );
    sqliteSql = sqliteSql.replace(/\bNULLS\s+(LAST|FIRST)\b/gi, "");

    // ── 2. ILIKE → LIKE ────────────────────────────────────────────────────
    sqliteSql = sqliteSql.replace(/\bILIKE\b/gi, "LIKE");

    // ── 3. Strip PostgreSQL type casts (::text, ::integer, etc.) ───────────
    sqliteSql = sqliteSql.replace(/::[a-zA-Z0-9_]+/g, "");

    // ── 4. to_regclass fallback ────────────────────────────────────────────
    sqliteSql = sqliteSql.replace(
      /SELECT\s+to_regclass\s*\(\s*['"](?:public\.)?["']?(.+?)["']?['"]\s*\)\s+AS\s+table_name/gi,
      "SELECT (SELECT name FROM sqlite_master WHERE type='table' AND name='$1') AS table_name"
    );

    // ── 5. SERIAL → INTEGER PRIMARY KEY AUTOINCREMENT ──────────────────────
    sqliteSql = sqliteSql.replace(/\bSERIAL\s+PRIMARY\s+KEY\b/gi, "INTEGER PRIMARY KEY AUTOINCREMENT");
    sqliteSql = sqliteSql.replace(/\bSERIAL\b/gi, "INTEGER"); // Fallback for SERIAL without PRIMARY KEY

    // ── 6. More Type Translations ──────────────────────────────────────────
    sqliteSql = sqliteSql.replace(/\bTEXT\s*\[\s*\]/gi, "TEXT");
    sqliteSql = sqliteSql.replace(/\bINTEGER\s*\[\s*\]/gi, "TEXT");
    sqliteSql = sqliteSql.replace(/\bINT\s*\[\s*\]/gi, "TEXT");
    sqliteSql = sqliteSql.replace(/\bUUID\b/gi, "TEXT");
    sqliteSql = sqliteSql.replace(/\bJSONB\b/gi, "JSON");
    sqliteSql = sqliteSql.replace(/\bTIMESTAMP\s+WITH\s+TIME\s+ZONE\b/gi, "TIMESTAMP");
    sqliteSql = sqliteSql.replace(/\bNOW\s*\(\s*\)/gi, "CURRENT_TIMESTAMP");
    sqliteSql = sqliteSql.replace(/\bgen_random_uuid\s*\(\s*\)/gi, "NULL"); // Placeholder or let app handle it
    sqliteSql = sqliteSql.replace(/DEFAULT\s+'\{.*?\}'/gi, "DEFAULT ''");
    sqliteSql = sqliteSql.replace(/DEFAULT\s+'\[.*?\]'/gi, "DEFAULT '[]'");

    // ── 7. Convert $1, $2, … positional params → ? ────────────────────────
    let newParams = [];
    sqliteSql = sqliteSql.replace(/\$(\d+)/g, (match, p1) => {
      newParams.push(params[parseInt(p1, 10) - 1]);
      return "?";
    });

    const upperSql = sqliteSql.trim().toUpperCase();
    const isSelect = upperSql.startsWith("SELECT") || upperSql.startsWith("WITH");
    let isReturning = upperSql.includes("RETURNING");
    let returningTable = null;

    if (isReturning && !isSelect) {
      // Try to find the table name for the fallback SELECT
      const insertMatch = sqliteSql.match(/INSERT\s+INTO\s+["']?([a-zA-Z0-9_]+)["']?/i);
      const updateMatch = sqliteSql.match(/UPDATE\s+["']?([a-zA-Z0-9_]+)["']?/i);
      returningTable = insertMatch ? insertMatch[1] : (updateMatch ? updateMatch[1] : null);
      
      // Strip the RETURNING clause for the initial execution
      sqliteSql = sqliteSql.replace(/\bRETURNING\b\s+.*$/gi, "").trim();
    }

    // ── 8. Swallow Postgres-specific Trigger Functions ─────────────────────
    if (upperSql.includes("CREATE OR REPLACE FUNCTION")) {
      resolve({ rows: [] });
      return;
    }

    // ── 9. Basic Trigger Translation (for updated_at) ──────────────────────
    if (upperSql.includes("CREATE TRIGGER") && (upperSql.includes("EXECUTE FUNCTION") || upperSql.includes("EXECUTE PROCEDURE"))) {
      const triggerMatch = sqliteSql.match(/CREATE\s+TRIGGER\s+(\w+)\s+BEFORE\s+UPDATE\s+ON\s+(\w+)/i);
      if (triggerMatch) {
        const [_, triggerName, tableName] = triggerMatch;
        sqliteSql = `
          CREATE TRIGGER IF NOT EXISTS ${triggerName} AFTER UPDATE ON ${tableName}
          BEGIN
            UPDATE ${tableName} SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
          END;
        `;
      } else {
        // Swallow unhandled triggers to prevent crashes
        console.warn("⚠️ Swallowing unhandled trigger definition for SQLite:", sqliteSql.substring(0, 50) + "...");
        resolve({ rows: [] });
        return;
      }
    }

    // ── 10. Extract ALTER TABLE from DO blocks ─────────────────────────────
    if (upperSql.includes("DO $$") && upperSql.includes("ALTER TABLE")) {
      const alterMatch = sqliteSql.match(/ALTER\s+TABLE\s+[\s\S]+?;/i);
      if (alterMatch) {
        sqliteSql = alterMatch[0];
      } else {
        resolve({ rows: [] });
        return;
      }
    } else if (upperSql.includes("DO $$")) {
      resolve({ rows: [] });
      return;
    }

    // ── 11. ADD COLUMN IF NOT EXISTS fallback ──────────────────────────────
    sqliteSql = sqliteSql.replace(/ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS/gi, "ADD COLUMN");

    const runQuery = (singleSql, singleParams) => {
      return new Promise((res, rej) => {
        const isSelectQuery = singleSql.trim().toUpperCase().startsWith("SELECT") || singleSql.trim().toUpperCase().startsWith("WITH");
        if (isSelectQuery) {
          db.all(singleSql, singleParams, (err, rows) => {
            if (err) rej(err);
            else res({ rows });
          });
        } else {
          db.run(singleSql, singleParams, function (err) {
            if (err) {
              // Ignore "duplicate column name" error for ALTER TABLE
              if (err.message.includes("duplicate column name")) {
                res({ rows: [], lastID: this?.lastID, changes: this?.changes });
              } else {
                rej(err);
              }
            } else {
              res({ rows: [], lastID: this.lastID, changes: this.changes });
            }
          });
        }
      });
    };

    // Split multiple statements (basic split)
    const statements = sqliteSql.split(";").map(s => s.trim()).filter(s => s.length > 0);

    if (statements.length > 1) {
      // Run multiple statements in sequence
      (async () => {
        try {
          let lastResult = { rows: [] };
          for (const stmt of statements) {
            lastResult = await runQuery(stmt, []); // Assume no params for multi-statement blocks
          }
          resolve(lastResult);
        } catch (err) {
          reject(err);
        }
      })();
    } else if (statements.length === 1) {
      runQuery(statements[0], newParams).then(resolve).catch(reject);
    } else {
      resolve({ rows: [] });
    }
  });
};

const exec = (sql) => {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

const getClient = async () => {
  return { query, exec, release: () => {} };
};

module.exports = {
  query, exec, getClient,
  pool: { connect: getClient, query, exec },
  getPool: () => ({ query, exec, connect: getClient }),
};
