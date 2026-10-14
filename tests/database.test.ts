import assert from "node:assert/strict"
import { mkdtempSync, readdirSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { spawnSync } from "node:child_process"
import { after, before, test } from "node:test"
import { studentsDb } from "../lib/db/students"
import { coursesDb } from "../lib/db/courses"
import { libraryDb } from "../lib/db/library"
import {
  studentsHandlers,
  coursesHandlers,
  libraryHandlers,
} from "../lib/db/handlers"

let directory: string
const priorDirectory = process.env.CAMPUS_DATA_DIR
before(() => {
  directory = mkdtempSync(join(tmpdir(), "campus-db-test-"))
  process.env.CAMPUS_DATA_DIR = directory
})
after(() => {
  ;[studentsDb, coursesDb, libraryDb].forEach((database) => database.close())
  if (priorDirectory === undefined) delete process.env.CAMPUS_DATA_DIR
  else process.env.CAMPUS_DATA_DIR = priorDirectory
  rmSync(directory, { recursive: true, force: true })
})
const request = (path: string, input: unknown, method = "POST") =>
  new Request(`http://localhost/api/${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
const context = (id: number | string) => ({
  params: Promise.resolve({ id: String(id) }),
})
const fixtures = [
  {
    name: "students",
    database: studentsDb,
    handlers: studentsHandlers,
    count: 15,
    input: {
      name: "Test Student",
      email: "test@campus.fi",
      programme: "Testing",
      studyYear: 1,
    },
    edited: {
      name: "Updated Student",
      email: "test@campus.fi",
      programme: "Testing",
      studyYear: 2,
    },
    invalid: {
      name: "Test",
      email: "invalid",
      programme: "Test",
      studyYear: 0,
    },
  },
  {
    name: "courses",
    database: coursesDb,
    handlers: coursesHandlers,
    count: 12,
    input: {
      code: "TEST101",
      title: "Testing",
      credits: 5,
      lecturer: "Test Lecturer",
    },
    edited: {
      code: "TEST101",
      title: "Updated course",
      credits: 6,
      lecturer: "Test Lecturer",
    },
    invalid: { code: "", title: "Test", credits: -1, lecturer: "Test" },
  },
  {
    name: "library",
    database: libraryDb,
    handlers: libraryHandlers,
    count: 20,
    input: {
      title: "Test book",
      author: "Test Author",
      isbn: "9780132350990",
      availableCopies: 2,
    },
    edited: {
      title: "Updated book",
      author: "Test Author",
      isbn: "9780132350990",
      availableCopies: 0,
    },
    invalid: { title: "Test", author: "Test", isbn: "no", availableCopies: -1 },
  },
] as const

test("each SQLite database supports validated CRUD and stays isolated", async (t) => {
  assert.deepEqual(
    fixtures.map((fixture) => fixture.database.list().length),
    [15, 12, 20]
  )
  assert.deepEqual(
    readdirSync(directory)
      .filter((name) => name.endsWith(".db"))
      .sort(),
    ["courses.db", "library.db", "students.db"]
  )
  for (const fixture of fixtures) {
    await t.test(fixture.name, async () => {
      const otherSnapshots = fixtures
        .filter((other) => other.name !== fixture.name)
        .map((other) => ({
          database: other.database,
          rows: other.database.list(),
        }))
      const created = await fixture.handlers.POST(
        request(fixture.name, fixture.input)
      )
      assert.equal(created.status, 201)
      const body = await created.json()
      const id = body.record.id
      assert.equal(fixture.database.list().length, fixture.count + 1)
      assert.equal(
        (await fixture.handlers.POST(request(fixture.name, fixture.input)))
          .status,
        409
      )
      assert.equal(
        (await fixture.handlers.POST(request(fixture.name, fixture.invalid)))
          .status,
        400
      )
      assert.equal(
        (await fixture.handlers.POST(request(fixture.name, null))).status,
        400
      )
      assert.equal(
        (
          await fixture.handlers.PUT(
            request(fixture.name, fixture.edited, "PUT"),
            context(id)
          )
        ).status,
        200
      )
      fixture.database.close()
      assert.deepEqual(
        fixture.database.list().find((row) => row.id === id),
        { ...fixture.edited, id }
      )
      otherSnapshots.forEach(({ database, rows }) =>
        assert.deepEqual(database.list(), rows)
      )
      assert.equal(
        (
          await fixture.handlers.DELETE(
            new Request(`http://localhost/api/${fixture.name}/${id}`, {
              method: "DELETE",
            }),
            context(id)
          )
        ).status,
        204
      )
      assert.equal(fixture.database.list().length, fixture.count)
      assert.equal(
        (
          await fixture.handlers.DELETE(
            new Request("http://localhost", { method: "DELETE" }),
            context(id)
          )
        ).status,
        404
      )
      assert.equal(
        (
          await fixture.handlers.PUT(
            request(fixture.name, fixture.edited, "PUT"),
            context("12junk")
          )
        ).status,
        400
      )
      assert.equal(
        (
          await fixture.handlers.PUT(
            request(fixture.name, fixture.edited, "PUT"),
            context(999999)
          )
        ).status,
        404
      )
      const hostile = request(fixture.name, fixture.input)
      hostile.headers.set("Origin", "https://example.com")
      assert.equal((await fixture.handlers.POST(hostile)).status, 403)
    })
  }
})

