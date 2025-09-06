"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageCircle, Send } from "lucide-react"
import { useRouter } from "next/navigation"

interface Comment {
  id: string
  comment: string
  created_at: string
  profiles: { display_name: string; email: string; avatar_url?: string }
}

interface TaskCommentsProps {
  taskId: string
  comments: Comment[]
  userId: string
}

export function TaskComments({ taskId, comments, userId }: TaskCommentsProps) {
  const [newComment, setNewComment] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("task_comments").insert({
        task_id: taskId,
        user_id: userId,
        comment: newComment.trim(),
      })

      if (error) throw error

      setNewComment("")
      router.refresh()
    } catch (error: any) {
      console.error("Failed to add comment:", error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageCircle className="h-5 w-5" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comments list */}
        {comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarImage src={comment.profiles.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                    {comment.profiles.display_name?.charAt(0)?.toUpperCase() ||
                      comment.profiles.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-900">
                      {comment.profiles.display_name || comment.profiles.email}
                    </span>
                    <span className="text-xs text-gray-500">{formatTime(comment.created_at)}</span>
                  </div>
                  <div className="text-gray-800 text-sm leading-relaxed">{comment.comment}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No comments yet</p>
          </div>
        )}

        {/* Add comment form */}
        <form onSubmit={handleSubmit} className="space-y-3 pt-4 border-t">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px] resize-none"
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading || !newComment.trim()} size="sm" className="gap-2">
              <Send className="h-4 w-4" />
              {isLoading ? "Adding..." : "Add Comment"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
