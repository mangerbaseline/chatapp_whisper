"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import {
  fetchConnections,
  removeConnection,
  Connection,
} from "@/redux/features/connections/connectionsSlice";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Search, UserMinus, Users, Loader2 } from "lucide-react";

export default function ConnectionsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { connections, loading, error } = useSelector(
    (state: RootState) => state.connections,
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchConnections());
  }, [dispatch]);

  const handleRemoveConnection = async (connectionId: string) => {
    setRemovingId(connectionId);
    await dispatch(removeConnection(connectionId));
    setRemovingId(null);
  };

  const filteredConnections = connections.filter((connection: Connection) => {
    const fullName =
      `${connection.firstName || ""} ${connection.lastName || ""}`.toLowerCase();
    const email = connection.email.toLowerCase();
    const q = searchQuery.toLowerCase();
    return fullName.includes(q) || email.includes(q);
  });

  const getInitials = (connection: Connection) => {
    const first = connection.firstName?.[0] || "";
    const last = connection.lastName?.[0] || "";
    return (first + last).toUpperCase() || connection.email[0].toUpperCase();
  };

  return (
    <section className="px-2 py-4 flex flex-col gap-4 h-full">
      <div>
        <h1 className="text-xl font-semibold">Connections</h1>
        <p className="text-sm text-muted-foreground">Manage your connections</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search connections..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && connections.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <CardTitle className="text-base mb-1">No connections yet</CardTitle>
            <CardDescription>
              Search for users and send invitations to build your network.
            </CardDescription>
          </CardContent>
        </Card>
      )}

      {!loading &&
        connections.length > 0 &&
        filteredConnections.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No connections match &quot;{searchQuery}&quot;
          </div>
        )}

      <div className="flex flex-col gap-2 overflow-y-auto flex-1">
        {filteredConnections.map((connection: Connection) => (
          <Card
            key={connection._id}
            className="border-border/50 hover:border-border transition-colors"
          >
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage
                    src={connection.image}
                    alt={connection.firstName || connection.email}
                  />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {getInitials(connection)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {connection.firstName || ""} {connection.lastName || ""}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {connection.email}
                  </p>
                </div>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-muted font-semibold shrink-0 cursor-pointer"
                    disabled={removingId === connection._id}
                  >
                    {removingId === connection._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <UserMinus className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Remove</span>
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove Connection</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to remove{" "}
                      <span className="font-medium text-foreground">
                        {connection.firstName} {connection.lastName}
                      </span>{" "}
                      from your connections? You will need to send a new
                      invitation to reconnect.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="cursor-pointer">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleRemoveConnection(connection._id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
                    >
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
