import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET user settings
export async function GET() {
  const supabase = createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("users")
    .select("name, email, notifications")
    .eq("id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// PUT update user settings
export async function PUT(req: Request) {
  const supabase = createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, email, password, notifications } = body;

  const updates: Record<string, any> = {};
  if (name) updates.name = name;
  if (typeof notifications === "boolean") updates.notifications = notifications;

  // Update password if given
  if (password) {
    const { error: pwError } = await supabase.auth.updateUser({ password });
    if (pwError) {
      return NextResponse.json({ error: pwError.message }, { status: 500 });
    }
  }

  // Update user profile
  if (Object.keys(updates).length > 0) {
    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", user.id)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data[0]);
  }

  return NextResponse.json({ success: true });
}
