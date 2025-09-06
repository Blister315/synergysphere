import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProjectsView } from "@/components/projects-view"

export default async function ProjectsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Get user's projects (both created and member of)
  const { data: projects } = await supabase
    .from("projects")
    .select(`
      *,
      project_members!inner(role),
      tasks(id, status)
    `)
    .eq("project_members.user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <DashboardLayout user={{ ...user, display_name: profile?.display_name || "" }}>
      <ProjectsView projects={projects || []} userId={user.id} />
    </DashboardLayout>
  )
}
