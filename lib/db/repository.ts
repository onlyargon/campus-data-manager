import { mkdirSync } from "node:fs"
import { join } from "node:path"
import { DatabaseSync, type SQLInputValue } from "node:sqlite"
import { z } from "zod"

export class RecordNotFoundError extends Error {}

/** One closure and one connection per database. Seed once, even after all rows are deleted. */
export function createRepository<T extends { id: number }>({
  file,
  table,
  schema,
  columns,
  seeds,
  rowSchema,
}: {
  file: string
  table: string
  schema: string
  columns: string[]
  seeds: SQLInputValue[][]
  rowSchema: z.ZodType<T>
}) {
  let connection: DatabaseSync | undefined
  function db() {
    if (connection) return connection
    const directory = process.env.CAMPUS_DATA_DIR || join(process.cwd(), "data")
    mkdirSync(directory, { recursive: true })
    const database = new DatabaseSync(
      join(/* turbopackIgnore: true */ directory, file)
    )
    database.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;")
    database.exec("BEGIN IMMEDIATE")
    try {
      database.exec(schema)
      database.exec(
        "CREATE TABLE IF NOT EXISTS seed_versions (version INTEGER PRIMARY KEY)"
      )
      if (
        !database
          .prepare("SELECT version FROM seed_versions WHERE version = 1")
          .get()
      ) {
        const insert = database.prepare(
          `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`
        )
        seeds.forEach((values) => insert.run(...values))
        database.exec("INSERT INTO seed_versions (version) VALUES (1)")
      }
      database.exec("COMMIT")
    } catch (error) {
      database.exec("ROLLBACK")
      database.close()
      throw error
    }
    connection = database
    return database
  }
  const projection = `id, ${columns.join(", ")}`
  function list() {
    return db()
      .prepare(`SELECT ${projection} FROM ${table} ORDER BY id`)
      .all()
      .map((row) => rowSchema.parse(row))
  }
  function get(id: number) {
    const row = db()
      .prepare(`SELECT ${projection} FROM ${table} WHERE id = ?`)
      .get(id)
    if (!row)
      throw new RecordNotFoundError(
        "This record no longer exists. Refresh the table and try again."
      )
    return rowSchema.parse(row)
  }
  return {
    list,
    create(values: SQLInputValue[]) {
      const result = db()
        .prepare(
          `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`
        )
        .run(...values)
      return get(Number(result.lastInsertRowid))
    },
    update(id: number, values: SQLInputValue[]) {
      const result = db()
        .prepare(
          `UPDATE ${table} SET ${columns.map((column) => `${column} = ?`).join(", ")} WHERE id = ?`
        )
        .run(...values, id)
      if (result.changes === 0)
        throw new RecordNotFoundError(
          "This record no longer exists. Refresh the table and try again."
        )
      return get(id)
    },
    delete(id: number) {
      const result = db().prepare(`DELETE FROM ${table} WHERE id = ?`).run(id)
      if (result.changes === 0)
        throw new RecordNotFoundError(
          "This record no longer exists. Refresh the table and try again."
        )
    },
    close() {
      connection?.close()
      connection = undefined
    },
  }
}
