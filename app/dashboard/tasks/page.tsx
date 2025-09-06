import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { TasksView } from "@/components/tasks-view"

export default async function TasksPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Get user's tasks
  const { data: tasks } = await supabase
    .from("tasks")
    .select(`
      *,
      projects(name, id),
      assignee:profiles!tasks_assignee_id_fkey(display_name, email),
      created_by_profile:profiles!tasks_created_by_fkey(display_name, email)
    `)
    .eq("assignee_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <DashboardLayout user={{ ...user, display_name: profile?.display_name || "" }}>
      <TasksView tasks={tasks || []} userId={user.id} />
    </DashboardLayout>
  )
}
