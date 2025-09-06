import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProjectTasksView } from "@/components/project-tasks-view"

interface ProjectPageProps {
  params: Promise<{ id: string }>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Check if user has access to this project
  const { data: membership } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", id)
    .eq("user_id", user.id)
    .single()

  if (!membership) {
    notFound()
  }

  // Get project details
  const { data: project } = await supabase
    .from("projects")
    .select(`
      *,
      project_members(
        user_id,
        role,
        profiles(display_name, email, avatar_url)
      )
    `)
    .eq("id", id)
    .single()

  if (!project) {
    notFound()
  }

  // Get project tasks
  const { data: tasks } = await supabase
    .from("tasks")
    .select(`
      *,
      assignee:profiles!tasks_assignee_id_fkey(display_name, email, avatar_url),
      created_by_profile:profiles!tasks_created_by_fkey(display_name, email)
    `)
    .eq("project_id", id)
    .order("created_at", { ascending: false })

  return (
    <DashboardLayout user={{ ...user, display_name: profile?.display_name || "" }}>
      <ProjectTasksView project={project} tasks={tasks || []} userId={user.id} userRole={membership.role} />
    </DashboardLayout>
  )
}