test("seed is repeatable across a fresh process and never restores deleted records", () => {
  const runSeed = () => {
    const result = spawnSync(
      process.execPath,
      ["--import", "tsx", "scripts/seed.ts"],
      { encoding: "utf8", env: { ...process.env, CAMPUS_DATA_DIR: directory } }
    )
    assert.equal(result.status, 0, result.stderr)
    return result.stdout
  }
  assert.match(runSeed(), /Students: 15 records/)
  assert.match(runSeed(), /Library: 20 records/)
  studentsDb.list().forEach((row) => studentsDb.delete(row.id))
  studentsDb.close()
  assert.match(runSeed(), /Students: 0 records/)
  assert.equal(studentsDb.list().length, 0)
  assert.equal(coursesDb.list().length, 12)
  assert.equal(libraryDb.list().length, 20)
})

test("case-insensitive emails and codes cannot bypass uniqueness", async () => {
  const student = {
    name: "Unique",
    email: "unique@campus.fi",
    programme: "Test",
    studyYear: 1,
  }
  assert.equal(
    (await studentsHandlers.POST(request("students", student))).status,
    201
  )
  assert.equal(
    (
      await studentsHandlers.POST(
        request("students", { ...student, email: "UNIQUE@CAMPUS.FI" })
      )
    ).status,
    409
  )
  assert.equal(
    (
      await coursesHandlers.POST(
        request("courses", {
          code: "cs101",
          title: "Duplicate",
          credits: 5,
          lecturer: "Test",
        })
      )
    ).status,
    409
  )
  assert.equal(
    (
      await libraryHandlers.POST(
        request("library", {
          title: "Duplicate",
          author: "Test",
          isbn: "978-0-13-235088-4",
          availableCopies: 1,
        })
      )
    ).status,
    409
  )
})

test("legitimate writes use the incoming Host header when Next.js normalizes the request URL", async () => {
  const headers = {
    "Content-Type": "application/json",
    Host: "127.0.0.1:3001",
    Origin: "http://127.0.0.1:3001",
  }
  const input = {
    code: "HOST101",
    title: "Host verification",
    credits: 5,
    lecturer: "Test",
  }
  const response = await coursesHandlers.POST(
    new Request("http://localhost:3001/api/courses", {
      method: "POST",
      headers,
      body: JSON.stringify(input),
    })
  )
  assert.equal(response.status, 201)
  const { record } = await response.json()
  const updated = await coursesHandlers.PUT(
    new Request("http://localhost:3001/api/courses", {
      method: "PUT",
      headers,
      body: JSON.stringify({ ...input, credits: 6 }),
    }),
    context(record.id)
  )
  assert.equal(updated.status, 200)
  const deleted = await coursesHandlers.DELETE(
    new Request("http://localhost:3001/api/courses", {
      method: "DELETE",
      headers,
    }),
    context(record.id)
  )
  assert.equal(deleted.status, 204)
})
