"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Search, UserPlus, Crown, Shield, User, Calendar } from "lucide-react"
import { InviteMemberDialog } from "@/components/invite-member-dialog"

interface UserProject {
  project_id: string
  role: string
  projects: {
    id: string
    name: string
    description: string
    image_url: string | null
    created_at: string
  }
}

interface TeamMember {
  user_id: string
  role: string
  project_id: string
  joined_at: string
  profiles: {
    display_name: string
    email: string
    avatar_url?: string
  }
  projects: {
    name: string
    id: string
  }
}

interface TeamViewProps {
  userProjects: UserProject[]
  teamMembers: TeamMember[]
  userId: string
}

export function TeamView({ userProjects, teamMembers, userId }: TeamViewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [projectFilter, setProjectFilter] = useState<string>("all")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)

  // Get unique team members (deduplicate across projects)
  const uniqueMembers = teamMembers.reduce((acc, member) => {
    const existing = acc.find((m) => m.user_id === member.user_id)
    if (!existing) {
      acc.push({
        ...member,
        projectCount: teamMembers.filter((tm) => tm.user_id === member.user_id).length,
        projects: teamMembers
          .filter((tm) => tm.user_id === member.user_id)
          .map((tm) => ({ name: tm.projects.name, id: tm.projects.id, role: tm.role })),
      })
    }
    return acc
  }, [] as any[])

  const filteredMembers = uniqueMembers.filter((member) => {
    const matchesSearch =
      member.profiles.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.profiles.email.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesProject = projectFilter === "all" || member.projects.some((p: any) => p.id === projectFilter)
    const matchesRole = roleFilter === "all" || member.projects.some((p: any) => p.role === roleFilter)

    return matchesSearch && matchesProject && matchesRole
  })

  const filteredProjectMembers = teamMembers.filter((member) => {
    const matchesSearch =
      member.profiles.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.profiles.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.projects.name.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesProject = projectFilter === "all" || member.project_id === projectFilter
    const matchesRole = roleFilter === "all" || member.role === roleFilter

    return matchesSearch && matchesProject && matchesRole
  })

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="h-4 w-4 text-yellow-600" />
      case "admin":
        return <Shield className="h-4 w-4 text-blue-600" />
      default:
        return <User className="h-4 w-4 text-gray-600" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-yellow-100 text-yellow-800"
      case "admin":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const canInviteMembers = userProjects.some((up) => up.role === "owner" || up.role === "admin")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Team</h2>
          <p className="text-gray-600">Manage your team members across all projects</p>
        </div>
        {canInviteMembers && (
          <Button onClick={() => setIsInviteDialogOpen(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Invite Member
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search team members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {userProjects.map((project) => (
              <SelectItem key={project.project_id} value={project.project_id}>
                {project.projects.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="owner">Owner</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="member">Member</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Team tabs */}
      <Tabs defaultValue="members" className="space-y-6">
        <TabsList>
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="projects">By Project</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          {filteredMembers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMembers.map((member) => (
                <Card key={member.user_id}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={member.profiles.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback className="bg-blue-100 text-blue-700">
                          {member.profiles.display_name?.charAt(0)?.toUpperCase() ||
                            member.profiles.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{member.profiles.display_name || "Unknown User"}</CardTitle>
                        <CardDescription className="text-sm">{member.profiles.email}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Projects and roles */}
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">Projects ({member.projectCount})</p>
                        <div className="space-y-1">
                          {member.projects.slice(0, 3).map((project: any) => (
                            <div key={project.id} className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 truncate">{project.name}</span>
                              <Badge className={`${getRoleColor(project.role)} text-xs`}>
                                {project.role.charAt(0).toUpperCase() + project.role.slice(1)}
                              </Badge>
                            </div>
                          ))}
                          {member.projects.length > 3 && (
                            <p className="text-xs text-gray-500">+{member.projects.length - 3} more</p>
                          )}
                        </div>
                      </div>

                      {/* Join date */}
                      <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t">
                        <Calendar className="h-3 w-3" />
                        Joined {new Date(member.joined_at).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No team members found</h3>
              <p className="text-gray-600">
                {searchQuery || projectFilter !== "all" || roleFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Invite team members to start collaborating"}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          {filteredProjectMembers.length > 0 ? (
            <div className="space-y-4">
              {filteredProjectMembers.map((member) => (
                <Card key={`${member.user_id}-${member.project_id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.profiles.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback className="bg-blue-100 text-blue-700">
                            {member.profiles.display_name?.charAt(0)?.toUpperCase() ||
                              member.profiles.email.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">{member.profiles.display_name || "Unknown User"}</p>
                          <p className="text-sm text-gray-600">{member.profiles.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{member.projects.name}</p>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            {new Date(member.joined_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {getRoleIcon(member.role)}
                          <Badge className={getRoleColor(member.role)}>
                            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No project members found</h3>
              <p className="text-gray-600">
                {searchQuery || projectFilter !== "all" || roleFilter !== "all"
                  ? "Try adjusting your filters"
                  : "No project members to display"}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <InviteMemberDialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        userProjects={userProjects.filter((up) => up.role === "owner" || up.role === "admin")}
        userId={userId}
      />
    </div>
  )
}
