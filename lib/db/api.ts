import { z } from "zod"
import type { SQLInputValue } from "node:sqlite"
import { RecordNotFoundError } from "./repository"

type Repository<T> = {
  list(): T[]
  create(values: SQLInputValue[]): T
  update(id: number, values: SQLInputValue[]): T
  delete(id: number): void
}
const idSchema = z
  .string()
  .regex(/^[1-9]\d*$/)
  .transform(Number)
  .refine(Number.isSafeInteger)
const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } })

// Next.js may normalize request.url to localhost; the Host header carries the browser's authority.
function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin")
  if (!origin) return true
  try {
    const requestUrl = new URL(request.url)
    const expectedHost = request.headers.get("host") ?? requestUrl.host
    const expectedProtocol =
      request.headers.get("x-forwarded-proto") ??
      requestUrl.protocol.slice(0, -1)
    return origin === `${expectedProtocol}://${expectedHost}`
  } catch {
    return false
  }
}

function errorResponse(error: unknown, uniqueField: string) {
  if (error instanceof z.ZodError) {
    const fields: Record<string, string> = {}
    error.issues.forEach((issue) => {
      fields[String(issue.path[0])] ??= issue.message
    })
    return json({ error: "Check the highlighted fields.", fields }, 400)
  }
  if (error instanceof SyntaxError)
    return json({ error: "Send a valid JSON object." }, 400)
  if (error instanceof RecordNotFoundError)
    return json({ error: error.message }, 404)
  if (
    error instanceof Error &&
    error.message.includes("UNIQUE constraint failed")
  ) {
    return json(
      {
        error: `This ${uniqueField} is already in use. Enter a different value.`,
        fields: { [uniqueField]: `This ${uniqueField} is already in use.` },
      },
      409
    )
  }
  console.error("Campus database operation failed", error)
  return json(
    {
      error: "The database could not complete this request. Please try again.",
    },
    500
  )
}

export function createHandlers<Input, Row>({
  repository,
  schema,
  values,
  uniqueField,
}: {
  repository: Repository<Row>
  schema: z.ZodType<Input>
  values: (input: Input) => SQLInputValue[]
  uniqueField: string
}) {
  async function write(request: Request, operation: (input: Input) => Row) {
    if (!isSameOrigin(request)) {
      return json({ error: "Requests must come from this application." }, 403)
    }
    const input = schema.parse(await request.json())
    return operation(input)
  }
  return {
    GET: async () => {
      try {
        return json({ records: repository.list() })
      } catch (error) {
        return errorResponse(error, uniqueField)
      }
    },
    POST: async (request: Request) => {
      try {
        const result = await write(request, (input) =>
          repository.create(values(input))
        )
        return result instanceof Response
          ? result
          : json({ record: result }, 201)
      } catch (error) {
        return errorResponse(error, uniqueField)
      }
    },
    PUT: async (
      request: Request,
      { params }: { params: Promise<{ id: string }> }
    ) => {
      try {
        const parsed = idSchema.safeParse((await params).id)
        if (!parsed.success) return json({ error: "Invalid record ID." }, 400)
        const result = await write(request, (input) =>
          repository.update(parsed.data, values(input))
        )
        return result instanceof Response ? result : json({ record: result })
      } catch (error) {
        return errorResponse(error, uniqueField)
      }
    },
    DELETE: async (
      request: Request,
      { params }: { params: Promise<{ id: string }> }
    ) => {
      try {
        if (!isSameOrigin(request))
          return json(
            { error: "Requests must come from this application." },
            403
          )
        const parsed = idSchema.safeParse((await params).id)
        if (!parsed.success) return json({ error: "Invalid record ID." }, 400)
        repository.delete(parsed.data)
        return new Response(null, { status: 204 })
      } catch (error) {
        return errorResponse(error, uniqueField)
      }
    },
  }
}
