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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useRouter } from "next/navigation"
import { Mail } from "lucide-react"

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

interface InviteMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userProjects: UserProject[]
  userId: string
}

export function InviteMemberDialog({ open, onOpenChange, userProjects, userId }: InviteMemberDialogProps) {
  const [email, setEmail] = useState("")
  const [projectId, setProjectId] = useState("")
  const [role, setRole] = useState<"admin" | "member">("member")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !projectId) return

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = createClient()

      // First, check if user exists in profiles
      const { data: existingUser } = await supabase.from("profiles").select("id").eq("email", email.trim()).single()

      if (!existingUser) {
        throw new Error("User with this email doesn't exist. They need to sign up first.")
      }

      // Check if user is already a member of this project
      const { data: existingMember } = await supabase
        .from("project_members")
        .select("id")
        .eq("project_id", projectId)
        .eq("user_id", existingUser.id)
        .single()

      if (existingMember) {
        throw new Error("User is already a member of this project.")
      }

      // Add user to project
      const { error: inviteError } = await supabase.from("project_members").insert({
        project_id: projectId,
        user_id: existingUser.id,
        role,
      })

      if (inviteError) throw inviteError

      // Create notification for the invited user
      const selectedProject = userProjects.find((p) => p.project_id === projectId)
      await supabase.from("notifications").insert({
        user_id: existingUser.id,
        title: "Project Invitation",
        message: `You've been invited to join "${selectedProject?.projects.name}" as a ${role}.`,
        type: "info",
      })

      setSuccess("Member invited successfully!")

      // Reset form
      setEmail("")
      setProjectId("")
      setRole("member")

      // Refresh the page after a short delay
      setTimeout(() => {
        router.refresh()
        onOpenChange(false)
        setSuccess(null)
      }, 1500)
    } catch (error: any) {
      setError(error.message || "Failed to invite member")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setEmail("")
    setProjectId("")
    setRole("member")
    setError(null)
    setSuccess(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Invite a team member to join one of your projects. They must already have a SynergySphere account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter team member's email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project">Project *</Label>
              <Select value={projectId} onValueChange={setProjectId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {userProjects.map((project) => (
                    <SelectItem key={project.project_id} value={project.project_id}>
                      <div className="flex items-center gap-2">
                        <span>{project.projects.name}</span>
                        <span className="text-xs text-gray-500">({project.role})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Role *</Label>
              <RadioGroup value={role} onValueChange={(value: "admin" | "member") => setRole(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="member" id="member" />
                  <Label htmlFor="member" className="flex-1">
                    <div>
                      <p className="font-medium">Member</p>
                      <p className="text-sm text-gray-500">Can view and edit tasks, participate in discussions</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="admin" id="admin" />
                  <Label htmlFor="admin" className="flex-1">
                    <div>
                      <p className="font-medium">Admin</p>
                      <p className="text-sm text-gray-500">Can manage project settings and invite other members</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                <p className="text-sm text-green-600">{success}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !email.trim() || !projectId}>
              {isLoading ? "Inviting..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
