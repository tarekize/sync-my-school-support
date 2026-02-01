import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { courseService } from "@/services/courseService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Save,
  Eye,
  Send,
  Plus,
  Copy,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import {  
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SectionEditor } from "@/components/editorial/SectionEditor";
import SortableSectionEditor from "@/components/editorial/SortableSectionEditor";
import { MetadataPanel } from "@/components/editorial/MetadataPanel";
import { ReviewModal } from "@/components/editorial/ReviewModal";
import { PreviewSidebar } from "@/components/editorial/PreviewSidebar";
import { CourseWithConflictDetection } from "@/components/course/CourseWithConflictDetection";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { Undo2, Redo2 } from "lucide-react";

interface Section {
  id?: number;
  titre: string;
  type: string;
  ordre: number;
  contenu_texte: string;
  formules?: any[];
  medias?: any[];
}

interface CourseData {
  id?: number;
  titre: string;
  slug: string;
  matiere_id: number | null;
  niveau_id: number | null;
  description: string;
  duree_lecture: number;
  difficulte: number;
  statut: string;
  meta_title: string;
  meta_description: string;
  programme_id?: number | null;
  version?: number;
  sections: Section[];
}

export default function EditeurCours() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<CourseData>({
    titre: "",
    slug: "",
    matiere_id: null,
    niveau_id: null,
    description: "",
    duree_lecture: 10,
    difficulte: 3,
    statut: "brouillon",
    meta_title: "",
    meta_description: "",
    sections: [],
  });
  const [matieres, setMatieres] = useState<any[]>([]);
  const [niveaux, setNiveaux] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const saveTimerRef = useRef<NodeJS.Timeout>();

  // Undo/Redo functionality
  const {
    state: historyCourse,
    set: setHistoryCourse,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useUndoRedo<CourseData>(course);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadInitialData();
  }, [id]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveCourse(true, false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [course]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (course.id) {
      saveTimerRef.current = setInterval(() => {
        saveCourse(false, true);
      }, 30000);

      return () => {
        if (saveTimerRef.current) {
          clearInterval(saveTimerRef.current);
        }
      };
    }
  }, [course]);

  // Generate slug from title
  useEffect(() => {
    if (course.titre && !id) {
      const slug = course.titre
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setCourse((prev) => ({ ...prev, slug }));
    }
  }, [course.titre]);

  const loadInitialData = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setCurrentUser(profile);
      }

      // Load matieres and niveaux
      const [matieresRes, niveauxRes] = await Promise.all([
        supabase.from("matieres").select("*").eq("active", true).order("ordre"),
        supabase.from("niveaux").select("*").order("ordre"),
      ]);

      if (matieresRes.data) setMatieres(matieresRes.data);
      if (niveauxRes.data) setNiveaux(niveauxRes.data);

      // Load course if editing
      if (id && id !== "nouveau") {
        const { data: courseData, error } = await supabase
          .from("cours")
          .select(`
            *,
            sections (
              id,
              titre,
              type,
              ordre,
              contenu_texte,
              formules (*),
              medias (*)
            )
          `)
          .eq("id", parseInt(id))
          .single();

        if (error) throw error;

        if (courseData) {
          setCourse({
            ...courseData,
            sections: courseData.sections || [],
          });
        }
      }
    } catch (error: any) {
      toast.error("Erreur lors du chargement");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const saveCourse = async (showToast = true, isAutoSave = false) => {
    if (saving) return;
    
    setSaving(true);
    try {
      // Get current user for version history
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      const courseData = {
        titre: course.titre,
        slug: course.slug,
        matiere_id: course.matiere_id,
        niveau_id: course.niveau_id,
        description: course.description,
        duree_lecture: course.duree_lecture,
        difficulte: course.difficulte,
        statut: course.statut,
        meta_title: course.meta_title,
        meta_description: course.meta_description,
        programme_id: course.programme_id,
        date_modification: new Date().toISOString(),
      };

      let courseId = course.id;
      let currentVersion = course.version || 1;

      if (courseId) {
        // Update existing course and increment version
        currentVersion = currentVersion + 1;
        const { error } = await supabase
          .from("cours")
          .update({ ...courseData, version: currentVersion })
          .eq("id", courseId);

        if (error) throw error;
      } else {
        // Create new course
        const { data, error } = await supabase
          .from("cours")
          .insert([{ ...courseData, version: 1 }])
          .select()
          .single();

        if (error) throw error;
        courseId = data.id;
        currentVersion = 1;
        setCourse((prev) => ({ ...prev, id: courseId, version: currentVersion }));
        navigate(`/editorial/cours/${courseId}`, { replace: true });
      }

      // Save sections
      if (courseId) {
        // Delete removed sections
        const sectionIds = course.sections
          .filter((s) => s.id)
          .map((s) => s.id);
        
        if (sectionIds.length > 0) {
          await supabase
            .from("sections")
            .delete()
            .eq("cours_id", courseId)
            .not("id", "in", `(${sectionIds.join(",")})`);
        }

        // Upsert sections
        for (let i = 0; i < course.sections.length; i++) {
          const section = course.sections[i];
          
          // Debug: Log section data before saving
          console.log(`Section ${i} (${section.titre}):`, {
            id: section.id,
            formules: section.formules?.length || 0,
            medias: section.medias?.length || 0,
            mediasData: section.medias
          });
          
          const sectionData = {
            cours_id: courseId,
            titre: section.titre,
            type: section.type,
            ordre: section.ordre,
            contenu_texte: section.contenu_texte,
          };

          let sectionId = section.id;

          // Check if it's a real database ID (not undefined or temporary)
          if (section.id && typeof section.id === 'number') {
            const { error } = await supabase
              .from("sections")
              .update(sectionData)
              .eq("id", section.id);

            if (error) {
              console.error('Error updating section:', error);
              throw error;
            }
          } else {
            const { data, error } = await supabase
              .from("sections")
              .insert([sectionData])
              .select()
              .single();

            if (error) {
              console.error('Error inserting section:', error);
              throw error;
            }
            
            // Update the section with the new ID
            sectionId = data.id;
            course.sections[i].id = data.id;
          }

          // Save formulas for this section
          if (section.formules && section.formules.length > 0) {
            // Delete old formulas first
            await supabase
              .from("formules")
              .delete()
              .eq("section_id", sectionId);

            // Insert new formulas
            for (const formule of section.formules) {
              if (formule.latex_source) {
                await supabase
                  .from("formules")
                  .insert([{
                    section_id: sectionId,
                    latex_source: formule.latex_source,
                    display_mode: formule.display_mode || false,
                    legende: formule.legende || null,
                    position: formule.position || 0
                  }]);
              }
            }
          }

          // Save medias for this section
          if (section.medias && section.medias.length > 0) {
            // Delete old medias first
            await supabase
              .from("medias")
              .delete()
              .eq("section_id", sectionId);

            // Insert new medias
            for (const media of section.medias) {
              if (media.url) {
                // Extract actual URL value if it's an object
                const actualUrl = typeof media.url === 'object' && media.url.value 
                  ? media.url.value 
                  : media.url;
                
                console.log('Saving media with URL:', actualUrl.substring(0, 100));
                
                const { error: mediaError } = await supabase
                  .from("medias")
                  .insert([{
                    section_id: sectionId,
                    type: media.type || "image",
                    url: actualUrl,
                    nom_fichier: media.nom_fichier || "image",
                    alt_text: media.alt_text || "",
                    legende: media.legende || null,
                    position: media.position || 0,
                    uploader_id: userId,
                    date_upload: new Date().toISOString()
                  }]);
                
                if (mediaError) {
                  console.error('Error saving media:', mediaError);
                  throw mediaError;
                }
              }
            }
          }
        }

        // Create version history entry (only for manual saves, not auto-saves)
        if (!isAutoSave && userId) {
          const contentSnapshot = {
            ...courseData,
            sections: course.sections.map(s => ({
              titre: s.titre,
              type: s.type,
              ordre: s.ordre,
              contenu_texte: s.contenu_texte,
            }))
          };

          await supabase
            .from("historique_versions")
            .insert({
              cours_id: courseId,
              version_numero: currentVersion,
              auteur_id: userId, // UUID from auth.uid()
              commentaire: "Sauvegarde manuelle",
              contenu_snapshot: contentSnapshot,
              date_version: new Date().toISOString(),
            });
        }
      }

      setLastSaved(new Date());
      if (showToast && !isAutoSave) {
        toast.success("Cours sauvegardé (Version " + currentVersion + ")");
      }
    } catch (error: any) {
      if (!isAutoSave) {
        toast.error("Erreur lors de la sauvegarde");
      }
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const duplicateCourse = async () => {
    if (!id) return;
    
    try {
      const newCourse = await courseService.duplicate(parseInt(id));
      toast.success("Cours dupliqué avec succès");
      navigate(`/editorial/cours/${newCourse.id}`);
    } catch (error) {
      console.error('Error duplicating course:', error);
      toast.error("Erreur lors de la duplication");
    }
  };

  const publishCourse = async () => {
    if (!course.titre) {
      toast.error("Le titre est obligatoire");
      return;
    }

    if (course.sections.length === 0) {
      toast.error("Ajoutez au moins une section");
      return;
    }

    setCourse((prev) => ({ ...prev, statut: "publié" }));
    await saveCourse();
    toast.success("Cours publié avec succès");
  };

  const addSection = () => {
    const newSection: Section = {
      id: undefined, // No ID for new sections - will be assigned on save
      titre: "Nouvelle section",
      type: "definition",
      ordre: course.sections.length,
      contenu_texte: "",
      formules: [],
      medias: [],
    };

    setCourse((prev) => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }));
  };

  const updateSection = (index: number, updatedSection: Section) => {
    const newSections = [...course.sections];
    newSections[index] = updatedSection;
    setCourse((prev) => ({ ...prev, sections: newSections }));
  };

  const deleteSection = (index: number) => {
    if (!confirm("Supprimer cette section ?")) return;

    const newSections = course.sections.filter((_, i) => i !== index);
    setCourse((prev) => ({ ...prev, sections: newSections }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setCourse(prev => {
        // Use index for finding sections since new sections don't have IDs yet
        const oldIndex = prev.sections.findIndex((s, idx) => (s.id || `temp-${idx}`) === active.id);
        const newIndex = prev.sections.findIndex((s, idx) => (s.id || `temp-${idx}`) === over.id);
        
        const newSections = arrayMove(prev.sections, oldIndex, newIndex);
        
        // Update ordre for all sections
        const updatedSections = newSections.map((section, index) => ({
          ...section,
          ordre: index
        }));

        return { ...prev, sections: updatedSections };
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-24">
      {/* Header */}
      <div className="bg-background border-b sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/editorial">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
              </Link>
              <Input
                value={course.titre}
                onChange={(e) =>
                  setCourse((prev) => ({ ...prev, titre: e.target.value }))
                }
                placeholder="Titre du cours"
                className="text-2xl font-bold border-0 focus-visible:ring-0 h-auto p-0"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  undo();
                  setCourse(historyCourse);
                }}
                disabled={!canUndo}
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  redo();
                  setCourse(historyCourse);
                }}
                disabled={!canRedo}
              >
                <Redo2 className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {saving ? "Enregistrement..." : lastSaved ? `Dernière sauvegarde: ${lastSaved.toLocaleTimeString('fr-FR')}` : "Enregistré"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4 flex-wrap">
            <Select
              value={course.matiere_id?.toString() || ""}
              onValueChange={(value) =>
                setCourse((prev) => ({ ...prev, matiere_id: parseInt(value) }))
              }
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Matière" />
              </SelectTrigger>
              <SelectContent>
                {matieres.map((m) => (
                  <SelectItem key={m.id} value={m.id.toString()}>
                    {m.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={course.niveau_id?.toString() || ""}
              onValueChange={(value) =>
                setCourse((prev) => ({ ...prev, niveau_id: parseInt(value) }))
              }
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Niveau" />
              </SelectTrigger>
              <SelectContent>
                {niveaux.map((n) => (
                  <SelectItem key={n.id} value={n.id.toString()}>
                    {n.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Label>Difficulté:</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    onClick={() =>
                      setCourse((prev) => ({ ...prev, difficulte: level }))
                    }
                    className={`text-xl ${
                      level <= course.difficulte
                        ? "text-yellow-400"
                        : "text-gray-300"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Label>Durée:</Label>
              <Input
                type="number"
                value={course.duree_lecture}
                onChange={(e) =>
                  setCourse((prev) => ({
                    ...prev,
                    duree_lecture: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">min</span>
            </div>

            <Select
              value={course.statut}
              onValueChange={(value) =>
                setCourse((prev) => ({ ...prev, statut: value }))
              }
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="brouillon">Brouillon</SelectItem>
                <SelectItem value="en_revision">En révision</SelectItem>
                <SelectItem value="publié">Publié</SelectItem>
                <SelectItem value="archivé">Archivé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {currentUser && course.id && (
          <CourseWithConflictDetection
            courseId={course.id}
            currentUserId={currentUser.id}
            currentUserName={`${currentUser.prenom || ''} ${currentUser.nom || ''}`.trim() || currentUser.email}
          >
            <div />
          </CourseWithConflictDetection>
        )}
        <div className="flex gap-0">
          <div className={`${showPreview ? 'flex-1' : 'w-full'} space-y-6 pr-6`}>
            <div className="flex items-center justify-between">
              <MetadataPanel course={course} onChange={setCourse} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="ml-4"
              >
                {showPreview ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Masquer aperçu
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Afficher aperçu
                  </>
                )}
              </Button>
            </div>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Contenu du cours</h2>
                <Button onClick={addSection}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter une section
                </Button>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={course.sections.map((s, idx) => s.id || `temp-${idx}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4">
                    {course.sections.map((section, index) => (
                      <SortableSectionEditor
                        key={section.id || `temp-${index}`}
                        section={{ ...section, id: section.id || `temp-${index}` }}
                        onChange={(updated) => updateSection(index, { ...updated, id: section.id })}
                        onDelete={() => deleteSection(index)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {course.sections.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  Aucune section. Cliquez sur "Ajouter une section" pour commencer.
                </div>
              )}
            </Card>
          </div>

          {/* Preview Sidebar */}
          {showPreview && (
            <PreviewSidebar 
              course={course}
              matieres={matieres}
              niveaux={niveaux}
            />
          )}
        </div>
      </div>

      {/* Fixed bottom toolbar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-10">
        <div className="container mx-auto flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {saving ? "Sauvegarde en cours..." : lastSaved ? `Dernière sauvegarde: ${lastSaved.toLocaleTimeString('fr-FR')}` : ""}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={duplicateCourse} disabled={!id || saving}>
              <Copy className="w-4 h-4 mr-2" />
              Dupliquer
            </Button>
            <Button variant="outline" onClick={() => saveCourse(true, false)} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              Sauvegarder
            </Button>
            <Button variant="outline" onClick={() => navigate(`/editorial/cours/${id}/preview`)} disabled={!id}>
              <Eye className="w-4 h-4 mr-2" />
              Prévisualiser
            </Button>
            {course.statut === 'brouillon' && (
              <Button variant="outline" onClick={() => setShowReviewDialog(true)} disabled={!id}>
                <Send className="w-4 h-4 mr-2" />
                Envoyer en révision
              </Button>
            )}
            <Button onClick={() => publishCourse()} disabled={saving}>
              <Send className="w-4 h-4 mr-2" />
              Publier
            </Button>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      <ReviewModal 
        open={showReviewDialog} 
        onClose={() => setShowReviewDialog(false)}
        courseId={id!}
        onSuccess={() => {
          setCourse(prev => ({ ...prev, statut: 'en_revision' }));
          loadInitialData();
        }}
      />
    </div>
  );
}
