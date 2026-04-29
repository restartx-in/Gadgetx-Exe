const sqlite3 = require('sqlite3').verbose()
const path = require('path')
// NOTE: Do NOT call dotenv.config() here — it is already loaded by server.js
// In production (Electron), DB_FILE is injected directly via fork() env vars.

const dbPath =
  process.env.DB_FILE && path.isAbsolute(process.env.DB_FILE)
    ? process.env.DB_FILE
    : path.resolve(__dirname, '../../', process.env.DB_FILE || 'inventoryx.db')
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Failed to connect to SQLite database:', err.message)
  } else {
    console.log('✅ Connected to SQLite database at:', dbPath)
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON;')
  }
})

// Helper to run queries as promises
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    // ── 0. Early bail-out for PostgreSQL $$ function/procedure blocks ──────
    if (/\$\$[\s\S]*?\$\$/i.test(sql)) {
      resolve({ rows: [] })
      return
    }

    let sqliteSql = sql

    // ── 1. PostgreSQL → SQLite function translations ───────────────────────

    // ── Strip PostgreSQL type casts (::text, ::integer, etc.) first ───────────
    sqliteSql = sqliteSql.replace(
      /([a-zA-Z0-9_.]+)::integer/gi,
      'CAST($1 AS INTEGER)',
    )
    sqliteSql = sqliteSql.replace(
      /([a-zA-Z0-9_.]+)::text/gi,
      'CAST($1 AS TEXT)',
    )
    sqliteSql = sqliteSql.replace(/::[a-zA-Z0-9_]+(?:\[\s*\])?/g, '') // Matches ::type and ::type[]

    sqliteSql = sqliteSql.replace(
      /TO_CHAR\s*\(\s*([^,]+?)\s*,\s*'YYYY-MM-DD'\s*\)/gi,
      "strftime('%Y-%m-%d', $1)",
    )
    sqliteSql = sqliteSql.replace(
      /TO_CHAR\s*\(\s*([^,]+?)\s*,\s*'YYYY-MM'\s*\)/gi,
      "strftime('%Y-%m', $1)",
    )
    sqliteSql = sqliteSql.replace(
      /TRIM\s*\(\s*TO_CHAR\s*\([^,]+,\s*'Month'\s*\)\s*\)/gi,
      "strftime('%m', date)",
    )
    sqliteSql = sqliteSql.replace(
      /DATE_TRUNC\s*\(\s*'month'\s*,\s*([^)]+)\)/gi,
      "strftime('%Y-%m', $1)",
    )
    sqliteSql = sqliteSql.replace(
      /DATE_TRUNC\s*\(\s*'year'\s*,\s*([^)]+)\)/gi,
      "strftime('%Y', $1)",
    )
    sqliteSql = sqliteSql.replace(
      /DATE_TRUNC\s*\(\s*'day'\s*,\s*([^)]+)\)/gi,
      'DATE($1)',
    )
    sqliteSql = sqliteSql.replace(
      /EXTRACT\s*\(\s*YEAR\s+FROM\s+([^)]+)\)/gi,
      "CAST(strftime('%Y', $1) AS INTEGER)",
    )
    sqliteSql = sqliteSql.replace(
      /EXTRACT\s*\(\s*MONTH\s+FROM\s+([^)]+)\)/gi,
      "CAST(strftime('%m', $1) AS INTEGER)",
    )
    sqliteSql = sqliteSql.replace(/\bJSON_AGG\b/gi, 'JSON_GROUP_ARRAY')
    sqliteSql = sqliteSql.replace(/\bJSON_BUILD_OBJECT\b/gi, 'JSON_OBJECT')

    // 1. Handle "val = ANY($1)" or "val = ANY(column)" -> "val IN (SELECT value FROM JSON_EACH(...))"
    sqliteSql = sqliteSql.replace(
      /(\$\d+|[a-zA-Z0-9_.]+)\s*=\s*ANY\s*\(([^)]+)\)/gi,
      '$1 IN (SELECT value FROM JSON_EACH($2))',
    )

    // 2. Handle remaining "ANY($1)" -> "IN (SELECT value FROM JSON_EACH(?))"
    // This handles cases like "id IN (ANY($1))" or just "ANY($1)" if it's used elsewhere
    sqliteSql = sqliteSql.replace(
      /\bANY\s*\(\s*\$(\d+)\s*\)/gi,
      (match, p1) => {
        return `IN (SELECT value FROM JSON_EACH($${p1}))`
      },
    )

    // ARRAY[1,2,3] -> JSON('[1,2,3]')
    sqliteSql = sqliteSql.replace(/\bARRAY\s*\[([\s\S]*?)\]/gi, "JSON('[$1]')")

    // ── 2. ILIKE → LIKE ────────────────────────────────────────────────────
    sqliteSql = sqliteSql.replace(/\bILIKE\b/gi, 'LIKE')

    // ── 4. to_regclass fallback ────────────────────────────────────────────
    sqliteSql = sqliteSql.replace(
      /SELECT\s+to_regclass\s*\(\s*['"](?:public\.)?["']?(.+?)["']?['"]\s*\)\s+AS\s+table_name/gi,
      "SELECT (SELECT name FROM sqlite_master WHERE type='table' AND name='$1') AS table_name",
    )

    // ── 5. SERIAL → INTEGER PRIMARY KEY AUTOINCREMENT ──────────────────────
    sqliteSql = sqliteSql.replace(
      /\bSERIAL\s+PRIMARY\s+KEY\b/gi,
      'INTEGER PRIMARY KEY AUTOINCREMENT',
    )
    sqliteSql = sqliteSql.replace(/\bSERIAL\b/gi, 'INTEGER') // Fallback for SERIAL without PRIMARY KEY

    // ── 6. More Type Translations ──────────────────────────────────────────
    sqliteSql = sqliteSql.replace(/\bTEXT\s*\[\s*\]/gi, 'TEXT')
    sqliteSql = sqliteSql.replace(/\bINTEGER\s*\[\s*\]/gi, 'TEXT')
    sqliteSql = sqliteSql.replace(/\bINT\s*\[\s*\]/gi, 'TEXT')
    sqliteSql = sqliteSql.replace(/\bUUID\b/gi, 'TEXT')
    sqliteSql = sqliteSql.replace(/\bJSONB\b/gi, 'JSON')
    sqliteSql = sqliteSql.replace(
      /\bTIMESTAMP\s+WITH\s+TIME\s+ZONE\b/gi,
      'TIMESTAMP',
    )
    sqliteSql = sqliteSql.replace(/\bNOW\s*\(\s*\)/gi, 'CURRENT_TIMESTAMP')
    // gen_random_uuid() -> (lower(hex(randomblob(16))))
    sqliteSql = sqliteSql.replace(
      /\bgen_random_uuid\s*\(\s*\)/gi,
      '(lower(hex(randomblob(16))))',
    )
    sqliteSql = sqliteSql.replace(/DEFAULT\s+'\{[\s\S]*?\}'/gi, "DEFAULT '[]'")
    sqliteSql = sqliteSql.replace(/DEFAULT\s+'\[[\s\S]*?\]'/gi, "DEFAULT '[]'")

    // ── 7. Convert $1, $2, … positional params → ? ────────────────────────
    let newParams = []
    sqliteSql = sqliteSql.replace(/\$(\d+)/g, (match, p1) => {
      const idx = parseInt(p1, 10) - 1
      let val = params[idx]
      // Special handling for arrays being passed to IN clause
      if (Array.isArray(val)) {
        val = JSON.stringify(val)
      }
      newParams.push(val)
      return '?'
    })

    const upperSql = sqliteSql.trim().toUpperCase()
    const isSelect =
      upperSql.startsWith('SELECT') || upperSql.startsWith('WITH')
    let isReturning = upperSql.includes('RETURNING')
    let returningTable = null

    if (isReturning && !isSelect) {
      // Try to find the table name for the fallback SELECT
      const insertMatch = sqliteSql.match(
        /INSERT\s+INTO\s+["']?([a-zA-Z0-9_]+)["']?/i,
      )
      const updateMatch = sqliteSql.match(/UPDATE\s+["']?([a-zA-Z0-9_]+)["']?/i)
      returningTable = insertMatch
        ? insertMatch[1]
        : updateMatch
          ? updateMatch[1]
          : null

      // Strip the RETURNING clause but stop at semicolon or end of string
      sqliteSql = sqliteSql.replace(/\bRETURNING\b\s+[^;]*/gi, '').trim()
    }

    const upperSqlOriginal = sqliteSql.trim().toUpperCase()

    if (
      upperSqlOriginal.includes('CREATE OR REPLACE FUNCTION') ||
      upperSqlOriginal.includes('CREATE TRIGGER') ||
      upperSqlOriginal.includes('LANGUAGE PLPGSQL')
    ) {
      console.log('ℹ️ Skipping Postgres-specific trigger/function block.')
      resolve({ rows: [] })
      return
    }

    // ── 9. Extract ALTER TABLE from DO blocks (BEFORE splitting) ───────────
    if (
      upperSqlOriginal.includes('DO $$') &&
      upperSqlOriginal.includes('ALTER TABLE')
    ) {
      const alterMatch = sqliteSql.match(/ALTER\s+TABLE\s+[\s\S]+?;/i)
      if (alterMatch) {
        sqliteSql = alterMatch[0]
      } else {
        // If no semicolon found inside, maybe it's just a fragment or poorly formatted
        const simpleAlterMatch = sqliteSql.match(/ALTER\s+TABLE\s+[\s\S]+/i)
        if (simpleAlterMatch) {
          sqliteSql = simpleAlterMatch[0]
        } else {
          resolve({ rows: [] })
          return
        }
      }
    }

    // Split multiple statements (basic split)
    const statements = sqliteSql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    const runQuery = (singleSql, singleParams) => {
      return new Promise((res, rej) => {
        let stmtSql = singleSql
        const upperStmtSql = stmtSql.trim().toUpperCase()

        // ── 9. Basic Trigger Translation (for updated_at) ──────────────────
        if (
          upperStmtSql.includes('CREATE TRIGGER') &&
          (upperStmtSql.includes('EXECUTE FUNCTION') ||
            upperStmtSql.includes('EXECUTE PROCEDURE'))
        ) {
          const triggerMatch = stmtSql.match(
            /CREATE\s+TRIGGER\s+(\w+)\s+BEFORE\s+UPDATE\s+ON\s+(\w+)/i,
          )
          if (triggerMatch) {
            const [_, triggerName, tableName] = triggerMatch
            stmtSql = `
              CREATE TRIGGER IF NOT EXISTS ${triggerName} AFTER UPDATE ON ${tableName}
              BEGIN
                UPDATE ${tableName} SET updated_at = CURRENT_TIMESTAMP WHERE rowid = NEW.rowid;
              END;
            `
          } else {
            console.warn(
              '⚠️ Swallowing unhandled trigger definition for SQLite:',
              stmtSql.substring(0, 50) + '...',
            )
            res({ rows: [] })
            return
          }
        }

        // ── 11. ADD COLUMN IF NOT EXISTS fallback ──────────────────────────
        stmtSql = stmtSql.replace(
          /ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS/gi,
          'ADD COLUMN',
        )

        const isSelectQuery =
          stmtSql.trim().toUpperCase().startsWith('SELECT') ||
          stmtSql.trim().toUpperCase().startsWith('WITH')
        if (isSelectQuery) {
          db.all(stmtSql, singleParams, (err, rows) => {
            if (err) {
              console.error('❌ SQLite Query Error:', err.message)
              console.error('SQL:', stmtSql)
              console.error('Params:', singleParams)
              rej(err)
            } else {
              // Auto-parse JSON strings for Postgres compatibility
              const parsedRows = rows.map((row) => {
                const newRow = { ...row }
                for (const key in newRow) {
                  const val = newRow[key]
                  if (
                    typeof val === 'string' &&
                    (val.startsWith('[') || val.startsWith('{'))
                  ) {
                    try {
                      newRow[key] = JSON.parse(val)
                    } catch (e) {
                      // Not valid JSON, keep as is
                    }
                  }
                }
                return newRow
              })
              res({ rows: parsedRows })
            }
          })
        } else {
          db.run(stmtSql, singleParams, function (err) {
            if (err) {
              if (err.message.includes('duplicate column name')) {
                res({ rows: [], lastID: this?.lastID, changes: this?.changes })
              } else {
                console.error('❌ SQLite Run Error:', err.message)
                console.error('SQL:', stmtSql)
                console.error('Params:', singleParams)
                rej(err)
              }
            } else {
              res({ rows: [], lastID: this.lastID, changes: this.changes })
            }
          })
        }
      })
    }

    if (statements.length > 1) {
      // Run multiple statements in sequence
      ;(async () => {
        try {
          let lastResult = { rows: [] }
          for (const stmt of statements) {
            lastResult = await runQuery(stmt, []) // Assume no params for multi-statement blocks
          }
          resolve(lastResult)
        } catch (err) {
          reject(err)
        }
      })()
    } else if (statements.length === 1) {
      runQuery(statements[0], newParams)
        .then(async (result) => {
          if (isReturning && returningTable && upperSql.includes('UPDATE')) {
            try {
              const id = newParams[newParams.length - 2]

              const selectResult = await runQuery(
                `SELECT * FROM "${returningTable}" WHERE id = ?`,
                [id],
              )

              if (selectResult.rows && selectResult.rows.length > 0) {
                resolve({ rows: [selectResult.rows[0]] })
              } else {
                resolve(result)
              }
            } catch (err) {
              resolve(result)
            }
          } else if (isReturning && returningTable && result.lastID) {
            try {
              const row = await runQuery(
                `SELECT * FROM "${returningTable}" WHERE id = ?`,
                [result.lastID],
              )
              resolve(row)
            } catch (err) {
              resolve(result)
            }
          } else {
            resolve(result)
          }
        })
        .catch(reject)
    } else {
      resolve({ rows: [] })
    }
  })
}

const exec = (sql) => {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

const getClient = async () => {
  return { query, exec, release: () => {} }
}

module.exports = {
  query,
  exec,
  getClient,
  pool: { connect: getClient, query, exec },
  getPool: () => ({ query, exec, connect: getClient }),
}
