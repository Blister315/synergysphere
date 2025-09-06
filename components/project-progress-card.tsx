"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, CheckCircle2, Clock } from "lucide-react"

interface ProjectProgressCardProps {
  project: {
    id: string
    name: string
    description: string
    status: string
    created_at: string
    deadline?: string
    progress: number
    totalTasks: number
    completedTasks: number
    teamMembers: number
    overdueTasks: number
  }
}

export function ProjectProgressCard({ project }: ProjectProgressCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "on-hold":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const isOverdue = project.deadline && new Date(project.deadline) < new Date()

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{project.name}</CardTitle>
            <CardDescription className="line-clamp-2">{project.description}</CardDescription>
          </div>
          <Badge className={getStatusColor(project.status)} variant="secondary">
            {project.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
          <div className="text-xs text-gray-500">
            {project.completedTasks} of {project.totalTasks} tasks completed
          </div>
        </div>

        {/* Project Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Users className="h-4 w-4" />
            <span>{project.teamMembers} members</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>{project.completedTasks} completed</span>
          </div>
          {project.deadline && (
            <div className={`flex items-center gap-2 col-span-2 ${isOverdue ? "text-red-600" : "text-gray-600"}`}>
              <Calendar className="h-4 w-4" />
              <span>Due {new Date(project.deadline).toLocaleDateString()}</span>
              {isOverdue && (
                <Badge variant="destructive" className="text-xs">
                  Overdue
                </Badge>
              )}
            </div>
          )}
          {project.overdueTasks > 0 && (
            <div className="flex items-center gap-2 col-span-2 text-orange-600">
              <Clock className="h-4 w-4" />
              <span>{project.overdueTasks} overdue tasks</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
