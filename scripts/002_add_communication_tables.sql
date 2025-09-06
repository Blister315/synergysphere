-- Create project messages table for team communication
CREATE TABLE IF NOT EXISTS public.project_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system')),
  file_url TEXT,
  reply_to UUID REFERENCES public.project_messages(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task comments table
CREATE TABLE IF NOT EXISTS public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activity log table for project activities
CREATE TABLE IF NOT EXISTS public.project_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('task_created', 'task_updated', 'task_completed', 'member_added', 'member_removed', 'project_updated')),
  activity_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_messages
CREATE POLICY "Users can view messages for their projects" ON public.project_messages FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.project_members 
    WHERE project_id = project_messages.project_id AND user_id = auth.uid()
  )
);
CREATE POLICY "Project members can create messages" ON public.project_messages FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.project_members 
    WHERE project_id = project_messages.project_id AND user_id = auth.uid()
  ) AND auth.uid() = user_id
);
CREATE POLICY "Users can update own messages" ON public.project_messages FOR UPDATE 
USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own messages" ON public.project_messages FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for task_comments
CREATE POLICY "Users can view comments for project tasks" ON public.task_comments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.project_members pm ON t.project_id = pm.project_id
    WHERE t.id = task_comments.task_id AND pm.user_id = auth.uid()
  )
);
CREATE POLICY "Project members can create comments" ON public.task_comments FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.project_members pm ON t.project_id = pm.project_id
    WHERE t.id = task_comments.task_id AND pm.user_id = auth.uid()
  ) AND auth.uid() = user_id
);
CREATE POLICY "Users can update own comments" ON public.task_comments FOR UPDATE 
USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.task_comments FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for project_activities
CREATE POLICY "Users can view activities for their projects" ON public.project_activities FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.project_members 
    WHERE project_id = project_activities.project_id AND user_id = auth.uid()
  )
);
CREATE POLICY "System can create activities" ON public.project_activities FOR INSERT 
WITH CHECK (true);

-- Create function to log project activities
CREATE OR REPLACE FUNCTION public.log_project_activity(
  p_project_id UUID,
  p_user_id UUID,
  p_activity_type TEXT,
  p_activity_data JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO public.project_activities (project_id, user_id, activity_type, activity_data)
  VALUES (p_project_id, p_user_id, p_activity_type, p_activity_data)
  RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$;

-- Create triggers for automatic activity logging
CREATE OR REPLACE FUNCTION public.log_task_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_project_activity(
      NEW.project_id,
      NEW.created_by,
      'task_created',
      jsonb_build_object('task_name', NEW.name, 'task_id', NEW.id)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status AND NEW.status = 'completed' THEN
      PERFORM public.log_project_activity(
        NEW.project_id,
        auth.uid(),
        'task_completed',
        jsonb_build_object('task_name', NEW.name, 'task_id', NEW.id)
      );
    ELSIF OLD.status != NEW.status OR OLD.name != NEW.name OR OLD.assignee_id != NEW.assignee_id THEN
      PERFORM public.log_project_activity(
        NEW.project_id,
        auth.uid(),
        'task_updated',
        jsonb_build_object('task_name', NEW.name, 'task_id', NEW.id, 'changes', jsonb_build_object('status', NEW.status))
      );
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS task_activity_trigger ON public.tasks;
CREATE TRIGGER task_activity_trigger
  AFTER INSERT OR UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.log_task_activity();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_messages_project_id ON public.project_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_project_messages_created_at ON public.project_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON public.task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON public.task_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_activities_project_id ON public.project_activities(project_id);
CREATE INDEX IF NOT EXISTS idx_project_activities_created_at ON public.project_activities(created_at DESC);
