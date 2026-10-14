"use client"

import { useState, type FormEvent } from "react"
import { Loader2, Plus, Save } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ApiError, saveRecord } from "@/lib/client-api"
import {
  databases,
  recordValue,
  schemaFor,
  type CampusRecord,
  type DatabaseKey,
  type FieldDefinition,
} from "@/lib/records"

export type Editor = { kind: "add" } | { kind: "edit"; record: CampusRecord }
export function RecordForm({
  database,
  editor,
  onClose,
  onSaved,
}: {
  database: DatabaseKey
  editor: Editor
  onClose: () => void
  onSaved: (record: CampusRecord) => void
}) {
  const config = databases[database]
  const fields: FieldDefinition[] = config.fields
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      fields.map((field) => [
        field.key,
        editor.kind === "edit"
          ? String(recordValue(editor.record, field.key))
          : "",
      ])
    )
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState("")
  const [saving, setSaving] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    const input = Object.fromEntries(
      fields.map((field) => [
        field.key,
        field.type === "number"
          ? values[field.key]?.trim()
            ? Number(values[field.key])
            : undefined
          : values[field.key],
      ])
    )
    const parsed = schemaFor(database).safeParse(input)
    if (!parsed.success) {
      const errors: Record<string, string> = {}
      parsed.error.issues.forEach((issue) => {
        errors[String(issue.path[0])] ??= issue.message
      })
      setErrors(errors)
      setMessage("Check the highlighted fields before saving.")
      document
        .getElementById(`record-${String(parsed.error.issues[0]?.path[0])}`)
        ?.focus()
      return
    }
    setErrors({})
    setMessage("")
    setSaving(true)
    try {
      const url = `/api/${database}${editor.kind === "edit" ? `/${editor.record.id}` : ""}`
      const record = await saveRecord(
        url,
        editor.kind === "edit" ? "PUT" : "POST",
        parsed.data
      )
      onSaved(record)
      toast.success(
        `${config.singular[0].toUpperCase()}${config.singular.slice(1)} ${editor.kind === "edit" ? "updated" : "added"}.`
      )
      onClose()
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not save this record. Please try again."
      )
      if (error instanceof ApiError) setErrors(error.fields)
    } finally {
      setSaving(false)
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !saving) onClose()
      }}
    >
      <DialogContent
        className="max-h-[90svh] overflow-y-auto sm:max-w-lg"
        showCloseButton={!saving}
      >
        <DialogHeader>
          <DialogTitle>
            {editor.kind === "edit" ? "Edit" : "Add"} {config.singular}
          </DialogTitle>
          <DialogDescription>
            {editor.kind === "edit"
              ? "Update the details below and save your changes."
              : `Enter the new ${config.singular} details below.`}{" "}
            All fields are required.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="flex flex-col gap-6">
          <FieldGroup className="gap-4">
            {fields.map((field) => (
              <Field
                key={field.key}
                data-invalid={!!errors[field.key]}
                data-disabled={saving}
                className="gap-2"
              >
                <FieldLabel htmlFor={`record-${field.key}`}>
                  {field.label}
                </FieldLabel>
                <Input
                  id={`record-${field.key}`}
                  name={field.key}
                  type={field.type}
                  value={values[field.key] ?? ""}
                  onChange={(event) => {
                    setValues((previous) => ({
                      ...previous,
                      [field.key]: event.target.value,
                    }))
                    setErrors((previous) => {
                      const next = { ...previous }
                      delete next[field.key]
                      return next
                    })
                  }}
                  placeholder={field.placeholder}
                  min={field.min}
                  max={field.max}
                  step={field.type === "number" ? 1 : undefined}
                  maxLength={field.maxLength}
                  required
                  disabled={saving}
                  aria-invalid={!!errors[field.key]}
                  aria-describedby={
                    errors[field.key] ? `error-${field.key}` : undefined
                  }
                  autoComplete="off"
                />
                {errors[field.key] && (
                  <FieldError id={`error-${field.key}`}>
                    {errors[field.key]}
                  </FieldError>
                )}
              </Field>
            ))}
          </FieldGroup>
          {message && (
            <Alert variant="destructive">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <Loader2 className="animate-spin" data-icon="inline-start" />
              ) : editor.kind === "edit" ? (
                <Save data-icon="inline-start" />
              ) : (
                <Plus data-icon="inline-start" />
              )}
              {saving
                ? "Saving…"
                : editor.kind === "edit"
                  ? "Save changes"
                  : `Add ${config.singular}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
