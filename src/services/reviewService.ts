import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const reviewService = {
  // Envoyer un cours en révision
  async sendToReview(coursId: number, revieurId: string, message?: string) {
    try {
      const { data, error } = await supabase
        .from('cours')
        .update({
          statut: 'en_revision',
          revieur_id: revieurId,
          commentaire_revue: message || null,
        })
        .eq('id', coursId)
        .select()
        .single();

      if (error) throw error;

      // Envoyer notification email au réviseur
      await supabase.functions.invoke('send-notification-email', {
        body: {
          type: 'review_request',
          revieurId,
          coursId,
          message,
        },
      });

      return data;
    } catch (error) {
      console.error('Error sending to review:', error);
      throw error;
    }
  },

  // Approuver un cours
  async approve(coursId: number, commentaire?: string) {
    try {
      const { data, error } = await supabase
        .from('cours')
        .update({
          statut: 'publié',
          date_publication: new Date().toISOString(),
          commentaire_revue: commentaire || null,
        })
        .eq('id', coursId)
        .select()
        .single();

      if (error) throw error;

      // Notifier l'auteur de l'approbation
      if (data?.auteur_id) {
        await supabase.functions.invoke('send-notification-email', {
          body: {
            type: 'course_approved',
            auteurId: data.auteur_id,
            coursId,
            commentaire,
          },
        });
      }

      return data;
    } catch (error) {
      console.error('Error approving course:', error);
      throw error;
    }
  },

  // Demander des modifications
  async requestChanges(coursId: number, commentaire: string) {
    try {
      const { data, error } = await supabase
        .from('cours')
        .update({
          statut: 'brouillon',
          commentaire_revue: commentaire,
        })
        .eq('id', coursId)
        .select()
        .single();

      if (error) throw error;

      // Notifier l'auteur des modifications demandées
      if (data?.auteur_id) {
        await supabase.functions.invoke('send-notification-email', {
          body: {
            type: 'changes_requested',
            auteurId: data.auteur_id,
            coursId,
            commentaire,
          },
        });
      }

      return data;
    } catch (error) {
      console.error('Error requesting changes:', error);
      throw error;
    }
  },

  // Liste des cours en attente de révision
  async listPending() {
    try {
      const { data, error } = await supabase
        .from('cours')
        .select(`
          *,
          auteur:auteur_id(id, email, first_name, last_name, full_name),
          matiere:matiere_id(nom, slug),
          niveau:niveau_id(nom)
        `)
        .eq('statut', 'en_revision')
        .order('date_modification', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error listing pending reviews:', error);
      throw error;
    }
  },

  // Récupérer un cours spécifique en révision
  async getCourseForReview(coursId: number) {
    try {
      const { data, error } = await supabase
        .from('cours')
        .select(`
          *,
          auteur:auteur_id(id, email, first_name, last_name, full_name),
          matiere:matiere_id(nom, slug),
          niveau:niveau_id(nom),
          sections(*)
        `)
        .eq('id', coursId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting course for review:', error);
      throw error;
    }
  },

  // Liste des cours envoyés en révision par un auteur
  async listMyCoursesInReview() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('cours')
        .select(`
          *,
          revieur:revieur_id(id, email, first_name, last_name, full_name),
          matiere:matiere_id(nom, slug),
          niveau:niveau_id(nom)
        `)
        .eq('auteur_id', user.id)
        .eq('statut', 'en_revision')
        .order('date_modification', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error listing my courses in review:', error);
      throw error;
    }
  },
};
