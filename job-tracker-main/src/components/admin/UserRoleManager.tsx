import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const UserRoleManager = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profiles) {
      const usersWithRoles = await Promise.all(
        profiles.map(async (profile) => {
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.id);

          return {
            ...profile,
            roles: roles?.map((r) => r.role) || [],
          };
        })
      );

      setUsers(usersWithRoles);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddRole = async (userId: string, role: string) => {
    setLoading(true);

    const { error } = await supabase.from("user_roles").insert([{
      user_id: userId,
      role: role as "admin" | "manager" | "allocater" | "declarant",
    }]);

    if (error) {
      toast({
        title: "Error",
        description: error.code === "23505" 
          ? "User already has this role" 
          : "Failed to add role. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Role added successfully",
      });
      fetchUsers();
    }

    setLoading(false);
  };

  const handleRemoveRole = async (userId: string, role: string) => {
    setLoading(true);

    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", role as "admin" | "manager" | "allocater" | "declarant");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove role. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Role removed successfully",
      });
      fetchUsers();
    }

    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">User Role Management</h2>
      {users.map((user) => (
        <Card key={user.id}>
          <CardHeader>
            <CardTitle className="text-base">
              {user.full_name} ({user.employee_id})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                {user.roles.length > 0 ? (
                  user.roles.map((role: string) => (
                    <Badge key={role} variant="secondary" className="gap-2">
                      {role}
                      <button
                        onClick={() => handleRemoveRole(user.id, role)}
                        className="ml-2 hover:text-destructive"
                        disabled={loading}
                      >
                        ×
                      </button>
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No roles assigned</p>
                )}
              </div>

              <div className="flex gap-2">
                <Select
                  onValueChange={(role) => handleAddRole(user.id, role)}
                  disabled={loading}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Add role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="allocater">Allocater</SelectItem>
                    <SelectItem value="declarant">Declarant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default UserRoleManager;
