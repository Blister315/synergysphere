"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

interface ProgressChartsProps {
  projectStats: {
    name: string
    completed: number
    total: number
    progress: number
  }[]
  taskStatusData: {
    name: string
    value: number
    color: string
  }[]
  weeklyProgress: {
    day: string
    completed: number
  }[]
}

export function ProgressCharts({ projectStats, taskStatusData, weeklyProgress }: ProgressChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* Project Progress */}
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle>Project Progress</CardTitle>
          <CardDescription>Completion status across all projects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projectStats.map((project) => (
              <div key={project.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{project.name}</span>
                  <span className="text-sm text-gray-500">
                    {project.completed}/{project.total} tasks
                  </span>
                </div>
                <Progress value={project.progress} className="h-2" />
                <div className="text-xs text-gray-500">{project.progress}% complete</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Task Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Task Status</CardTitle>
          <CardDescription>Distribution of task statuses</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={taskStatusData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {taskStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {taskStatusData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-700">{item.name}</span>
                </div>
                <span className="font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Progress */}
      <Card className="col-span-1 lg:col-span-2 xl:col-span-3">
        <CardHeader>
          <CardTitle>Weekly Progress</CardTitle>
          <CardDescription>Tasks completed over the past week</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyProgress}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="completed" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
