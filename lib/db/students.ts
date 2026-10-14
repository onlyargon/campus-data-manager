import { z } from "zod"
import { studentSchema } from "../records"
import { createRepository } from "./repository"

const students = [
  ["Aino Virtanen", "Software Engineering", 2],
  ["Oliver Korhonen", "Business Administration", 1],
  ["Sofia Nieminen", "Computer Science", 3],
  ["Elias Mäkinen", "Software Engineering", 1],
  ["Emma Hämäläinen", "Environmental Engineering", 2],
  ["Leo Laine", "Computer Science", 2],
  ["Olivia Heikkinen", "Business Administration", 3],
  ["Eetu Koskinen", "Mechanical Engineering", 4],
  ["Venla Järvinen", "Software Engineering", 3],
  ["Onni Lehtonen", "Computer Science", 1],
  ["Liam Patel", "Environmental Engineering", 1],
  ["Amelia Chen", "Software Engineering", 2],
  ["Noah Williams", "Mechanical Engineering", 2],
  ["Isla Ahmed", "Business Administration", 2],
  ["Lucas Berg", "Computer Science", 4],
] satisfies [string, string, number][]
export const studentsDb = createRepository({
  file: "students.db",
  table: "students",
  schema: `CREATE TABLE IF NOT EXISTS students (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL COLLATE NOCASE UNIQUE, programme TEXT NOT NULL, studyYear INTEGER NOT NULL CHECK(studyYear BETWEEN 1 AND 8))`,
  columns: ["name", "email", "programme", "studyYear"],
  seeds: students.map(([name, programme, year], index) => [
    name,
    `student${String(index + 1).padStart(2, "0")}@campus.fi`,
    programme,
    year,
  ]),
  rowSchema: studentSchema.extend({ id: z.number().int().positive() }),
})
