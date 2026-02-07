import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { courseService, Chapter as DBChapter, Lesson as DBLesson } from "@/services/courseService";
import { ChapterMathQuiz } from "@/components/course/ChapterMathQuiz";
import { ChapterMathExercises } from "@/components/course/ChapterMathExercises";
import { getChapterContent, ChapterContent } from "@/data/mathSecondeChapters";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, GraduationCap, LogOut, User as UserIcon, MessageCircle, X, BookOpen, Play, PenTool, Brain, Download, Check, Plus, Edit, Trash2 } from "lucide-react";
import ChatBot from "@/components/ChatBot";
import { useToast } from "@/hooks/use-toast";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";

// Static subject data
const staticSubjects: Record<string, { id: string; name: string; icon: string }> = {
  "math": { id: "math", name: "Mathématiques", icon: "📐" },
};

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  school_level: string | null;
  filiere: string | null;
  email: string | null;
}

interface Lesson {
  id: string;
  title: string;
  titleAr: string;
}

interface Chapter {
  id: string;
  title: string;
  order_index: number;
  content: string;
  lessons?: Lesson[];
}

const Cours = () => {
  const { subjectId } = useParams();
  const [searchParams] = useSearchParams();
  const adminNiveau = searchParams.get("niveau");
  const adminFiliere = searchParams.get("filiere");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [schoolLevel, setSchoolLevel] = useState<string>("");
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<"grid" | "content">("grid");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string; }[]>([]);
  const [activeActivity, setActiveActivity] = useState<string | null>(null);

  // Pedago management states
  const [isPedago, setIsPedago] = useState(false);
  const [createChapterDialogOpen, setCreateChapterDialogOpen] = useState(false);
  const [editChapterDialogOpen, setEditChapterDialogOpen] = useState(false);
  const [deleteChapterDialogOpen, setDeleteChapterDialogOpen] = useState(false);
  const [createLessonDialogOpen, setCreateLessonDialogOpen] = useState(false);
  const [editLessonDialogOpen, setEditLessonDialogOpen] = useState(false);
  const [deleteLessonDialogOpen, setDeleteLessonDialogOpen] = useState(false);
  const [chapterToEdit, setChapterToEdit] = useState<Chapter | null>(null);
  const [lessonToEdit, setLessonToEdit] = useState<Lesson | null>(null);
  const [chapterToDelete, setChapterToDelete] = useState<Chapter | null>(null);
  const [lessonToDelete, setLessonToDelete] = useState<Lesson | null>(null);

  // Form states
  const [chapterForm, setChapterForm] = useState({
    title: "",
    titleAr: "",
    description: "",
  });
  const [lessonForm, setLessonForm] = useState({
    title: "",
    titleAr: "",
    content: "",
    videoUrl: "",
  });

  const subject = subjectId ? staticSubjects[subjectId] || { id: subjectId, name: subjectId, icon: "📖" } : null;

  useEffect(() => {
    if (subjectId) {
      fetchCourse();
    }
  }, [subjectId]);

  // Add realtime subscriptions for chapters and lessons updates (for all users)
  useEffect(() => {
    const channel = supabase
      .channel('chapters-lessons-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chapters' }, () => {
        fetchCourse();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lessons' }, () => {
        fetchCourse();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [adminNiveau, adminFiliere, subjectId]);

  const fetchCourse = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url, school_level, filiere, email")
        .eq("id", user.id)
        .single();

      setProfile(profileData as Profile | null);

      // Check if user is pedago
      const { data: pedagoData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "pedago")
        .maybeSingle();

      setIsPedago(!!pedagoData);

      // Use admin query params if present, otherwise use profile data
      const effectiveLevel = adminNiveau || profileData?.school_level || "";
      const effectiveFiliere = adminFiliere || (adminNiveau ? null : profileData?.filiere) || null;
      setSchoolLevel(effectiveLevel);

      // Fetch chapters from database
      if (subjectId && effectiveLevel) {
        const dbChapters = await courseService.getChaptersWithLessons(
          effectiveLevel as any,
          effectiveFiliere,
          subjectId
        );

        if (dbChapters.length > 0) {
          // Map database chapters to component format
          const mappedChapters: Chapter[] = dbChapters.map((ch) => ({
            id: ch.id,
            title: ch.title_ar ? `${ch.title} - ${ch.title_ar}` : ch.title,
            order_index: ch.order_index,
            content: `<h2>${ch.title_ar || ch.title}</h2>${ch.title_ar ? `<h3>${ch.title}</h3>` : ""}<p>${ch.description || `Ce chapitre contient ${ch.lessons.length} leçons.`}</p>`,
            lessons: ch.lessons.map((l) => ({
              id: l.id,
              title: l.title,
              titleAr: l.title_ar || l.title,
            })),
          }));

          setChapters(mappedChapters);
          if (mappedChapters.length > 0) {
            setActiveChapter(mappedChapters[0]);
            setActiveChapterIndex(0);
          }
        } else {
          // No chapters in database
          setChapters([]);
        }
      } else {
        setChapters([]);
      }

    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le cours",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!activeChapter) return;

    setProgress(prev => ({
      ...prev,
      [activeChapter.id]: !prev[activeChapter.id]
    }));

    toast({
      title: progress[activeChapter.id] ? "Marqué comme non complété" : "Chapitre complété !",
      description: progress[activeChapter.id] ? "" : "Continuez comme ça ! 🎉",
    });
  };

  const handleChapterChange = (direction: "prev" | "next") => {
    if (!chapters.length || !activeChapter) return;

    const currentIndex = chapters.findIndex((c) => c.id === activeChapter.id);
    if (direction === "prev" && currentIndex > 0) {
      setActiveChapter(chapters[currentIndex - 1]);
      setActiveChapterIndex(currentIndex - 1);
    } else if (direction === "next" && currentIndex < chapters.length - 1) {
      setActiveChapter(chapters[currentIndex + 1]);
      setActiveChapterIndex(currentIndex + 1);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const getFullName = (profile: Profile | null): string => {
    if (!profile) return "Utilisateur";
    const parts = [profile.first_name, profile.last_name].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : "Utilisateur";
  };

  const getSchoolLevelName = (level: string) => {
    const labels: Record<string, string> = {
      "6eme": "6ème",
      "5eme": "5ème",
      "4eme": "4ème",
      "3eme": "3ème",
      seconde: "Seconde",
      premiere: "Première",
      terminale: "Terminale",
    };
    return labels[level] || level;
  };

  const handleDownloadPDF = async () => {
    if (!activeChapter) return;

    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.text(activeChapter.title, 20, 20);

      doc.setFontSize(12);
      const content = activeChapter.content?.replace(/<[^>]*>/g, '') || 'Contenu non disponible';
      const lines = doc.splitTextToSize(content, 170);
      doc.text(lines.slice(0, 40), 20, 35);

      doc.save(`${activeChapter.title}.pdf`);

      toast({
        title: "PDF téléchargé",
        description: "Le chapitre a été téléchargé avec succès",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le PDF",
        variant: "destructive",
      });
    }
  };

  // Pedago CRUD handlers
  const handleCreateChapter = async () => {
    if (!schoolLevel || !subjectId) return;

    const chapter = await courseService.createChapter(
      schoolLevel as any,
      adminFiliere,
      subjectId,
      chapterForm.title,
      chapterForm.titleAr,
      chapterForm.description
    );

    if (chapter) {
      toast({
        title: "Chapitre créé",
        description: "Le chapitre a été créé avec succès",
      });
      setCreateChapterDialogOpen(false);
      setChapterForm({ title: "", titleAr: "", description: "" });
      fetchCourse();
    } else {
      toast({
        title: "Erreur",
        description: "Impossible de créer le chapitre",
        variant: "destructive",
      });
    }
  };

  const handleUpdateChapter = async () => {
    if (!chapterToEdit) return;

    const success = await courseService.updateChapter(chapterToEdit.id, {
      title: chapterForm.title,
      title_ar: chapterForm.titleAr,
      description: chapterForm.description,
    });

    if (success) {
      toast({
        title: "Chapitre modifié",
        description: "Le chapitre a été modifié avec succès",
      });
      setEditChapterDialogOpen(false);
      setChapterToEdit(null);
      setChapterForm({ title: "", titleAr: "", description: "" });
      fetchCourse();
    } else {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le chapitre",
        variant: "destructive",
      });
    }
  };

  const handleDeleteChapter = async () => {
    if (!chapterToDelete) return;

    const success = await courseService.deleteChapter(chapterToDelete.id);

    if (success) {
      toast({
        title: "Chapitre supprimé",
        description: "Le chapitre a été supprimé avec succès",
      });
      setDeleteChapterDialogOpen(false);
      setChapterToDelete(null);
      fetchCourse();
    } else {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le chapitre",
        variant: "destructive",
      });
    }
  };

  const handleCreateLesson = async () => {
    if (!activeChapter) return;

    const lesson = await courseService.createLesson(
      activeChapter.id,
      lessonForm.title,
      lessonForm.titleAr,
      lessonForm.content,
      lessonForm.videoUrl
    );

    if (lesson) {
      toast({
        title: "Leçon créée",
        description: "La leçon a été créée avec succès",
      });
      setCreateLessonDialogOpen(false);
      setLessonForm({ title: "", titleAr: "", content: "", videoUrl: "" });
      fetchCourse();
    } else {
      toast({
        title: "Erreur",
        description: "Impossible de créer la leçon",
        variant: "destructive",
      });
    }
  };

  const handleUpdateLesson = async () => {
    if (!lessonToEdit) return;

    const success = await courseService.updateLesson(lessonToEdit.id, {
      title: lessonForm.title,
      title_ar: lessonForm.titleAr,
      content: lessonForm.content,
      video_url: lessonForm.videoUrl,
    });

    if (success) {
      toast({
        title: "Leçon modifiée",
        description: "La leçon a été modifiée avec succès",
      });
      setEditLessonDialogOpen(false);
      setLessonToEdit(null);
      setLessonForm({ title: "", titleAr: "", content: "", videoUrl: "" });
      fetchCourse();
    } else {
      toast({
        title: "Erreur",
        description: "Impossible de modifier la leçon",
        variant: "destructive",
      });
    }
  };

  const handleDeleteLesson = async () => {
    if (!lessonToDelete) return;

    const success = await courseService.deleteLesson(lessonToDelete.id);

    if (success) {
      toast({
        title: "Leçon supprimée",
        description: "La leçon a été supprimée avec succès",
      });
      setDeleteLessonDialogOpen(false);
      setLessonToDelete(null);
      fetchCourse();
    } else {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la leçon",
        variant: "destructive",
      });
    }
  };

  const openEditChapterDialog = (chapter: Chapter) => {
    // Find the original chapter data from chapters array
    const originalChapter = chapters.find(c => c.id === chapter.id);
    if (!originalChapter) return;

    // Extract title and titleAr from the original data
    // Since chapters are mapped with title = title_ar ? `${title} - ${title_ar}` : title
    // We need to reverse this for editing
    const titleParts = originalChapter.title.split(' - ');
    const title = titleParts[0];
    const titleAr = titleParts.length > 1 ? titleParts[1] : '';

    setChapterToEdit(originalChapter);
    setChapterForm({
      title,
      titleAr,
      description: originalChapter.content.replace(/<[^>]*>/g, '').split('\n').filter(line => line.trim()).join('\n') || '',
    });
    setEditChapterDialogOpen(true);
  };

  const openEditLessonDialog = async (lesson: Lesson) => {
    // Fetch full lesson data
    const fullLesson = await courseService.getLessonById(lesson.id);
    if (!fullLesson) return;

    setLessonToEdit(lesson);
    setLessonForm({
      title: fullLesson.title,
      titleAr: fullLesson.title_ar || fullLesson.title,
      content: fullLesson.content || "",
      videoUrl: fullLesson.video_url || "",
    });
    setEditLessonDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (chapters.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-4">Cours non disponible</h2>
        <p className="text-muted-foreground mb-6">
          Aucun cours n'est disponible pour cette matière et ce niveau.
        </p>
        <Button onClick={() => navigate("/liste-cours")}>Retour à la liste des cours</Button>
      </div>
    );
  }

  const fullName = getFullName(profile);
  const chapterContent = getChapterContent(activeChapterIndex);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate("/liste-cours")}
            >
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold">AcadémiePlus</span>
            </div>

            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center gap-2 cursor-pointer hover:bg-accent/10 rounded-lg p-2 transition-colors">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback>
                        {fullName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left hidden md:block">
                      <p className="text-sm font-medium">{fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {schoolLevel && getSchoolLevelName(schoolLevel)}
                      </p>
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => navigate("/account")}>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Gérer mon compte</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Se déconnecter</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-24 pb-8">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate("/liste-cours")} className="cursor-pointer">
                <ArrowLeft className="h-4 w-4 mr-2 inline" />
                Liste des cours
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{subject?.name || "Cours"}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-2xl font-bold">{subject?.name || "Cours"}</h1>
            <span className="text-sm text-muted-foreground">
              {Object.values(progress).filter(Boolean).length}/{chapters.length} chapitres terminés
            </span>
          </div>
          <Progress
            value={(Object.values(progress).filter(Boolean).length / chapters.length) * 100}
            className="h-2"
          />
        </div>

        {/* Active activity view */}
        {activeActivity === "quiz" && activeChapter && chapterContent && (
          <ChapterMathQuiz
            questions={chapterContent.quizzes}
            chapterTitle={activeChapter.title}
            chapterId={activeChapter.id}
            onClose={() => setActiveActivity(null)}
          />
        )}

        {activeActivity === "exercises" && activeChapter && chapterContent && (
          <ChapterMathExercises
            exercises={chapterContent.exercises}
            chapterTitle={activeChapter.title}
            chapterId={activeChapter.id}
            onClose={() => setActiveActivity(null)}
          />
        )}

        {/* Grid view - Chapter selection */}
        {!activeActivity && viewMode === "grid" && (
          <div className="space-y-6">
            {/* Pedago management header */}
            {isPedago && (
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Gestion des chapitres</h2>
                <Dialog open={createChapterDialogOpen} onOpenChange={setCreateChapterDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nouveau chapitre
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Créer un nouveau chapitre</DialogTitle>
                      <DialogDescription>
                        Ajoutez un nouveau chapitre à ce cours.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="chapter-title">Titre (Français)</Label>
                        <Input
                          id="chapter-title"
                          value={chapterForm.title}
                          onChange={(e) => setChapterForm(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Titre du chapitre"
                        />
                      </div>
                      <div>
                        <Label htmlFor="chapter-title-ar">Titre (Arabe)</Label>
                        <Input
                          id="chapter-title-ar"
                          value={chapterForm.titleAr}
                          onChange={(e) => setChapterForm(prev => ({ ...prev, titleAr: e.target.value }))}
                          placeholder="العنوان بالعربية"
                          dir="rtl"
                        />
                      </div>
                      <div>
                        <Label htmlFor="chapter-description">Description</Label>
                        <Textarea
                          id="chapter-description"
                          value={chapterForm.description}
                          onChange={(e) => setChapterForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Description du chapitre"
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCreateChapterDialogOpen(false)}>
                        Annuler
                      </Button>
                      <Button onClick={handleCreateChapter}>
                        Créer
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {chapters.map((chapter, index) => (
                <Card
                  key={chapter.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${progress[chapter.id] ? 'border-green-500/50 bg-green-500/5' : ''
                    }`}
                  onClick={() => {
                    setActiveChapter(chapter);
                    setActiveChapterIndex(index);
                    setViewMode("content");
                  }}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                        {index + 1}
                      </span>
                      {chapter.title}
                      {progress[chapter.id] && (
                        <Check className="h-5 w-5 text-green-500 ml-auto" />
                      )}
                      {isPedago && (
                        <div className="ml-auto flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditChapterDialog(chapter);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setChapterToDelete(chapter);
                              setDeleteChapterDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {chapter.content?.replace(/<[^>]*>/g, '').substring(0, 100)}...
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Content view - Chapter details */}
        {!activeActivity && viewMode === "content" && activeChapter && (
          <div className="space-y-6">
            <div className="flex gap-2 mb-4">
              <Button variant="outline" onClick={() => setViewMode("grid")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux chapitres
              </Button>
            </div>

            {/* Chapter content */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-2xl">{activeChapter.title}</CardTitle>
                  <div className="flex gap-2">
                    {isPedago && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditChapterDialog(activeChapter)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier chapitre
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setChapterToDelete(activeChapter)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer chapitre
                        </Button>
                      </>
                    )}
                    <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                      <Download className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                    <Button
                      variant={progress[activeChapter.id] ? "secondary" : "default"}
                      size="sm"
                      onClick={handleMarkComplete}
                    >
                      {progress[activeChapter.id] ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Complété
                        </>
                      ) : (
                        "Marquer comme terminé"
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none mb-4">
                  <div dangerouslySetInnerHTML={{ __html: activeChapter.content || "<p>Contenu non disponible</p>" }} />
                </div>

                {/* Interactive lessons list */}
                <div className="mt-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">الدروس - Leçons</h3>
                    {isPedago && (
                      <Dialog open={createLessonDialogOpen} onOpenChange={setCreateLessonDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Nouvelle leçon
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Créer une nouvelle leçon</DialogTitle>
                            <DialogDescription>
                              Ajoutez une nouvelle leçon à ce chapitre.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="lesson-title">Titre (Français)</Label>
                              <Input
                                id="lesson-title"
                                value={lessonForm.title}
                                onChange={(e) => setLessonForm(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Titre de la leçon"
                              />
                            </div>
                            <div>
                              <Label htmlFor="lesson-title-ar">Titre (Arabe)</Label>
                              <Input
                                id="lesson-title-ar"
                                value={lessonForm.titleAr}
                                onChange={(e) => setLessonForm(prev => ({ ...prev, titleAr: e.target.value }))}
                                placeholder="العنوان بالعربية"
                                dir="rtl"
                              />
                            </div>
                            <div>
                              <Label htmlFor="lesson-content">Contenu</Label>
                              <Textarea
                                id="lesson-content"
                                value={lessonForm.content}
                                onChange={(e) => setLessonForm(prev => ({ ...prev, content: e.target.value }))}
                                placeholder="Contenu de la leçon"
                                rows={4}
                              />
                            </div>
                            <div>
                              <Label htmlFor="lesson-video">URL Vidéo (optionnel)</Label>
                              <Input
                                id="lesson-video"
                                value={lessonForm.videoUrl}
                                onChange={(e) => setLessonForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                                placeholder="https://..."
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setCreateLessonDialogOpen(false)}>
                              Annuler
                            </Button>
                            <Button onClick={handleCreateLesson}>
                              Créer
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>

                  {activeChapter.lessons && activeChapter.lessons.length > 0 ? (
                    activeChapter.lessons.map((lesson, idx) => (
                      <div
                        key={lesson.id}
                        className="w-full text-right p-4 border rounded-lg hover:bg-accent/10 transition-colors flex items-center gap-3"
                      >
                        <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-base">{lesson.titleAr}</p>
                          <p className="text-sm text-muted-foreground">{lesson.title}</p>
                        </div>
                        {isPedago && (
                          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditLessonDialog(lesson);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLessonToDelete(lesson);
                                setDeleteLessonDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      Aucune leçon disponible pour ce chapitre.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Activity cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card
                className="cursor-pointer hover:shadow-lg transition-all"
                onClick={() => setActiveActivity("quiz")}
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Brain className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Quiz</h3>
                    <p className="text-sm text-muted-foreground">Testez vos connaissances</p>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-lg transition-all"
                onClick={() => setActiveActivity("exercises")}
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <PenTool className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Exercices</h3>
                    <p className="text-sm text-muted-foreground">Pratiquez avec des exercices</p>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-lg transition-all"
                onClick={() => navigate(`/revision/${subjectId}`)}
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Révision</h3>
                    <p className="text-sm text-muted-foreground">Fiches de révision</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => handleChapterChange("prev")}
                disabled={chapters.findIndex(c => c.id === activeChapter.id) === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Chapitre précédent
              </Button>
              <Button
                onClick={() => handleChapterChange("next")}
                disabled={chapters.findIndex(c => c.id === activeChapter.id) === chapters.length - 1}
              >
                Chapitre suivant
                <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Floating Chat Button */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors z-50"
      >
        {isChatOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat Panel */}
      {isChatOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] z-50">
          <ChatBot
            messages={chatMessages}
            setMessages={setChatMessages}
          />
        </div>
      )}

      {/* Edit Chapter Dialog */}
      <Dialog open={editChapterDialogOpen} onOpenChange={setEditChapterDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le chapitre</DialogTitle>
            <DialogDescription>
              Modifiez les informations du chapitre.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-chapter-title">Titre (Français)</Label>
              <Input
                id="edit-chapter-title"
                value={chapterForm.title}
                onChange={(e) => setChapterForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Titre du chapitre"
              />
            </div>
            <div>
              <Label htmlFor="edit-chapter-title-ar">Titre (Arabe)</Label>
              <Input
                id="edit-chapter-title-ar"
                value={chapterForm.titleAr}
                onChange={(e) => setChapterForm(prev => ({ ...prev, titleAr: e.target.value }))}
                placeholder="العنوان بالعربية"
                dir="rtl"
              />
            </div>
            <div>
              <Label htmlFor="edit-chapter-description">Description</Label>
              <Textarea
                id="edit-chapter-description"
                value={chapterForm.description}
                onChange={(e) => setChapterForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description du chapitre"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditChapterDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateChapter}>
              Modifier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Chapter Dialog */}
      <AlertDialog open={deleteChapterDialogOpen} onOpenChange={setDeleteChapterDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le chapitre</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce chapitre ? Cette action est irréversible et supprimera également toutes les leçons associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setChapterToDelete(null)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteChapter} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Lesson Dialog */}
      <Dialog open={editLessonDialogOpen} onOpenChange={setEditLessonDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la leçon</DialogTitle>
            <DialogDescription>
              Modifiez les informations de la leçon.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-lesson-title">Titre (Français)</Label>
              <Input
                id="edit-lesson-title"
                value={lessonForm.title}
                onChange={(e) => setLessonForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Titre de la leçon"
              />
            </div>
            <div>
              <Label htmlFor="edit-lesson-title-ar">Titre (Arabe)</Label>
              <Input
                id="edit-lesson-title-ar"
                value={lessonForm.titleAr}
                onChange={(e) => setLessonForm(prev => ({ ...prev, titleAr: e.target.value }))}
                placeholder="العنوان بالعربية"
                dir="rtl"
              />
            </div>
            <div>
              <Label htmlFor="edit-lesson-content">Contenu</Label>
              <Textarea
                id="edit-lesson-content"
                value={lessonForm.content}
                onChange={(e) => setLessonForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Contenu de la leçon"
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="edit-lesson-video">URL Vidéo (optionnel)</Label>
              <Input
                id="edit-lesson-video"
                value={lessonForm.videoUrl}
                onChange={(e) => setLessonForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditLessonDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateLesson}>
              Modifier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Lesson Dialog */}
      <AlertDialog open={deleteLessonDialogOpen} onOpenChange={setDeleteLessonDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la leçon</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette leçon ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setLessonToDelete(null)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLesson} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Cours;
