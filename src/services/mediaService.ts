import { supabase } from '@/integrations/supabase/client';

export const mediaService = {
  // Upload fichier vers Supabase Storage
  async upload(file: File, bucket = 'medias') {
    // Générer nom unique
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

    // Upload
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Récupérer URL publique
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return {
      path: data.path,
      url: publicUrl,
      fileName: file.name
    };
  },

  // Ajouter média à une section
  async addToSection(sectionId: number, mediaData: any) {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('medias')
      .insert([{
        section_id: sectionId,
        uploader_id: user?.id,
        date_upload: new Date().toISOString(),
        ...mediaData
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Supprimer média
  async delete(mediaId: number) {
    // Récupérer info média
    const { data: media } = await supabase
      .from('medias')
      .select('*')
      .eq('id', mediaId)
      .single();

    if (!media) return;

    // Supprimer de Storage si URL Supabase
    if (media.url.includes('supabase')) {
      const path = media.url.split('/').pop();
      await supabase.storage
        .from('medias')
        .remove([path || '']);
    }

    // Supprimer de DB
    const { error } = await supabase
      .from('medias')
      .delete()
      .eq('id', mediaId);

    if (error) throw error;
  },

  // Optimiser image (compression)
  async optimizeImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;

        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Redimensionner si trop grand
          let width = img.width;
          let height = img.height;
          const maxSize = 1920;

          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = (height / width) * maxSize;
              width = maxSize;
            } else {
              width = (width / height) * maxSize;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) {
              resolve(new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              }));
            } else {
              reject(new Error('Failed to create blob'));
            }
          }, 'image/jpeg', 0.85);
        };

        img.onerror = reject;
      };

      reader.onerror = reject;
    });
  },

  // Liste tous les médias d'un cours
  async listByCourse(coursId: number) {
    const { data, error } = await supabase
      .from('medias')
      .select(`
        *,
        section:sections!inner(cours_id)
      `)
      .eq('section.cours_id', coursId);

    if (error) throw error;
    return data;
  }
};
