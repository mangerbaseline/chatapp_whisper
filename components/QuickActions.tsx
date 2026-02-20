import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function QuickActions() {
  return (
    <Card className="opacity-0 animate-fade-in">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <Button className="w-full cursor-pointer">Create Project</Button>
        <Button variant="outline" className="w-full cursor-pointer">
          Invite Team Member
        </Button>
        <Button variant="secondary" className="w-full cursor-pointer">
          View Billing
        </Button>
      </CardContent>
    </Card>
  );
}
