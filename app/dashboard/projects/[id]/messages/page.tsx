import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProjectMessagesView } from "@/components/project-messages-view"

interface ProjectMessagesPageProps {
  params: Promise<{ id: string }>
}

export default async function ProjectMessagesPage({ params }: ProjectMessagesPageProps) {
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

  // Get project messages
  const { data: messages } = await supabase
    .from("project_messages")
    .select(`
      *,
      profiles(display_name, email, avatar_url),
      reply_to_message:project_messages!reply_to(
        id,
        message,
        profiles(display_name, email)
      )
    `)
    .eq("project_id", id)
    .order("created_at", { ascending: true })

  // Get recent activities
  const { data: activities } = await supabase
    .from("project_activities")
    .select(`
      *,
      profiles(display_name, email, avatar_url)
    `)
    .eq("project_id", id)
    .order("created_at", { ascending: false })
    .limit(20)

  return (
    <DashboardLayout user={{ ...user, display_name: profile?.display_name || "" }}>
      <ProjectMessagesView
        project={project}
        messages={messages || []}
        activities={activities || []}
        userId={user.id}
        userRole={membership.role}
      />
    </DashboardLayout>
  )
}
