import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { TeamView } from "@/components/team-view"

export default async function TeamPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Get all projects where user is a member
  const { data: userProjects } = await supabase
    .from("project_members")
    .select(`
      project_id,
      role,
      projects(
        id,
        name,
        description,
        image_url,
        created_at
      )
    `)
    .eq("user_id", user.id)

  // Get all team members from user's projects
  const projectIds = userProjects?.map((up) => up.project_id) || []

  const { data: teamMembers } = await supabase
    .from("project_members")
    .select(`
      user_id,
      role,
      project_id,
      joined_at,
      profiles(display_name, email, avatar_url),
      projects(name, id)
    `)
    .in("project_id", projectIds)
    .order("joined_at", { ascending: false })

  return (
    <DashboardLayout user={{ ...user, display_name: profile?.display_name || "" }}>
      <TeamView userProjects={userProjects || []} teamMembers={teamMembers || []} userId={user.id} />
    </DashboardLayout>
  )
}
