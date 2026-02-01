import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BookOpen,
  FileEdit,
  CheckCircle,
  AlertTriangle,
  Plus,
  Search,
  Edit,
  Copy,
  Trash2,
  History,
  Users,
} from "lucide-react";
import { toast } from "sonner";

interface CourseStats {
  published: number;
  drafts: number;
  inReview: number;
  needUpdate: number;
}

interface Course {
  id: number;
  titre: string;
  slug: string;
  statut: string;
  date_modification: string;
  auteur_id: string; // UUID from auth.users
  matieres?: { nom: string };
  niveaux?: { nom: string };
}

export default function DashboardEditorial() {
  const [stats, setStats] = useState<CourseStats>({
    published: 0,
    drafts: 0,
    inReview: 0,
    needUpdate: 0,
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [searchQuery, statusFilter, courses]);

  const loadData = async () => {
    try {
      // Load statistics
      const { data: coursesData, error } = await supabase
        .from("cours")
        .select("statut");

      if (error) throw error;

      const stats: CourseStats = {
        published: coursesData?.filter((c) => c.statut === "publié").length || 0,
        drafts: coursesData?.filter((c) => c.statut === "brouillon").length || 0,
        inReview: coursesData?.filter((c) => c.statut === "en_revision").length || 0,
        needUpdate: coursesData?.filter((c) => c.statut === "archivé").length || 0,
      };

      setStats(stats);

      // Load recent courses
      const { data: recentCourses, error: coursesError } = await supabase
        .from("cours")
        .select(`
          id,
          titre,
          slug,
          statut,
          date_modification,
          auteur_id,
          matieres (nom),
          niveaux (nom)
        `)
        .order("date_modification", { ascending: false })
        .limit(20);

      if (coursesError) throw coursesError;

      setCourses(recentCourses || []);
      setFilteredCourses(recentCourses || []);
    } catch (error: any) {
      toast.error("Erreur lors du chargement des données");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filterCourses = () => {
    let filtered = courses;

    if (searchQuery) {
      filtered = filtered.filter((c) =>
        c.titre.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((c) => c.statut === statusFilter);
    }

    setFilteredCourses(filtered);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      brouillon: { variant: "secondary", label: "Brouillon" },
      en_revision: { variant: "default", label: "En révision" },
      publié: { variant: "default", label: "Publié" },
      archivé: { variant: "outline", label: "Archivé" },
    };

    const config = variants[status] || variants.brouillon;
    return (
      <Badge variant={config.variant} className={
        status === "brouillon" ? "bg-muted text-muted-foreground" :
        status === "en_revision" ? "bg-orange-100 text-orange-800" :
        status === "publié" ? "bg-green-100 text-green-800" :
        "bg-gray-100 text-gray-600"
      }>
        {config.label}
      </Badge>
    );
  };

  const copyCourse = async (course: Course) => {
    try {
      // Récupérer le cours complet avec ses sections
      const { data: fullCourse, error: fetchError } = await supabase
        .from("cours")
        .select("*")
        .eq("id", course.id)
        .single();

      if (fetchError) throw fetchError;

      // Créer une copie du cours
      const { data: newCourse, error: insertError } = await supabase
        .from("cours")
        .insert({
          ...fullCourse,
          id: undefined,
          titre: `${fullCourse.titre} (copie)`,
          slug: `${fullCourse.slug}-copie-${Date.now()}`,
          statut: "brouillon",
          date_creation: new Date().toISOString(),
          date_modification: new Date().toISOString(),
          date_publication: null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success("Cours dupliqué avec succès");
      loadData();
    } catch (error: any) {
      toast.error("Erreur lors de la duplication");
      console.error(error);
    }
  };

  const deleteCourse = async (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce cours ?")) return;

    try {
      // Supprimer d'abord les médias des sections
      const { data: sectionsData } = await supabase
        .from("sections")
        .select("id")
        .eq("cours_id", id);

      if (sectionsData) {
        for (const section of sectionsData) {
          // Supprimer les formules
          await supabase
            .from("formules")
            .delete()
            .eq("section_id", section.id);
          
          // Supprimer les médias
          await supabase
            .from("medias")
            .delete()
            .eq("section_id", section.id);
        }

        // Supprimer les sections
        await supabase
          .from("sections")
          .delete()
          .eq("cours_id", id);
      }

      // Supprimer le cours
      const { error } = await supabase.from("cours").delete().eq("id", id);

      if (error) throw error;

      // Mettre à jour l'état local immédiatement
      setCourses(courses.filter(c => c.id !== id));
      setFilteredCourses(filteredCourses.filter(c => c.id !== id));
      
      toast.success("Cours supprimé avec succès");
      loadData();
    } catch (error: any) {
      console.error("Error deleting course:", error);
      toast.error("Erreur lors de la suppression");
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
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord éditorial</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos cours et contenus pédagogiques
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/editorial/equipe">
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Gestion équipe
            </Button>
          </Link>
          <Link to="/editorial/cours/nouveau">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau cours
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Publiés</p>
              <p className="text-3xl font-bold mt-2">{stats.published}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Brouillons</p>
              <p className="text-3xl font-bold mt-2">{stats.drafts}</p>
              <p className="text-xs text-muted-foreground mt-1">À finaliser</p>
            </div>
            <FileEdit className="h-8 w-8 text-gray-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">En révision</p>
              <p className="text-3xl font-bold mt-2">{stats.inReview}</p>
              <p className="text-xs text-muted-foreground mt-1">En attente</p>
            </div>
            <BookOpen className="h-8 w-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">À modifier</p>
              <p className="text-3xl font-bold mt-2">{stats.needUpdate}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Non conforme
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un cours..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="brouillon">Brouillon</SelectItem>
              <SelectItem value="en_revision">En révision</SelectItem>
              <SelectItem value="publié">Publié</SelectItem>
              <SelectItem value="archivé">Archivé</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Courses Table */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Derniers cours modifiés</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Titre</th>
                  <th className="text-left p-3">Matière / Niveau</th>
                  <th className="text-left p-3">Statut</th>
                  <th className="text-left p-3">Dernière modification</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">
                      Aucun cours trouvé
                    </td>
                  </tr>
                ) : (
                  filteredCourses.map((course) => (
                    <tr key={course.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">{course.titre}</td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {course.matieres?.nom} / {course.niveaux?.nom}
                      </td>
                      <td className="p-3">{getStatusBadge(course.statut)}</td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {new Date(course.date_modification).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="p-3">
                        <TooltipProvider>
                          <div className="flex items-center justify-end gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link to={`/editorial/cours/${course.id}`}>
                                  <Button variant="ghost" size="sm">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Modifier le cours</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => copyCourse(course)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Dupliquer le cours</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link to={`/editorial/historique/${course.id}`}>
                                  <Button variant="ghost" size="sm">
                                    <History className="h-4 w-4" />
                                  </Button>
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Historique des versions</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteCourse(course.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Supprimer le cours</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TooltipProvider>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}
