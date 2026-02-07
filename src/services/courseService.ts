import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type SchoolLevel = Database["public"]["Enums"]["school_level"];

export interface Lesson {
  id: string;
  title: string;
  title_ar: string | null;
  order_index: number;
  content: string | null;
  video_url: string | null;
}

export interface Chapter {
  id: string;
  title: string;
  title_ar: string | null;
  order_index: number;
  description: string | null;
  lessons: Lesson[];
}

export interface Filiere {
  id: string;
  code: string;
  name: string;
  name_ar: string | null;
  school_level: string;
}

export const courseService = {
  /**
   * Récupère les filières disponibles pour un niveau scolaire
   */
  async getFilieresByLevel(schoolLevel: SchoolLevel): Promise<Filiere[]> {
    const { data, error } = await supabase
      .from("filieres")
      .select("*")
      .eq("school_level", schoolLevel)
      .order("name");

    if (error) {
      console.error("Error fetching filieres:", error);
      return [];
    }

    return data || [];
  },

  /**
   * Récupère les chapitres et leçons pour un niveau, une filière et une matière
   */
  async getChaptersWithLessons(
    schoolLevel: SchoolLevel,
    filiereCode: string | null,
    subject: string = "math"
  ): Promise<Chapter[]> {
    let query = supabase
      .from("chapters")
      .select(`
        id,
        title,
        title_ar,
        order_index,
        description,
        lessons (
          id,
          title,
          title_ar,
          order_index,
          content,
          video_url
        )
      `)
      .eq("school_level", schoolLevel)
      .eq("subject", subject)
      .order("order_index");

    // Si une filière est spécifiée, filtrer par filière
    if (filiereCode) {
      const { data: filiereData } = await supabase
        .from("filieres")
        .select("id")
        .eq("code", filiereCode)
        .eq("school_level", schoolLevel)
        .maybeSingle();

      if (filiereData) {
        query = query.eq("filiere_id", filiereData.id);
      } else {
        // Si la filière n'existe pas, chercher les chapitres sans filière
        query = query.is("filiere_id", null);
      }
    } else {
      // Si pas de filière, chercher les chapitres sans filière
      query = query.is("filiere_id", null);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching chapters:", error);
      return [];
    }

    // Trier les leçons par order_index
    return (data || []).map((chapter: any) => ({
      ...chapter,
      lessons: (chapter.lessons || []).sort((a: Lesson, b: Lesson) => a.order_index - b.order_index),
    }));
  },

  /**
   * Récupère un chapitre spécifique avec ses leçons
   */
  async getChapterById(chapterId: string): Promise<Chapter | null> {
    const { data, error } = await supabase
      .from("chapters")
      .select(`
        id,
        title,
        title_ar,
        order_index,
        description,
        lessons (
          id,
          title,
          title_ar,
          order_index,
          content,
          video_url
        )
      `)
      .eq("id", chapterId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching chapter:", error);
      return null;
    }

    if (!data) return null;

    return {
      ...data,
      lessons: (data.lessons || []).sort((a: Lesson, b: Lesson) => a.order_index - b.order_index),
    };
  },

  /**
   * Récupère une leçon spécifique
   */
  async getLessonById(lessonId: string): Promise<Lesson | null> {
    const { data, error } = await supabase
      .from("lessons")
      .select("*")
      .eq("id", lessonId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching lesson:", error);
      return null;
    }

    return data;
  },

  /**
   * Créer un nouveau chapitre
   */
  async createChapter(
    schoolLevel: SchoolLevel,
    filiereCode: string | null,
    subject: string,
    title: string,
    titleAr: string | null,
    description: string | null
  ): Promise<Chapter | null> {
    // Trouver l'ID de la filière si spécifiée
    let filiereId = null;
    if (filiereCode) {
      const { data: filiereData } = await supabase
        .from("filieres")
        .select("id")
        .eq("code", filiereCode)
        .eq("school_level", schoolLevel)
        .maybeSingle();
      filiereId = filiereData?.id || null;
    }

    // Trouver le prochain order_index
    const { data: maxOrder } = await supabase
      .from("chapters")
      .select("order_index")
      .eq("school_level", schoolLevel)
      .eq("subject", subject)
      .eq("filiere_id", filiereId)
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (maxOrder?.order_index || 0) + 1;

    const { data, error } = await supabase
      .from("chapters")
      .insert({
        school_level: schoolLevel,
        filiere_id: filiereId,
        subject,
        title,
        title_ar: titleAr,
        description,
        order_index: nextOrder,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating chapter:", error);
      return null;
    }

    return {
      ...data,
      lessons: [],
    };
  },

  /**
   * Mettre à jour un chapitre
   */
  async updateChapter(
    chapterId: string,
    updates: {
      title?: string;
      title_ar?: string | null;
      description?: string | null;
    }
  ): Promise<boolean> {
    const { error } = await supabase
      .from("chapters")
      .update(updates)
      .eq("id", chapterId);

    if (error) {
      console.error("Error updating chapter:", error);
      return false;
    }

    return true;
  },

  /**
   * Supprimer un chapitre
   */
  async deleteChapter(chapterId: string): Promise<boolean> {
    const { error } = await supabase
      .from("chapters")
      .delete()
      .eq("id", chapterId);

    if (error) {
      console.error("Error deleting chapter:", error);
      return false;
    }

    return true;
  },

  /**
   * Créer une nouvelle leçon
   */
  async createLesson(
    chapterId: string,
    title: string,
    titleAr: string | null,
    content: string | null,
    videoUrl: string | null
  ): Promise<Lesson | null> {
    // Trouver le prochain order_index
    const { data: maxOrder } = await supabase
      .from("lessons")
      .select("order_index")
      .eq("chapter_id", chapterId)
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (maxOrder?.order_index || 0) + 1;

    const { data, error } = await supabase
      .from("lessons")
      .insert({
        chapter_id: chapterId,
        title,
        title_ar: titleAr,
        content,
        video_url: videoUrl,
        order_index: nextOrder,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating lesson:", error);
      return null;
    }

    return data;
  },

  /**
   * Mettre à jour une leçon
   */
  async updateLesson(
    lessonId: string,
    updates: {
      title?: string;
      title_ar?: string | null;
      content?: string | null;
      video_url?: string | null;
    }
  ): Promise<boolean> {
    const { error } = await supabase
      .from("lessons")
      .update(updates)
      .eq("id", lessonId);

    if (error) {
      console.error("Error updating lesson:", error);
      return false;
    }

    return true;
  },

  /**
   * Supprimer une leçon
   */
  async deleteLesson(lessonId: string): Promise<boolean> {
    const { error } = await supabase
      .from("lessons")
      .delete()
      .eq("id", lessonId);

    if (error) {
      console.error("Error deleting lesson:", error);
      return false;
    }

    return true;
  },
};
