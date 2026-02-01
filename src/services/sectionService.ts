import { supabase } from '@/integrations/supabase/client';

export const sectionService = {
  // Créer une section
  async create(coursId: number, sectionData: any) {
    const sectionToInsert = {
      cours_id: coursId,
      titre: sectionData.titre,
      type: sectionData.type,
      contenu_texte: sectionData.contenu_texte,
      ordre: sectionData.ordre,
      parent_section_id: sectionData.parent_section_id
    };

    const { data, error } = await supabase
      .from('sections')
      .insert([sectionToInsert])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Mettre à jour une section
  async update(id: number, updates: any) {
    const { data, error } = await supabase
      .from('sections')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Supprimer une section
  async delete(id: number) {
    const { error } = await supabase
      .from('sections')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Réorganiser sections (drag & drop)
  async reorder(coursId: number, sectionIds: number[]) {
    const updates = sectionIds.map((id, index) => ({
      id: id,
      ordre: index + 1
    }));

    for (const update of updates) {
      await this.update(update.id, { ordre: update.ordre });
    }
  },

  // Ajouter formule à une section
  async addFormula(sectionId: number, formulaData: any) {
    const { data, error } = await supabase
      .from('formules')
      .insert([{
        section_id: sectionId,
        ...formulaData
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Supprimer formule
  async deleteFormula(formulaId: number) {
    const { error } = await supabase
      .from('formules')
      .delete()
      .eq('id', formulaId);

    if (error) throw error;
  }
};
