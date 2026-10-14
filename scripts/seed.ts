import { studentsDb } from "../lib/db/students"
import { coursesDb } from "../lib/db/courses"
import { libraryDb } from "../lib/db/library"
for (const [name, database] of [
  ["Students", studentsDb],
  ["Courses", coursesDb],
  ["Library", libraryDb],
] as const) {
  console.info(`${name}: ${database.list().length} records`)
  database.close()
}
