import { supabase } from '@/integrations/supabase/client';

export const courseService = {
  // Créer un nouveau cours
  async create(courseData: any) {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('cours')
      .insert([{
        ...courseData,
        auteur_id: user?.id,
        date_creation: new Date().toISOString(),
        statut: 'brouillon'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Récupérer un cours avec toutes ses relations
  async getById(id: number) {
    const { data, error } = await supabase
      .from('cours')
      .select(`
        *,
        matiere:matieres(*),
        niveau:niveaux(*),
        sections(
          *,
          formules(*),
          medias(*)
        )
      `)
      .eq('id', id)
      .order('ordre', { referencedTable: 'sections' })
      .single();

    if (error) throw error;
    return data;
  },

  // Lister tous les cours avec filtres
  async list(filters: any = {}) {
    let query = supabase
      .from('cours')
      .select(`
        *,
        matiere:matieres(nom),
        niveau:niveaux(nom)
      `);

    if (filters.matiere_id) {
      query = query.eq('matiere_id', filters.matiere_id);
    }
    if (filters.niveau_id) {
      query = query.eq('niveau_id', filters.niveau_id);
    }
    if (filters.statut) {
      query = query.eq('statut', filters.statut);
    }
    if (filters.search) {
      query = query.or(`titre.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    query = query.order('date_modification', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Mettre à jour un cours
  async update(id: number, updates: any) {
    const { data, error } = await supabase
      .from('cours')
      .update({
        ...updates,
        date_modification: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Publier un cours
  async publish(id: number) {
    return this.update(id, {
      statut: 'publié',
      date_publication: new Date().toISOString()
    });
  },

  // Envoyer en révision
  async sendToReview(id: number, revieur_id: string, commentaire: string) {
    return this.update(id, {
      statut: 'en_revision',
      revieur_id: revieur_id,
      commentaire_revue: commentaire
    });
  },

  // Dupliquer un cours
  async duplicate(id: number) {
    const original = await this.getById(id);

    // Copier uniquement les vraies colonnes de la table cours
    const duplicate = {
      titre: `${original.titre} (copie)`,
      slug: `${original.slug}-copie-${Date.now()}`,
      description: original.description,
      matiere_id: original.matiere_id,
      niveau_id: original.niveau_id,
      programme_id: original.programme_id,
      difficulte: original.difficulte,
      duree_lecture: original.duree_lecture,
      meta_title: original.meta_title,
      meta_description: original.meta_description,
      commentaire_revue: null,
      revieur_id: null
    };

    const newCourse = await this.create(duplicate);

    // Dupliquer sections
    if (original.sections) {
      const { sectionService } = await import('./sectionService');
      for (const section of original.sections) {
        await sectionService.create(newCourse.id, section);
      }
    }

    return newCourse;
  },

  // Supprimer un cours
  async delete(id: number) {
    const { error } = await supabase
      .from('cours')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Statistiques
  async getStats() {
    const { count: published } = await supabase
      .from('cours')
      .select('*', { count: 'exact', head: true })
      .eq('statut', 'publié');

    const { count: drafts } = await supabase
      .from('cours')
      .select('*', { count: 'exact', head: true })
      .eq('statut', 'brouillon');

    const { count: inReview } = await supabase
      .from('cours')
      .select('*', { count: 'exact', head: true })
      .eq('statut', 'en_revision');

    return { published, drafts, inReview };
  }
};
