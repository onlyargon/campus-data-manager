"use client"

import { RecordsWorkspace } from "@/components/records-workspace"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { fetchRecords } from "@/lib/client-api"
import { databaseKeys, databases, type DatabaseKey } from "@/lib/records"
import {
  BookOpen,
  ChevronRight,
  GraduationCap,
  HelpCircle,
  Library,
  Moon,
  Sun,
  Users,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useState } from "react"
import { Toaster } from "sonner"
import useSWR from "swr"

const icons = { students: Users, courses: BookOpen, library: Library }
function DatabaseNavigation({
  selected,
  onSelect,
}: {
  selected: DatabaseKey
  onSelect: (database: DatabaseKey) => void
}) {
  const { setOpenMobile } = useSidebar()
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Databases</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {databaseKeys.map((database) => (
            <DatabaseNavigationItem
              key={database}
              database={database}
              selected={selected === database}
              onSelect={() => {
                onSelect(database)
                setOpenMobile(false)
              }}
            />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
function DatabaseNavigationItem({
  database,
  selected,
  onSelect,
}: {
  database: DatabaseKey
  selected: boolean
  onSelect: () => void
}) {
  const { data, error } = useSWR(`/api/${database}`, fetchRecords)
  const Icon = icons[database]
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={selected}
        onClick={onSelect}
        aria-current={selected ? "page" : undefined}
        className="h-10"
      >
        <Icon />
        <span>{databases[database].label}</span>
      </SidebarMenuButton>
      <SidebarMenuBadge>{error ? "!" : (data?.length ?? "…")}</SidebarMenuBadge>
    </SidebarMenuItem>
  )
}

export function CampusWorkspace({
  initialDatabase,
}: {
  initialDatabase: DatabaseKey
}) {
  const [database, setDatabase] = useState(initialDatabase)
  const [help, setHelp] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()
  function select(value: DatabaseKey) {
    setDatabase(value)
    const url = new URL(window.location.href)
    url.searchParams.set("database", value)
    window.history.replaceState(null, "", url)
  }
  return (
    <TooltipProvider>
      <SidebarProvider>
        <a
          href="#records"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:p-3 focus:ring-2 focus:ring-ring"
        >
          Skip to records
        </a>
        <Sidebar>
          <SidebarHeader className="gap-5 px-5 py-6">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <GraduationCap className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight">Campus</p>
                <p className="text-xs text-muted-foreground">Data Manager</p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent className="px-2">
            <DatabaseNavigation selected={database} onSelect={select} />
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setHelp(true)}>
                <HelpCircle />
                <span>Getting started</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarContent>
        </Sidebar>
        <SidebarInset className="min-w-0">
          <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b px-5 sm:px-8 lg:px-10">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <Separator orientation="vertical" className="h-auto" />
              <nav
                aria-label="Breadcrumb"
                className="flex items-center gap-2 text-sm"
              >
                <span className="text-muted-foreground">Workspace</span>
                <ChevronRight className="size-3 text-muted-foreground" />
                <span className="font-medium">{databases[database].label}</span>
              </nav>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
              aria-label="Toggle colour theme"
              title="Toggle colour theme"
            >
              <Sun className="theme-sun" />
              <Moon className="theme-moon" />
            </Button>
          </header>
          <div id="records" tabIndex={-1} className="min-w-0 outline-none">
            <RecordsWorkspace key={database} database={database} />
          </div>
          <noscript>
            <p className="m-5 rounded-md border p-4">
              Enable JavaScript to load and manage campus records.
            </p>
          </noscript>
        </SidebarInset>
        <Dialog open={help} onOpenChange={setHelp}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Getting started</DialogTitle>
              <DialogDescription>
                Manage your campus records in a few steps.
              </DialogDescription>
            </DialogHeader>
            <ol className="flex list-decimal flex-col gap-3 pl-5 text-sm leading-relaxed">
              <li>Choose Students, Courses, or Library from the sidebar.</li>
              <li>Search, filter, or sort to find a record.</li>
              <li>
                Use Add to create a record, or the edit icon to update one.
              </li>
              <li>
                Use the delete icon to remove a record. You will be asked to
                confirm.
              </li>
            </ol>
            <Separator />
            <p className="text-sm text-muted-foreground">
              This demo starts with sample data. Saved changes remain available
              when you reopen the app. Each database is independent.
            </p>
            <Button onClick={() => setHelp(false)}>Got it</Button>
          </DialogContent>
        </Dialog>
        <Toaster
          position="bottom-right"
          theme={resolvedTheme === "dark" ? "dark" : "light"}
        />
      </SidebarProvider>
    </TooltipProvider>
  )
}
