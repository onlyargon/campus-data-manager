import { z } from "zod"
import { courseSchema } from "../records"
import { createRepository } from "./repository"
export const coursesDb = createRepository({
  file: "courses.db",
  table: "courses",
  schema: `CREATE TABLE IF NOT EXISTS courses (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT NOT NULL COLLATE NOCASE UNIQUE, title TEXT NOT NULL, credits INTEGER NOT NULL CHECK(credits BETWEEN 1 AND 60), lecturer TEXT NOT NULL)`,
  columns: ["code", "title", "credits", "lecturer"],
  seeds: [
    ["CS101", "Introduction to Programming", 5, "Dr. Laura Niemi"],
    ["CS201", "Data Structures and Algorithms", 6, "Dr. Mika Salonen"],
    ["SE101", "Software Engineering Fundamentals", 5, "Dr. Laura Niemi"],
    ["SE202", "Web Application Development", 5, "Dr. James Wilson"],
    ["CS301", "Database Systems", 5, "Dr. Mika Salonen"],
    ["BA101", "Principles of Management", 5, "Dr. Anna Lehto"],
    ["BA201", "Business Analytics", 6, "Dr. Anna Lehto"],
    ["EN101", "Sustainable Development", 5, "Dr. Sari Ranta"],
    ["ME101", "Engineering Mechanics", 6, "Dr. Pekka Aalto"],
    ["CS302", "Artificial Intelligence", 6, "Dr. James Wilson"],
    ["SE303", "Software Testing", 5, "Dr. Laura Niemi"],
    ["MA101", "Applied Mathematics", 5, "Dr. Pekka Aalto"],
  ],
  rowSchema: courseSchema.extend({ id: z.number().int().positive() }),
})
