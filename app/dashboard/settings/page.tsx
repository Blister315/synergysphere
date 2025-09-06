"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notifications, setNotifications] = useState(true);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Load current settings
  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setName(data.name || "");
        setEmail(data.email || "");
        setNotifications(data.notifications ?? true);
      }
    };
    fetchData();
  }, []);

  // Save profile changes
  const handleSaveProfile = async () => {
    setLoading(true);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, notifications }),
    });
    setLoading(false);
    if (res.ok) {
      alert("Profile updated ✅");
    } else {
      const err = await res.json();
      alert(`Error: ${err.error}`);
    }
  };

  // Update password
  const handleChangePassword = async () => {
    if (!password) return alert("Enter a new password");
    setLoading(true);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      alert("Password updated 🔑");
      setPassword("");
    } else {
      const err = await res.json();
      alert(`Error: ${err.error}`);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Profile Settings</h1>

      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button
            onClick={handleSaveProfile}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button
            onClick={handleChangePassword}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <span>Email Notifications</span>
          <Switch
            checked={notifications}
            onCheckedChange={setNotifications}
          />
        </CardContent>
      </Card>
    </div>
  );
}
