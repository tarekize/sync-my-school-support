import { supabase } from '@/integrations/supabase/client';
import { courseService } from './courseService';
import { sectionService } from './sectionService';

export const exportService = {
  // Exporter cours en JSON
  async exportJSON(coursId: number) {
    const cours = await courseService.getById(coursId);

    const json = JSON.stringify(cours, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `cours_${cours.slug}_${new Date().toISOString()}.json`;
    link.click();

    URL.revokeObjectURL(url);
  },

  // Importer cours depuis JSON
  async importJSON(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const courseData = JSON.parse(e.target?.result as string);

          // Créer nouveau cours
          const newCourse = await courseService.create({
            ...courseData,
            slug: `${courseData.slug}-import-${Date.now()}`
          });

          // Importer sections
          if (courseData.sections) {
            for (const section of courseData.sections) {
              await sectionService.create(newCourse.id, section);
            }
          }

          resolve(newCourse);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = reject;
      reader.readAsText(file);
    });
  },

  // Exporter cours en PDF
  async exportPDF(coursId: number) {
    // Utiliser jsPDF ou une API backend
    console.log('Export PDF', coursId);
    // À implémenter selon vos besoins
  }
};
