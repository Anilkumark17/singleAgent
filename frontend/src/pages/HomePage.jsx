import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <CardTitle className="text-3xl">YouTube Management</CardTitle>
          <CardDescription>
            Monitor channels, track uploads, and manage your YouTube presence in one place.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link to="/login">Sign in</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/register">Create account</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
