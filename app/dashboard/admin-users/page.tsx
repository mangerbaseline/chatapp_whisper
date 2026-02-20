import ManageUsers from "@/components/ManageUsers";

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Manage Users
        </h1>
        <p className="text-muted-foreground mt-2">
          View and manage all registered users. Update their status or delete
          accounts.
        </p>
      </div>
      <ManageUsers />
    </div>
  );
}
