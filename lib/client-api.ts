import { z } from "zod"
import { recordSchema } from "./records"
const errorSchema = z.object({
  error: z.string(),
  fields: z.record(z.string(), z.string()).optional(),
})
const listSchema = z.object({ records: z.array(recordSchema) })
const saveSchema = z.object({ record: recordSchema })
export class ApiError extends Error {
  constructor(
    message: string,
    public fields: Record<string, string> = {}
  ) {
    super(message)
  }
}
async function request(url: string, options?: RequestInit) {
  let response: Response
  try {
    response = await fetch(url, { ...options, cache: "no-store" })
  } catch {
    throw new ApiError(
      "Could not reach the server. Check your connection and try again."
    )
  }
  if (!response.ok) {
    const error = errorSchema.safeParse(await response.json().catch(() => null))
    throw new ApiError(
      error.success
        ? error.data.error
        : "The request failed. Please try again.",
      error.success ? error.data.fields : undefined
    )
  }
  return response
}
export async function fetchRecords(url: string) {
  const response = await request(url)
  return listSchema.parse(await response.json()).records
}
export async function saveRecord(
  url: string,
  method: "POST" | "PUT",
  input: unknown
) {
  const response = await request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  return saveSchema.parse(await response.json()).record
}
export async function deleteRecord(url: string) {
  await request(url, { method: "DELETE" })
}
