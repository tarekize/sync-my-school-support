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
import { ArrowLeft, GraduationCap, LogOut, User as UserIcon, MessageCircle, X, BookOpen, Play, PenTool, Brain, Download, Check } from "lucide-react";
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

  const subject = subjectId ? staticSubjects[subjectId] || { id: subjectId, name: subjectId, icon: "📖" } : null;

  useEffect(() => {
    if (subjectId) {
      fetchCourse();
    }
  }, [subjectId]);

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
                {activeChapter.lessons && activeChapter.lessons.length > 0 && (
                  <div className="mt-6 space-y-2">
                    <h3 className="text-lg font-semibold mb-4">الدروس - Leçons</h3>
                    {activeChapter.lessons.map((lesson, idx) => (
                      <div
                        key={lesson.id}
                        className="w-full text-right p-4 border rounded-lg hover:bg-accent/10 transition-colors cursor-pointer flex items-center gap-3"
                      >
                        <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-base">{lesson.titleAr}</p>
                          <p className="text-sm text-muted-foreground">{lesson.title}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
    </div>
  );
};

export default Cours;