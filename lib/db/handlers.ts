import { studentSchema, courseSchema, bookSchema } from "../records"
import { createHandlers } from "./api"
import { studentsDb } from "./students"
import { coursesDb } from "./courses"
import { libraryDb } from "./library"
export const studentsHandlers = createHandlers({
  repository: studentsDb,
  schema: studentSchema,
  uniqueField: "email",
  values: (record) => [
    record.name,
    record.email,
    record.programme,
    record.studyYear,
  ],
})
export const coursesHandlers = createHandlers({
  repository: coursesDb,
  schema: courseSchema,
  uniqueField: "code",
  values: (record) => [
    record.code,
    record.title,
    record.credits,
    record.lecturer,
  ],
})
export const libraryHandlers = createHandlers({
  repository: libraryDb,
  schema: bookSchema,
  uniqueField: "isbn",
  values: (record) => [
    record.title,
    record.author,
    record.isbn,
    record.availableCopies,
  ],
})
