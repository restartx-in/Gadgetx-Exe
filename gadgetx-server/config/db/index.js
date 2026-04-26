const sqlite3 = require("sqlite3").verbose();
const path = require("path");
require("dotenv").config();

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

    // ── 4. Convert $1, $2, … positional params → ? ────────────────────────
    let newParams = [];
    sqliteSql = sqliteSql.replace(/\$(\d+)/g, (match, p1) => {
      newParams.push(params[parseInt(p1, 10) - 1]);
      return "?";
    });

    // ── 5. Detect query type ───────────────────────────────────────────────
    const upperSql = sqliteSql.trim().toUpperCase();
    const isSelect   = upperSql.startsWith("SELECT") || upperSql.startsWith("WITH");
    const isReturning = upperSql.includes("RETURNING");

    if (isSelect || isReturning) {
      db.all(sqliteSql, newParams, (err, rows) => {
        if (err) {
          console.error("SQLite query error:", err.message);
          reject(err);
        } else {
          resolve({ rows });
        }
      });
    } else {
      db.run(sqliteSql, newParams, function (err) {
        if (err) {
          console.error("SQLite run error:", err.message);
          reject(err);
        } else {
          resolve({ rows: [], lastID: this.lastID, changes: this.changes });
        }
      });
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
