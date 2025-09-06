import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FolderOpen, CheckSquare, Users, TrendingUp } from "lucide-react"
import { ProgressCharts } from "@/components/progress-charts"
import { ProjectProgressCard } from "@/components/project-progress-card"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Get detailed project data with progress
  const { data: projectsData } = await supabase
    .from("projects")
    .select(`
      *,
      tasks(id, status, deadline),
      project_members(user_id)
    `)
    .or(`created_by.eq.${user.id},project_members.user_id.eq.${user.id}`)

  // Get user tasks with detailed info
  const { data: userTasks } = await supabase
    .from("tasks")
    .select("id, status, deadline, created_at")
    .eq("assignee_id", user.id)

  // Calculate project progress
  const projectStats =
    projectsData?.map((project) => {
      const totalTasks = project.tasks?.length || 0
      const completedTasks = project.tasks?.filter((t: any) => t.status === "completed").length || 0
      const overdueTasks =
        project.tasks?.filter((t: any) => t.deadline && new Date(t.deadline) < new Date() && t.status !== "completed")
          .length || 0

      return {
        ...project,
        progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        totalTasks,
        completedTasks,
        teamMembers: project.project_members?.length || 0,
        overdueTasks,
      }
    }) || []

  // Calculate task status distribution
  const taskStatusData = [
    { name: "To Do", value: userTasks?.filter((t) => t.status === "todo").length || 0, color: "#6b7280" },
    { name: "In Progress", value: userTasks?.filter((t) => t.status === "in-progress").length || 0, color: "#f59e0b" },
    { name: "In Review", value: userTasks?.filter((t) => t.status === "in-review").length || 0, color: "#8b5cf6" },
    { name: "Completed", value: userTasks?.filter((t) => t.status === "completed").length || 0, color: "#10b981" },
  ]

  // Calculate weekly progress
  const weeklyProgress = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" })
    const completed =
      userTasks?.filter(
        (t) => t.status === "completed" && new Date(t.created_at).toDateString() === date.toDateString(),
      ).length || 0

    return { day: dayName, completed }
  })

  const stats = [
    {
      title: "My Projects",
      value: projectsData?.filter((p) => p.created_by === user.id).length || 0,
      description: "Projects you've created",
      icon: FolderOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Active Tasks",
      value: userTasks?.filter((t) => t.status !== "completed").length || 0,
      description: "Tasks assigned to you",
      icon: CheckSquare,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Team Projects",
      value: projectsData?.filter((p) => p.project_members.some((m) => m.user_id === user.id)).length || 0,
      description: "Projects you're part of",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Completion Rate",
      value: userTasks?.length
        ? Math.round((userTasks.filter((t) => t.status === "completed").length / userTasks.length) * 100)
        : 0,
      description: "Task completion percentage",
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      suffix: "%",
    },
  ]

  return (
    <DashboardLayout user={{ ...user, display_name: profile?.display_name || "" }}>
      <div className="space-y-6">
        {/* Welcome section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Welcome back, {profile?.display_name || user.email}!</h2>
          <p className="text-gray-600 mt-1">Here's what's happening with your projects today.</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
                <div className={`h-8 w-8 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {stat.value}
                  {stat.suffix}
                </div>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <ProgressCharts
          projectStats={projectStats.map((p) => ({
            name: p.name,
            completed: p.completedTasks,
            total: p.totalTasks,
            progress: p.progress,
          }))}
          taskStatusData={taskStatusData}
          weeklyProgress={weeklyProgress}
        />

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Projects</h3>
          {projectStats.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projectStats.slice(0, 6).map((project) => (
                <ProjectProgressCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8 text-gray-500">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No projects yet</p>
                <p className="text-sm">Create your first project to get started</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
