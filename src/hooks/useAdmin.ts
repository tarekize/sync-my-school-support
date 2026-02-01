import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface AdminUser {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: string | null;
  school_level: string | null;
  account_active: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: any;
  created_at: string;
  user?: {
    full_name: string | null;
    email: string | null;
  };
}

export interface AdminStats {
  totalUsers: number;
  students: number;
  parents: number;
  admins: number;
  newUsersThisWeek: number;
  activeUsers: number;
}

export function useAdminUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    students: 0,
    parents: 0,
    admins: 0,
    newUsersThisWeek: 0,
    activeUsers: 0,
  });

  const fetchUsers = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setUsers(data || []);

      // Calculate stats
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      setStats({
        totalUsers: data?.length || 0,
        students: data?.filter((u) => u.role === "student").length || 0,
        parents: data?.filter((u) => u.role === "parent").length || 0,
        admins: data?.filter((u) => u.role === "admin").length || 0,
        newUsersThisWeek:
          data?.filter((u) => new Date(u.created_at) > oneWeekAgo).length || 0,
        activeUsers: data?.filter((u) => u.account_active).length || 0,
      });
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error("Erreur lors du chargement des utilisateurs");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleUserStatus = async (userId: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ account_active: active })
        .eq("id", userId);

      if (error) throw error;

      await supabase.rpc("log_user_activity", {
        p_user_id: user?.id,
        p_action: active ? "user_activated" : "user_deactivated",
        p_entity_type: "user",
        p_entity_id: userId,
      });

      await fetchUsers();
      toast.success(active ? "Compte activé" : "Compte désactivé");
      return true;
    } catch (error: any) {
      console.error("Error toggling user status:", error);
      toast.error("Erreur lors de la modification du statut");
      return false;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      // Note: This only removes the profile. Full account deletion requires server-side action
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (error) throw error;

      await supabase.rpc("log_user_activity", {
        p_user_id: user?.id,
        p_action: "user_deleted",
        p_entity_type: "user",
        p_entity_id: userId,
      });

      await fetchUsers();
      toast.success("Utilisateur supprimé");
      return true;
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error("Erreur lors de la suppression");
      return false;
    }
  };

  return {
    users,
    stats,
    loading,
    toggleUserStatus,
    deleteUser,
    refetch: fetchUsers,
  };
}

export function useActivityLogs(limit: number = 50) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("activity_logs")
        .select(`
          *,
          user:profiles!activity_logs_user_id_fkey(
            full_name,
            email
          )
        `)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      setLogs((data as any[]) || []);
    } catch (error: any) {
      console.error("Error fetching activity logs:", error);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { logs, loading, refetch: fetchLogs };
}
