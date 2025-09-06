"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Search, CheckSquare, Calendar, AlertCircle, Settings, ArrowLeft, MessageCircle } from "lucide-react"
import Link from "next/link"
import { CreateTaskDialog } from "@/components/create-task-dialog"
import { ProjectSettingsDialog } from "@/components/project-settings-dialog"

interface Task {
  id: string
  name: string
  description: string
  status: "todo" | "in_progress" | "completed"
  priority: "low" | "medium" | "high"
  deadline: string | null
  tags: string[]
  image_url: string | null
  created_at: string
  assignee: { display_name: string; email: string; avatar_url?: string } | null
  created_by_profile: { display_name: string; email: string } | null
}

interface Project {
  id: string
  name: string
  description: string
  image_url: string | null
  project_members: {
    user_id: string
    role: string
    profiles: { display_name: string; email: string; avatar_url?: string }
  }[]
}

interface ProjectTasksViewProps {
  project: Project
  tasks: Task[]
  userId: string
  userRole: string
}

export function ProjectTasksView({ project, tasks, userId, userRole }: ProjectTasksViewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || task.status === statusFilter
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckSquare className="h-4 w-4 text-green-600" />
      case "in_progress":
        return <AlertCircle className="h-4 w-4 text-blue-600" />
      default:
        return <CheckSquare className="h-4 w-4 text-gray-400" />
    }
  }

  const isOverdue = (deadline: string | null) => {
    if (!deadline) return false
    return new Date(deadline) < new Date() && new Date(deadline).toDateString() !== new Date().toDateString()
  }

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === "completed").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    todo: tasks.filter((t) => t.status === "todo").length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/projects">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Projects
          </Button>
        </Link>
        <div className="h-6 w-px bg-gray-300" />
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">{project.name}</h2>
          <p className="text-gray-600">{project.description || "No description"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/projects/${project.id}/messages`}>
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <MessageCircle className="h-4 w-4" />
              Messages
            </Button>
          </Link>
          {(userRole === "owner" || userRole === "admin") && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 bg-transparent"
              onClick={() => setIsSettingsDialogOpen(true)}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          )}
        </div>
      </div>

      {/* Project stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">{taskStats.total}</div>
            <p className="text-sm text-gray-600">Total Tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</div>
            <p className="text-sm text-gray-600">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{taskStats.completed}</div>
            <p className="text-sm text-gray-600">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">{taskStats.todo}</div>
            <p className="text-sm text-gray-600">To Do</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions and filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Tasks list */}
      {filteredTasks.length > 0 ? (
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(task.status)}
                      <CardTitle className="text-lg">{task.name}</CardTitle>
                    </div>
                    <CardDescription className="line-clamp-2">{task.description || "No description"}</CardDescription>
                  </div>
                  {task.image_url && (
                    <img
                      src={task.image_url || "/placeholder.svg"}
                      alt={task.name}
                      className="h-16 w-16 rounded-lg object-cover ml-4"
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Status and Priority badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={getStatusColor(task.status)}>
                      {task.status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Badge>
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                    </Badge>
                    {task.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Assignee and deadline info */}
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-4">
                      {task.assignee && (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={task.assignee.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback className="text-xs">
                              {task.assignee.display_name?.charAt(0)?.toUpperCase() ||
                                task.assignee.email.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span>{task.assignee.display_name || task.assignee.email}</span>
                        </div>
                      )}
                    </div>
                    {task.deadline && (
                      <div className={`flex items-center gap-1 ${isOverdue(task.deadline) ? "text-red-600" : ""}`}>
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(task.deadline).toLocaleDateString()}</span>
                        {isOverdue(task.deadline) && <span className="text-xs">(Overdue)</span>}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <CheckSquare className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery || statusFilter !== "all" || priorityFilter !== "all" ? "No tasks found" : "No tasks yet"}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || statusFilter !== "all" || priorityFilter !== "all"
              ? "Try adjusting your filters"
              : "Create your first task to get started"}
          </p>
          {!searchQuery && statusFilter === "all" && priorityFilter === "all" && (
            <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Task
            </Button>
          )}
        </div>
      )}

      <CreateTaskDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        projectId={project.id}
        projectMembers={project.project_members}
        userId={userId}
      />

      <ProjectSettingsDialog
        open={isSettingsDialogOpen}
        onOpenChange={setIsSettingsDialogOpen}
        project={project}
        userId={userId}
        userRole={userRole}
      />
    </div>
  )
}
