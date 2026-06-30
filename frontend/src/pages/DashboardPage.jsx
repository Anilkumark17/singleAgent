import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import TavilySearch from "@/components/tavily/TavilySearch";

import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-svh bg-muted/40 p-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Fake job detection dashboard</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome, {user?.name}</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-left">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <span className="text-sm text-muted-foreground">Role</span>
              <Badge variant="secondary">{user?.role}</Badge>
            </div>
          </CardContent>
        </Card>
        <TavilySearch />
      </div>
    </div>
  );
}
