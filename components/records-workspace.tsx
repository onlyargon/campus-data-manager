"use client"

import { useState } from "react"
import useSWR from "swr"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Loader2,
  Pencil,
  Plus,
  RotateCw,
  Search,
  Trash2,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { RecordForm, type Editor } from "@/components/record-form"
import { deleteRecord, fetchRecords } from "@/lib/client-api"
import {
  databases,
  recordValue,
  type CampusRecord,
  type DatabaseKey,
} from "@/lib/records"

const PAGE_SIZE = 10
export function RecordsWorkspace({ database }: { database: DatabaseKey }) {
  const config = databases[database]
  const {
    data = [],
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR(`/api/${database}`, fetchRecords)
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("")
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState({ key: "id", direction: 1 })
  const [editor, setEditor] = useState<Editor | null>(null)
  const [deleting, setDeleting] = useState<CampusRecord | null>(null)
  const [busy, setBusy] = useState(false)
  const [deleteError, setDeleteError] = useState("")
  const options = [
    ...new Set(
      data.map((record) => String(recordValue(record, config.filter)))
    ),
  ].sort()
  const filtered = data
    .filter((record) => {
      const text = config.fields
        .map((field) => String(recordValue(record, field.key)))
        .join(" ")
        .toLocaleLowerCase()
      return (
        text.includes(query.trim().toLocaleLowerCase()) &&
        (!filter || recordValue(record, config.filter) === filter)
      )
    })
    .sort((a, b) => {
      const first = recordValue(a, sort.key),
        second = recordValue(b, sort.key)
      return (
        sort.direction *
        (typeof first === "number" && typeof second === "number"
          ? first - second
          : String(first).localeCompare(String(second), undefined, {
              numeric: true,
            }))
      )
    })
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pages)
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )
  function clearFilters() {
    setQuery("")
    setFilter("")
    setPage(1)
  }
  function saved(record: CampusRecord) {
    void mutate(
      (previous = []) =>
        previous.some((item) => item.id === record.id)
          ? previous.map((item) => (item.id === record.id ? record : item))
          : [...previous, record],
      { revalidate: false }
    )
  }
  async function confirmDelete() {
    if (!deleting || busy) return
    setBusy(true)
    setDeleteError("")
    try {
      await deleteRecord(`/api/${database}/${deleting.id}`)
      void mutate(
        (previous = []) =>
          previous.filter((record) => record.id !== deleting.id),
        { revalidate: false }
      )
      setDeleting(null)
      toast.success(
        `${config.singular[0].toUpperCase()}${config.singular.slice(1)} deleted.`
      )
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Could not delete this record. Please try again."
      )
    } finally {
      setBusy(false)
    }
  }
  const hasFilters = !!query || !!filter
  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-7 p-5 sm:p-8 lg:p-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            {config.label}
          </h1>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </div>
        <Button onClick={() => setEditor({ kind: "add" })}>
          <Plus data-icon="inline-start" />
          Add {config.singular}
        </Button>
      </div>
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-medium">
              All {database === "library" ? "books" : database}
            </h2>
            <Badge variant="secondary">{isLoading ? "…" : data.length}</Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void mutate()}
            disabled={isValidating}
            aria-label="Refresh records"
          >
            <RotateCw
              data-icon="inline-start"
              className={isValidating ? "animate-spin" : undefined}
            />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3 px-5 py-4">
          <InputGroup className="w-full sm:max-w-sm">
            <InputGroupInput
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
              placeholder={config.search}
              aria-label={`Search ${config.label.toLowerCase()}`}
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            {query && (
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  size="icon-xs"
                  aria-label="Clear search"
                  onClick={() => {
                    setQuery("")
                    setPage(1)
                  }}
                >
                  <X />
                </InputGroupButton>
              </InputGroupAddon>
            )}
          </InputGroup>
          <NativeSelect
            value={filter}
            onChange={(event) => {
              setFilter(event.target.value)
              setPage(1)
            }}
            aria-label={config.filterLabel}
            disabled={isLoading}
            className="w-full sm:max-w-60"
          >
            <NativeSelectOption value="">
              {config.filterLabel}
            </NativeSelectOption>
            {options.map((option) => (
              <NativeSelectOption key={option} value={option}>
                {option}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
        {error ? (
          <div className="px-5 pb-5">
            <Alert variant="destructive">
              <CircleAlert />
              <AlertTitle>
                Could not load {config.label.toLowerCase()}
              </AlertTitle>
              <AlertDescription>
                {error instanceof Error ? error.message : "Please try again."}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void mutate()}
                >
                  Try again
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <>
            <div className="records-table" aria-busy={isLoading}>
              <Table>
                <TableHeader>
                  <TableRow>
                    {[{ key: "id", label: "ID" }, ...config.fields].map(
                      (field) => (
                        <TableHead
                          key={field.key}
                          aria-sort={
                            sort.key === field.key
                              ? sort.direction === 1
                                ? "ascending"
                                : "descending"
                              : "none"
                          }
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="-ml-2"
                            onClick={() =>
                              setSort({
                                key: field.key,
                                direction:
                                  sort.key === field.key ? -sort.direction : 1,
                              })
                            }
                            aria-label={`Sort by ${field.label}`}
                          >
                            {field.label}
                            {sort.key === field.key ? (
                              sort.direction === 1 ? (
                                <ArrowUp data-icon="inline-end" />
                              ) : (
                                <ArrowDown data-icon="inline-end" />
                              )
                            ) : (
                              <ArrowUpDown data-icon="inline-end" />
                            )}
                          </Button>
                        </TableHead>
                      )
                    )}
                    <TableHead className="text-right">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading
                    ? Array.from({ length: 7 }, (_, index) => (
                        <TableRow key={index}>
                          {Array.from({ length: 6 }, (_, column) => (
                            <TableCell key={column}>
                              <Skeleton
                                className={
                                  column === 0 || column === 5
                                    ? "h-5 w-10"
                                    : "h-5 w-28"
                                }
                              />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    : visible.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {String(record.id).padStart(3, "0")}
                          </TableCell>
                          {config.fields.map((field) => {
                            const value = recordValue(record, field.key)
                            return (
                              <TableCell key={field.key}>
                                {field.key === "name" ? (
                                  <div className="flex items-center gap-3">
                                    <Avatar>
                                      <AvatarFallback>
                                        {String(value)
                                          .split(" ")
                                          .map((word) => word[0])
                                          .slice(0, 2)
                                          .join("")}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">{value}</span>
                                  </div>
                                ) : field.key === "programme" ? (
                                  <Badge variant="outline">{value}</Badge>
                                ) : field.key === "studyYear" ? (
                                  <span>Year {value}</span>
                                ) : field.key === "credits" ? (
                                  <span className="tabular-nums">
                                    {value} ECTS
                                  </span>
                                ) : field.key === "availableCopies" ? (
                                  <Badge
                                    variant={
                                      value === 0 ? "secondary" : "outline"
                                    }
                                  >
                                    {value === 0
                                      ? "Out of stock"
                                      : `${value} available`}
                                  </Badge>
                                ) : (
                                  <span
                                    className={
                                      field.key === "title"
                                        ? "font-medium"
                                        : field.key === "code" ||
                                            field.key === "isbn"
                                          ? "font-mono text-xs"
                                          : "text-muted-foreground"
                                    }
                                  >
                                    {value}
                                  </span>
                                )}
                              </TableCell>
                            )
                          })}
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Edit ${recordValue(record, config.primary)}`}
                                title="Edit record"
                                onClick={() =>
                                  setEditor({ kind: "edit", record })
                                }
                              >
                                <Pencil />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Delete ${recordValue(record, config.primary)}`}
                                title="Delete record"
                                onClick={() => {
                                  setDeleting(record)
                                  setDeleteError("")
                                }}
                              >
                                <Trash2 />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </div>
            {!isLoading && !filtered.length && (
              <Empty className="py-16">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Search />
                  </EmptyMedia>
                  <EmptyTitle>
                    {hasFilters
                      ? "No matching records"
                      : `No ${database === "library" ? "books" : database} yet`}
                  </EmptyTitle>
                  <EmptyDescription>
                    {hasFilters
                      ? "Try a different search or clear the filters to see all records."
                      : `Add your first ${config.singular} to get started.`}
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button
                    variant="outline"
                    onClick={
                      hasFilters
                        ? clearFilters
                        : () => setEditor({ kind: "add" })
                    }
                  >
                    {hasFilters ? "Clear filters" : `Add ${config.singular}`}
                  </Button>
                </EmptyContent>
              </Empty>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4">
              <p className="text-xs text-muted-foreground" role="status">
                {isLoading
                  ? "Loading records…"
                  : filtered.length
                    ? `Showing ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filtered.length)} of ${filtered.length} ${database === "library" ? "books" : database}`
                    : "0 records"}
                {hasFilters && filtered.length ? ` · ${data.length} total` : ""}
              </p>
              <nav
                aria-label="Table pagination"
                className="flex items-center gap-3"
              >
                <span className="text-xs text-muted-foreground tabular-nums">
                  Page {currentPage} of {pages}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="Previous page"
                    disabled={currentPage === 1 || isLoading}
                    onClick={() => setPage(currentPage - 1)}
                  >
                    <ChevronLeft />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="Next page"
                    disabled={currentPage === pages || isLoading}
                    onClick={() => setPage(currentPage + 1)}
                  >
                    <ChevronRight />
                  </Button>
                </div>
              </nav>
            </div>
          </>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Changes are saved automatically after you submit a form.
      </p>
      {editor && (
        <RecordForm
          database={database}
          editor={editor}
          onClose={() => setEditor(null)}
          onSaved={saved}
        />
      )}
      <AlertDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open && !busy) setDeleting(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {config.singular}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting && (
                <>
                  This will permanently delete{" "}
                  <strong>{recordValue(deleting, config.primary)}</strong>. This
                  action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <Alert variant="destructive">
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={busy}
              onClick={() => void confirmDelete()}
            >
              {busy ? (
                <Loader2 className="animate-spin" data-icon="inline-start" />
              ) : (
                <Trash2 data-icon="inline-start" />
              )}
              {busy ? "Deleting…" : `Delete ${config.singular}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
