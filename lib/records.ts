import { z } from "zod"

const text = (label: string, max = 160) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} is too long.`)
export const studentSchema = z.object({
  name: text("Name"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address.")
    .max(254),
  programme: text("Programme"),
  studyYear: z
    .number()
    .int("Study year must be a whole number.")
    .min(1, "Study year must be at least 1.")
    .max(8, "Study year must be between 1 and 8."),
})
export const courseSchema = z.object({
  code: text("Course code", 24).transform((value) => value.toUpperCase()),
  title: text("Title"),
  credits: z
    .number()
    .int("Credits must be a whole number.")
    .min(1, "Credits must be at least 1.")
    .max(60, "Credits must be between 1 and 60."),
  lecturer: text("Lecturer"),
})
export const bookSchema = z.object({
  title: text("Title", 240),
  author: text("Author"),
  isbn: z
    .string()
    .trim()
    .transform((value) => value.replace(/[-\s]/g, ""))
    .refine(
      (value) => /^(\d{13}|\d{9}[\dXx])$/.test(value),
      "Enter a 10 or 13 character ISBN."
    ),
  availableCopies: z
    .number()
    .int("Copies must be a whole number.")
    .min(0, "Available copies cannot be negative.")
    .max(10000, "Available copies must be 10,000 or less."),
})
export const databaseKeys = ["students", "courses", "library"] as const
export type DatabaseKey = (typeof databaseKeys)[number]
export function isDatabaseKey(value: unknown): value is DatabaseKey {
  return value === "students" || value === "courses" || value === "library"
}
export const recordSchema = z.union([
  studentSchema.extend({ id: z.number().int().positive() }),
  courseSchema.extend({ id: z.number().int().positive() }),
  bookSchema.extend({ id: z.number().int().positive() }),
])
export type CampusRecord = z.infer<typeof recordSchema>
export type Student = z.infer<typeof studentSchema> & { id: number }
export type Course = z.infer<typeof courseSchema> & { id: number }
export type Book = z.infer<typeof bookSchema> & { id: number }
export type FieldDefinition = {
  key: string
  label: string
  placeholder: string
  type: "text" | "email" | "number"
  min?: number
  max?: number
  maxLength?: number
}
export const databases = {
  students: {
    label: "Students",
    singular: "student",
    description: "Manage student profiles, programmes, and study years.",
    file: "students.db",
    search: "Search by name, email, or programme…",
    primary: "name",
    filter: "programme",
    filterLabel: "All programmes",
    fields: [
      {
        key: "name",
        label: "Full name",
        placeholder: "e.g. Aino Virtanen",
        type: "text",
        maxLength: 160,
      },
      {
        key: "email",
        label: "Email address",
        placeholder: "e.g. aino.virtanen@campus.fi",
        type: "email",
        maxLength: 254,
      },
      {
        key: "programme",
        label: "Programme",
        placeholder: "e.g. Software Engineering",
        type: "text",
        maxLength: 160,
      },
      {
        key: "studyYear",
        label: "Study year",
        placeholder: "1–8",
        type: "number",
        min: 1,
        max: 8,
      },
    ],
  },
  courses: {
    label: "Courses",
    singular: "course",
    description: "Organise course details, credits, and lecturers.",
    file: "courses.db",
    search: "Search by title, code, or lecturer…",
    primary: "title",
    filter: "lecturer",
    filterLabel: "All lecturers",
    fields: [
      {
        key: "code",
        label: "Course code",
        placeholder: "e.g. CS101",
        type: "text",
        maxLength: 24,
      },
      {
        key: "title",
        label: "Course title",
        placeholder: "e.g. Introduction to Programming",
        type: "text",
        maxLength: 160,
      },
      {
        key: "credits",
        label: "Credits",
        placeholder: "1–60",
        type: "number",
        min: 1,
        max: 60,
      },
      {
        key: "lecturer",
        label: "Lecturer",
        placeholder: "e.g. Dr. Laura Niemi",
        type: "text",
        maxLength: 160,
      },
    ],
  },
  library: {
    label: "Library",
    singular: "book",
    description: "Keep your book catalogue and available copies up to date.",
    file: "library.db",
    search: "Search by title, author, or ISBN…",
    primary: "title",
    filter: "author",
    filterLabel: "All authors",
    fields: [
      {
        key: "title",
        label: "Book title",
        placeholder: "e.g. Clean Code",
        type: "text",
        maxLength: 240,
      },
      {
        key: "author",
        label: "Author",
        placeholder: "e.g. Robert C. Martin",
        type: "text",
        maxLength: 160,
      },
      {
        key: "isbn",
        label: "ISBN",
        placeholder: "e.g. 9780132350884",
        type: "text",
        maxLength: 32,
      },
      {
        key: "availableCopies",
        label: "Available copies",
        placeholder: "0 or more",
        type: "number",
        min: 0,
        max: 10000,
      },
    ],
  },
} satisfies Record<
  DatabaseKey,
  {
    label: string
    singular: string
    description: string
    file: string
    search: string
    primary: string
    filter: string
    filterLabel: string
    fields: FieldDefinition[]
  }
>

export function recordValue(
  record: CampusRecord,
  key: string
): string | number {
  if (key === "id") return record.id
  if ("name" in record) {
    switch (key) {
      case "name":
        return record.name
      case "email":
        return record.email
      case "programme":
        return record.programme
      case "studyYear":
        return record.studyYear
    }
  } else if ("code" in record) {
    switch (key) {
      case "code":
        return record.code
      case "title":
        return record.title
      case "credits":
        return record.credits
      case "lecturer":
        return record.lecturer
    }
  } else {
    switch (key) {
      case "title":
        return record.title
      case "author":
        return record.author
      case "isbn":
        return record.isbn
      case "availableCopies":
        return record.availableCopies
    }
  }
  return ""
}
export function schemaFor(database: DatabaseKey) {
  switch (database) {
    case "students":
      return studentSchema
    case "courses":
      return courseSchema
    case "library":
      return bookSchema
  }
}
