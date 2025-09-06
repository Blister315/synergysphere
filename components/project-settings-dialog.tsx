"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { Upload, Trash2, Crown, Shield, User } from "lucide-react"

interface ProjectMember {
  user_id: string
  role: string
  profiles: { display_name: string; email: string; avatar_url?: string }
}

interface Project {
  id: string
  name: string
  description: string
  image_url: string | null
  project_members: ProjectMember[]
}

interface ProjectSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Project
  userId: string
  userRole: string
}

export function ProjectSettingsDialog({ open, onOpenChange, project, userId, userRole }: ProjectSettingsDialogProps) {
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description || "")
  const [imageUrl, setImageUrl] = useState(project.image_url || "")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("projects")
        .update({
          name: name.trim(),
          description: description.trim() || null,
          image_url: imageUrl.trim() || null,
        })
        .eq("id", project.id)

      if (error) throw error

      router.refresh()
      onOpenChange(false)
    } catch (error: any) {
      setError(error.message || "Failed to update project")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateMemberRole = async (memberId: string, newRole: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("project_members")
        .update({ role: newRole })
        .eq("project_id", project.id)
        .eq("user_id", memberId)

      if (error) throw error

      router.refresh()
    } catch (error: any) {
      setError(error.message || "Failed to update member role")
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member from the project?")) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("project_members")
        .delete()
        .eq("project_id", project.id)
        .eq("user_id", memberId)

      if (error) throw error

      router.refresh()
    } catch (error: any) {
      setError(error.message || "Failed to remove member")
    }
  }

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

  const canManageMembers = userRole === "owner" || userRole === "admin"
  const isOwner = userRole === "owner"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Project Settings</DialogTitle>
          <DialogDescription>Manage project details and team members</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <form onSubmit={handleUpdateProject}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter project name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={!isOwner}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your project..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    disabled={!isOwner}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image">Project Image URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="image"
                      placeholder="https://example.com/image.jpg"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      disabled={!isOwner}
                    />
                    <Button type="button" variant="outline" size="icon" disabled={!isOwner}>
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                {isOwner && (
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isLoading || !name.trim()}>
                      {isLoading ? "Updating..." : "Update Project"}
                    </Button>
                  </div>
                )}
              </div>
            </form>
          </TabsContent>

          <TabsContent value="members">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Team Members ({project.project_members.length})</h4>
              </div>
              <div className="space-y-3">
                {project.project_members.map((member) => (
                  <div key={member.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.profiles.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback className="bg-blue-100 text-blue-700">
                          {member.profiles.display_name?.charAt(0)?.toUpperCase() ||
                            member.profiles.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900">
                          {member.profiles.display_name || "Unknown User"}
                          {member.user_id === userId && <span className="text-sm text-gray-500 ml-1">(You)</span>}
                        </p>
                        <p className="text-sm text-gray-600">{member.profiles.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {canManageMembers && member.role !== "owner" && member.user_id !== userId ? (
                        <Select
                          value={member.role}
                          onValueChange={(newRole) => handleUpdateMemberRole(member.user_id, newRole)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="member">Member</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex items-center gap-1">
                          {getRoleIcon(member.role)}
                          <Badge className={getRoleColor(member.role)}>
                            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                          </Badge>
                        </div>
                      )}
                      {canManageMembers && member.role !== "owner" && member.user_id !== userId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.user_id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
