import { CampusWorkspace } from "@/components/campus-workspace"
import { isDatabaseKey } from "@/lib/records"

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ database?: string | string[] }>
}) {
  const { database } = await searchParams
  return (
    <CampusWorkspace
      initialDatabase={isDatabaseKey(database) ? database : "students"}
    />
  )
}
