import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Profile {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  date_of_birth: string | null;
  school_level: string | null;
  role: "student" | "parent" | "admin" | "teacher" | "editeur" | "reviseur" | null;
  account_active: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface LinkedChild {
  id: string;
  child_id: string;
  status: string;
  created_at: string;
  child: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    full_name: string | null;
    email: string | null;
    school_level: string | null;
    avatar_url: string | null;
  };
}

export interface LinkedParent {
  id: string;
  parent_id: string;
  status: string;
  created_at: string;
  parent: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    full_name: string | null;
    email: string | null;
  };
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      toast.error("Erreur lors du chargement du profil");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (updates: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>) => {
    if (!user) return false;

    setSaving(true);
    try {
      // Build update object with proper typing
      const updateData: Record<string, unknown> = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);

      if (error) throw error;

      // Log activity
      await supabase.rpc("log_user_activity", {
        p_user_id: user.id,
        p_action: "profile_updated",
        p_entity_type: "profile",
        p_entity_id: user.id,
        p_details: { updated_fields: Object.keys(updates) },
      });

      setProfile((prev) => (prev ? { ...prev, ...updates, updated_at: new Date().toISOString() } : null));
      toast.success("Profil mis à jour avec succès");
      return true;
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error("Erreur lors de la mise à jour du profil");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!user) return null;

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("medias")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("medias").getPublicUrl(fileName);

      await updateProfile({ avatar_url: data.publicUrl });
      return data.publicUrl;
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast.error("Erreur lors du téléchargement de l'avatar");
      return null;
    }
  };

  return {
    profile,
    loading,
    saving,
    updateProfile,
    uploadAvatar,
    refetch: fetchProfile,
  };
}

export function useLinkedChildren() {
  const { user } = useAuth();
  const [children, setChildren] = useState<LinkedChild[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChildren = useCallback(async () => {
    if (!user) {
      setChildren([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("parent_children")
        .select(`
          id,
          child_id,
          status,
          created_at,
          child:profiles!parent_children_child_id_fkey(
            id,
            first_name,
            last_name,
            full_name,
            email,
            school_level,
            avatar_url
          )
        `)
        .eq("parent_id", user.id);

      if (error) throw error;
      setChildren((data as any[]) || []);
    } catch (error: any) {
      console.error("Error fetching children:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  const addChildByEmail = async (email: string): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: "Non authentifié" };

    try {
      const { data, error } = await supabase.rpc("create_parent_child_request", {
        p_parent_id: user.id,
        p_child_email: email,
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string };
      if (result.success) {
        await fetchChildren();
      }
      return result;
    } catch (error: any) {
      console.error("Error adding child:", error);
      return { success: false, message: error.message };
    }
  };

  const addChildByCode = async (code: string): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: "Non authentifié" };

    try {
      const { data, error } = await supabase.rpc("create_parent_child_request", {
        p_parent_id: user.id,
        p_linking_code: code.toUpperCase(),
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string };
      if (result.success) {
        await fetchChildren();
      }
      return result;
    } catch (error: any) {
      console.error("Error adding child by code:", error);
      return { success: false, message: error.message };
    }
  };

  const removeChild = async (linkId: string) => {
    try {
      const { error } = await supabase
        .from("parent_children")
        .delete()
        .eq("id", linkId);

      if (error) throw error;
      
      await fetchChildren();
      toast.success("Lien supprimé avec succès");
      return true;
    } catch (error: any) {
      console.error("Error removing child:", error);
      toast.error("Erreur lors de la suppression du lien");
      return false;
    }
  };

  return {
    children,
    loading,
    addChildByEmail,
    addChildByCode,
    removeChild,
    refetch: fetchChildren,
  };
}

export function useLinkedParents() {
  const { user } = useAuth();
  const [parents, setParents] = useState<LinkedParent[]>([]);
  const [linkingCode, setLinkingCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchParents = useCallback(async () => {
    if (!user) {
      setParents([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("parent_children")
        .select(`
          id,
          parent_id,
          status,
          created_at,
          parent:profiles!parent_children_parent_id_fkey(
            id,
            first_name,
            last_name,
            full_name,
            email
          )
        `)
        .eq("child_id", user.id);

      if (error) throw error;
      setParents((data as any[]) || []);
    } catch (error: any) {
      console.error("Error fetching parents:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchParents();
  }, [fetchParents]);

  const generateLinkingCode = async () => {
    if (!user) return null;

    try {
      const { data: code, error: codeError } = await supabase.rpc("generate_linking_code");
      if (codeError) throw codeError;

      const { error } = await supabase.from("linking_codes").insert({
        child_id: user.id,
        code: code,
      });

      if (error) throw error;

      setLinkingCode(code);
      return code;
    } catch (error: any) {
      console.error("Error generating code:", error);
      toast.error("Erreur lors de la génération du code");
      return null;
    }
  };

  const respondToRequest = async (requestId: string, accept: boolean) => {
    try {
      const { data, error } = await supabase.rpc("respond_to_link_request", {
        p_request_id: requestId,
        p_accept: accept,
      });

      if (error) throw error;
      
      await fetchParents();
      toast.success(accept ? "Lien accepté" : "Demande refusée");
      return data;
    } catch (error: any) {
      console.error("Error responding to request:", error);
      toast.error("Erreur lors de la réponse");
      return { success: false };
    }
  };

  const removeParent = async (linkId: string) => {
    try {
      const { error } = await supabase
        .from("parent_children")
        .delete()
        .eq("id", linkId);

      if (error) throw error;
      
      await fetchParents();
      toast.success("Lien supprimé avec succès");
      return true;
    } catch (error: any) {
      console.error("Error removing parent:", error);
      toast.error("Erreur lors de la suppression du lien");
      return false;
    }
  };

  return {
    parents,
    linkingCode,
    loading,
    generateLinkingCode,
    respondToRequest,
    removeParent,
    refetch: fetchParents,
  };
}
