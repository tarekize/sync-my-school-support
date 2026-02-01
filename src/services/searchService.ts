import { supabase } from '@/integrations/supabase/client';

export const searchService = {
  // Recherche globale
  async search(query: string, filters: any = {}) {
    let coursQuery = supabase
      .from('cours')
      .select(`
        *,
        matiere:matieres(nom),
        niveau:niveaux(nom)
      `);

    // Recherche texte
    if (query) {
      coursQuery = coursQuery.or(
        `titre.ilike.%${query}%,description.ilike.%${query}%`
      );
    }

    // Filtres
    if (filters.matiere_id) {
      coursQuery = coursQuery.eq('matiere_id', filters.matiere_id);
    }
    if (filters.niveau_id) {
      coursQuery = coursQuery.eq('niveau_id', filters.niveau_id);
    }
    if (filters.statut) {
      coursQuery = coursQuery.eq('statut', filters.statut);
    }

    const { data: courses, error } = await coursQuery
      .order('date_modification', { ascending: false })
      .limit(50);

    if (error) throw error;

    // Rechercher aussi dans sections
    const { data: sections } = await supabase
      .from('sections')
      .select('*, cours:cours_id(titre)')
      .ilike('contenu_texte', `%${query}%`)
      .limit(20);

    return {
      courses: courses || [],
      sections: sections || []
    };
  },

  // Autocomplete
  async autocomplete(query: string) {
    const { data, error } = await supabase
      .from('cours')
      .select('id, titre, slug')
      .ilike('titre', `%${query}%`)
      .limit(10);

    if (error) throw error;
    return data;
  },

  // Recherche par tags (si implémenté)
  async searchByTags(tags: string[]) {
    // À implémenter selon votre système de tags
    return [];
  }
};
