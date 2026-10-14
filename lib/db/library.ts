import { z } from "zod"
import { bookSchema } from "../records"
import { createRepository } from "./repository"
export const libraryDb = createRepository({
  file: "library.db",
  table: "books",
  schema: `CREATE TABLE IF NOT EXISTS books (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, author TEXT NOT NULL, isbn TEXT NOT NULL UNIQUE, availableCopies INTEGER NOT NULL CHECK(availableCopies BETWEEN 0 AND 10000))`,
  columns: ["title", "author", "isbn", "availableCopies"],
  seeds: [
    ["Clean Code", "Robert C. Martin", "9780132350884", 4],
    [
      "The Pragmatic Programmer",
      "David Thomas & Andrew Hunt",
      "9780135957059",
      3,
    ],
    [
      "Designing Data-Intensive Applications",
      "Martin Kleppmann",
      "9781449373320",
      5,
    ],
    ["Introduction to Algorithms", "Thomas H. Cormen", "9780262046305", 2],
    ["Refactoring", "Martin Fowler", "9780134757599", 3],
    ["Design Patterns", "Erich Gamma et al.", "9780201633610", 0],
    ["You Don't Know JS Yet: Get Started", "Kyle Simpson", "9798602477429", 6],
    ["Learning React", "Alex Banks & Eve Porcello", "9781492051725", 4],
    ["Database System Concepts", "Abraham Silberschatz", "9780078022159", 2],
    ["Computer Networks", "Andrew S. Tanenbaum", "9780132126953", 3],
    ["Operating System Concepts", "Abraham Silberschatz", "9781119800361", 0],
    [
      "Artificial Intelligence: A Modern Approach",
      "Stuart Russell & Peter Norvig",
      "9780134610993",
      4,
    ],
    ["The Lean Startup", "Eric Ries", "9780307887894", 5],
    ["Thinking, Fast and Slow", "Daniel Kahneman", "9780374533557", 3],
    ["A Brief History of Time", "Stephen Hawking", "9780553380163", 7],
    ["Silent Spring", "Rachel Carson", "9780618249060", 2],
    ["The Design of Everyday Things", "Don Norman", "9780465050659", 4],
    ["Don't Make Me Think", "Steve Krug", "9780321965516", 3],
    ["Code Complete", "Steve McConnell", "9780735619678", 1],
    [
      "Working Effectively with Legacy Code",
      "Michael Feathers",
      "9780131177055",
      0,
    ],
  ],
  rowSchema: bookSchema.extend({ id: z.number().int().positive() }),
})
