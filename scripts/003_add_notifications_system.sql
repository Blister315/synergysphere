-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('task_assigned', 'task_completed', 'project_invite', 'deadline_reminder', 'project_update', 'comment_added')),
  read BOOLEAN DEFAULT FALSE,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to create notifications
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT,
  p_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, title, message, type, data)
  VALUES (p_user_id, p_title, p_message, p_type, p_data)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for task assignments
CREATE OR REPLACE FUNCTION notify_task_assigned()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify if assignee changed
  IF OLD.assignee_id IS DISTINCT FROM NEW.assignee_id AND NEW.assignee_id IS NOT NULL THEN
    PERFORM create_notification(
      NEW.assignee_id,
      'New Task Assigned',
      'You have been assigned to task: ' || NEW.title,
      'task_assigned',
      jsonb_build_object('task_id', NEW.id, 'project_id', NEW.project_id)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for task completion
CREATE OR REPLACE FUNCTION notify_task_completed()
RETURNS TRIGGER AS $$
DECLARE
  project_owner UUID;
  task_title TEXT;
BEGIN
  -- Only notify when task is marked as completed
  IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
    -- Get project owner and task title
    SELECT p.created_by, NEW.title INTO project_owner, task_title
    FROM projects p WHERE p.id = NEW.project_id;
    
    -- Notify project owner if different from task assignee
    IF project_owner != NEW.assignee_id THEN
      PERFORM create_notification(
        project_owner,
        'Task Completed',
        'Task "' || task_title || '" has been completed',
        'task_completed',
        jsonb_build_object('task_id', NEW.id, 'project_id', NEW.project_id)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for project invitations
CREATE OR REPLACE FUNCTION notify_project_invite()
RETURNS TRIGGER AS $$
DECLARE
  project_name TEXT;
BEGIN
  -- Get project name
  SELECT name INTO project_name FROM projects WHERE id = NEW.project_id;
  
  -- Notify the invited user
  PERFORM create_notification(
    NEW.user_id,
    'Project Invitation',
    'You have been invited to join project: ' || project_name,
    'project_invite',
    jsonb_build_object('project_id', NEW.project_id)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_notify_task_assigned ON tasks;
CREATE TRIGGER trigger_notify_task_assigned
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_assigned();

DROP TRIGGER IF EXISTS trigger_notify_task_completed ON tasks;
CREATE TRIGGER trigger_notify_task_completed
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_completed();

DROP TRIGGER IF EXISTS trigger_notify_project_invite ON project_members;
CREATE TRIGGER trigger_notify_project_invite
  AFTER INSERT ON project_members
  FOR EACH ROW
  EXECUTE FUNCTION notify_project_invite();

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read(notification_ids UUID[])
RETURNS VOID AS $$
BEGIN
  UPDATE notifications 
  SET read = TRUE, updated_at = NOW()
  WHERE id = ANY(notification_ids) AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER 
    FROM notifications 
    WHERE user_id = auth.uid() AND read = FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
