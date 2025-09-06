"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Search, FolderOpen, Calendar } from "lucide-react"
import Link from "next/link"
import { CreateProjectDialog } from "@/components/create-project-dialog"

interface Project {
  id: string
  name: string
  description: string
  image_url?: string
  created_at: string
  project_members: { role: string }[]
  tasks: { id: string; status: string }[]
}

interface ProjectsViewProps {
  projects: Project[]
  userId: string
}

export function ProjectsView({ projects, userId }: ProjectsViewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getTaskStats = (tasks: { status: string }[]) => {
    const total = tasks.length
    const completed = tasks.filter((t) => t.status === "completed").length
    return { total, completed }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
          <p className="text-gray-600">Manage and track your team projects</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Projects grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const { total, completed } = getTaskStats(project.tasks)
            const userRole = project.project_members[0]?.role || "member"

            return (
              <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-1">{project.name}</CardTitle>
                        <CardDescription className="line-clamp-2 mt-1">
                          {project.description || "No description"}
                        </CardDescription>
                      </div>
                      {project.image_url ? (
                        <img
                          src={project.image_url || "/placeholder.svg"}
                          alt={project.name}
                          className="h-12 w-12 rounded-lg object-cover ml-3"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center ml-3">
                          <FolderOpen className="h-6 w-6 text-blue-600" />
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Role badge */}
                      <Badge variant={userRole === "owner" ? "default" : "secondary"} className="text-xs">
                        {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                      </Badge>

                      {/* Task progress */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Tasks</span>
                        <span className="font-medium">
                          {completed}/{total}
                        </span>
                      </div>
                      {total > 0 && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${(completed / total) * 100}%` }}
                          />
                        </div>
                      )}

                      {/* Created date */}
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        Created {new Date(project.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <FolderOpen className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? "No projects found" : "No projects yet"}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery
              ? "Try adjusting your search terms"
              : "Create your first project to start collaborating with your team"}
          </p>
          {!searchQuery && (
            <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Project
            </Button>
          )}
        </div>
      )}

      <CreateProjectDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} userId={userId} />
    </div>
  )
}
