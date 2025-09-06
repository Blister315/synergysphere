"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft, Send, MessageCircle, Activity, Reply, Clock } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Message {
  id: string
  message: string
  message_type: string
  file_url: string | null
  reply_to: string | null
  created_at: string
  updated_at: string
  profiles: { display_name: string; email: string; avatar_url?: string }
  reply_to_message?: {
    id: string
    message: string
    profiles: { display_name: string; email: string }
  } | null
}

interface Activity {
  id: string
  activity_type: string
  activity_data: any
  created_at: string
  profiles: { display_name: string; email: string; avatar_url?: string }
}

interface Project {
  id: string
  name: string
  description: string
  project_members: {
    user_id: string
    role: string
    profiles: { display_name: string; email: string; avatar_url?: string }
  }[]
}

interface ProjectMessagesViewProps {
  project: Project
  messages: Message[]
  activities: Activity[]
  userId: string
  userRole: string
}

export function ProjectMessagesView({ project, messages, activities, userId, userRole }: ProjectMessagesViewProps) {
  const [newMessage, setNewMessage] = useState("")
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("project_messages").insert({
        project_id: project.id,
        user_id: userId,
        message: newMessage.trim(),
        reply_to: replyTo?.id || null,
      })

      if (error) throw error

      setNewMessage("")
      setReplyTo(null)
      router.refresh()
    } catch (error: any) {
      console.error("Failed to send message:", error.message)
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
    } else if (diffInHours < 168) {
      // Less than a week
      return date.toLocaleDateString([], { weekday: "short", hour: "2-digit", minute: "2-digit" })
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    }
  }

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case "task_created":
        return "✅"
      case "task_completed":
        return "🎉"
      case "task_updated":
        return "📝"
      case "member_added":
        return "👋"
      case "member_removed":
        return "👋"
      case "project_updated":
        return "⚙️"
      default:
        return "📌"
    }
  }

  const getActivityMessage = (activity: Activity) => {
    const userName = activity.profiles.display_name || activity.profiles.email
    const data = activity.activity_data || {}

    switch (activity.activity_type) {
      case "task_created":
        return `${userName} created task "${data.task_name}"`
      case "task_completed":
        return `${userName} completed task "${data.task_name}"`
      case "task_updated":
        return `${userName} updated task "${data.task_name}"`
      case "member_added":
        return `${userName} joined the project`
      case "member_removed":
        return `${userName} left the project`
      case "project_updated":
        return `${userName} updated the project`
      default:
        return `${userName} performed an action`
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/projects/${project.id}`}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Project
          </Button>
        </Link>
        <div className="h-6 w-px bg-gray-300" />
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">{project.name}</h2>
          <p className="text-gray-600">Team Communication</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main chat area */}
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Messages
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages area */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.length > 0 ? (
                    messages.map((message) => (
                      <div key={message.id} className="flex gap-3">
                        <Avatar className="h-8 w-8 mt-1">
                          <AvatarImage src={message.profiles.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                            {message.profiles.display_name?.charAt(0)?.toUpperCase() ||
                              message.profiles.email.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-gray-900">
                              {message.profiles.display_name || message.profiles.email}
                            </span>
                            <span className="text-xs text-gray-500">{formatTime(message.created_at)}</span>
                          </div>
                          {message.reply_to_message && (
                            <div className="bg-gray-50 border-l-2 border-gray-300 pl-3 py-2 mb-2 text-sm">
                              <div className="text-gray-600 text-xs mb-1">
                                Replying to{" "}
                                {message.reply_to_message.profiles.display_name ||
                                  message.reply_to_message.profiles.email}
                              </div>
                              <div className="text-gray-700 line-clamp-2">{message.reply_to_message.message}</div>
                            </div>
                          )}
                          <div className="text-gray-800 text-sm leading-relaxed">{message.message}</div>
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
                              onClick={() => setReplyTo(message)}
                            >
                              <Reply className="h-3 w-3 mr-1" />
                              Reply
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No messages yet</p>
                      <p className="text-sm">Start the conversation with your team</p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Reply indicator */}
              {replyTo && (
                <div className="border-t bg-gray-50 p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="text-gray-600">Replying to </span>
                      <span className="font-medium">{replyTo.profiles.display_name || replyTo.profiles.email}</span>
                      <div className="text-gray-700 line-clamp-1 mt-1">{replyTo.message}</div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setReplyTo(null)}>
                      ✕
                    </Button>
                  </div>
                </div>
              )}

              {/* Message input */}
              <div className="border-t p-4">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 min-h-[40px] max-h-[120px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage(e)
                      }
                    }}
                  />
                  <Button type="submit" disabled={isLoading || !newMessage.trim()} className="self-end">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Team members */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {project.project_members.map((member) => (
                  <div key={member.user_id} className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.profiles.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                        {member.profiles.display_name?.charAt(0)?.toUpperCase() ||
                          member.profiles.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {member.profiles.display_name || member.profiles.email}
                        {member.user_id === userId && <span className="text-gray-500 ml-1">(You)</span>}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activities.length > 0 ? (
                  activities.slice(0, 10).map((activity) => (
                    <div key={activity.id} className="flex gap-2 text-sm">
                      <span className="text-lg">{getActivityIcon(activity.activity_type)}</span>
                      <div className="flex-1">
                        <p className="text-gray-800">{getActivityMessage(activity)}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(activity.created_at)}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
