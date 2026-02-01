import { supabase } from '@/integrations/supabase/client';
import { courseService } from './courseService';
import { sectionService } from './sectionService';

export const versionService = {
  // Créer une version snapshot
  async createSnapshot(coursId: number, commentaire = '') {
    const { data: { user } } = await supabase.auth.getUser();

    // Récupérer cours complet
    const { data: cours } = await supabase
      .from('cours')
      .select('*, sections(*, formules(*), medias(*))')
      .eq('id', coursId)
      .single();

    // Compter versions existantes
    const { count } = await supabase
      .from('historique_versions')
      .select('*', { count: 'exact', head: true })
      .eq('cours_id', coursId);

    const versionNumero = (count || 0) + 1;

    // Créer snapshot
    const { data, error } = await supabase
      .from('historique_versions')
      .insert([{
        cours_id: coursId,
        version_numero: versionNumero,
        contenu_snapshot: cours,
        auteur_id: user?.id,
        commentaire: commentaire,
        date_version: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Liste versions d'un cours
  async list(coursId: number) {
    const { data, error } = await supabase
      .from('historique_versions')
      .select('*')
      .eq('cours_id', coursId)
      .order('version_numero', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Récupérer une version spécifique
  async getVersion(versionId: number) {
    const { data, error } = await supabase
      .from('historique_versions')
      .select('*')
      .eq('id', versionId)
      .single();

    if (error) throw error;
    return data;
  },

  // Restaurer une version
  async restore(versionId: number) {
    const version = await this.getVersion(versionId);
    const snapshot = version.contenu_snapshot;

    // Restaurer cours
    await courseService.update(snapshot.id, {
      titre: snapshot.titre,
      slug: snapshot.slug,
      description: snapshot.description,
      matiere_id: snapshot.matiere_id,
      niveau_id: snapshot.niveau_id,
      difficulte: snapshot.difficulte,
      duree_lecture: snapshot.duree_lecture
    });

    // Supprimer sections actuelles
    await supabase
      .from('sections')
      .delete()
      .eq('cours_id', snapshot.id);

    // Recréer sections depuis snapshot
    if (snapshot.sections) {
      for (const section of snapshot.sections) {
        await sectionService.create(snapshot.id, section);
      }
    }

    return snapshot;
  },

  // Comparer deux versions (diff)
  async compare(versionId1: number, versionId2: number) {
    const v1 = await this.getVersion(versionId1);
    const v2 = await this.getVersion(versionId2);

    const differences = {
      titre: v1.contenu_snapshot.titre !== v2.contenu_snapshot.titre,
      sections: {
        added: [] as any[],
        removed: [] as any[],
        modified: [] as any[]
      }
    };

    // Comparer sections
    const s1 = v1.contenu_snapshot.sections || [];
    const s2 = v2.contenu_snapshot.sections || [];

    // Sections ajoutées
    differences.sections.added = s2.filter(
      (s: any) => !s1.find((x: any) => x.id === s.id)
    );

    // Sections supprimées
    differences.sections.removed = s1.filter(
      (s: any) => !s2.find((x: any) => x.id === s.id)
    );

    // Sections modifiées
    differences.sections.modified = s2.filter((s: any) => {
      const original = s1.find((x: any) => x.id === s.id);
      return original && original.contenu_texte !== s.contenu_texte;
    });

    return differences;
  }
};
