import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Eye, RotateCcw, GitCompare, Clock } from "lucide-react";
import { toast } from "sonner";

interface Version {
  id: number;
  version_numero: number;
  commentaire: string;
  date_version: string;
  auteur_id: string; // UUID from auth.users
  contenu_snapshot?: any;
}

export default function HistoriqueVersions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [versions, setVersions] = useState<Version[]>([]);
  const [courseTitle, setCourseTitle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVersions();
  }, [id]);

  const loadVersions = async () => {
    if (!id) return;

    try {
      // Load course info
      const { data: courseData, error: courseError } = await supabase
        .from("cours")
        .select("titre")
        .eq("id", parseInt(id))
        .single();

      if (courseError) throw courseError;
      if (courseData) setCourseTitle(courseData.titre);

      // Load versions
      const { data: versionsData, error: versionsError } = await supabase
        .from("historique_versions")
        .select("*")
        .eq("cours_id", parseInt(id))
        .order("version_numero", { ascending: false });

      if (versionsError) throw versionsError;
      setVersions(versionsData || []);
    } catch (error: any) {
      toast.error("Erreur lors du chargement de l'historique");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const restoreVersion = async (versionId: number) => {
    if (!confirm("Restaurer cette version ? Cela écrasera la version actuelle.")) {
      return;
    }

    try {
      const version = versions.find((v) => v.id === versionId);
      if (!version || !version.contenu_snapshot) {
        toast.error("Impossible de restaurer cette version");
        return;
      }

      // Here you would restore the version by updating the course
      // This would involve updating cours table with the snapshot data
      toast.info("Fonctionnalité de restauration à implémenter");
      
      // TODO: Implement version restoration
      // 1. Parse contenu_snapshot
      // 2. Update cours table
      // 3. Update sections
      // 4. Create new version entry
      
    } catch (error: any) {
      toast.error("Erreur lors de la restauration");
      console.error(error);
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
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <Link to={`/editorial/cours/${id}`}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'éditeur
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Historique des versions</h1>
        <p className="text-muted-foreground mt-1">{courseTitle}</p>
      </div>

      {/* Timeline */}
      <div className="max-w-4xl mx-auto">
        {versions.length === 0 ? (
          <Card className="p-12 text-center">
            <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg text-muted-foreground">
              Aucune version enregistrée
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {versions.map((version, index) => (
              <div key={version.id} className="relative">
                {/* Timeline line */}
                {index < versions.length - 1 && (
                  <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-border" />
                )}

                <Card className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Timeline dot */}
                    <div className="flex-shrink-0">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          index === 0
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <span className="font-bold">v{version.version_numero}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">
                              Version {version.version_numero}
                            </h3>
                            {index === 0 && (
                              <Badge variant="default">Actuelle</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(version.date_version).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Voir
                          </Button>
                          {index > 0 && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => restoreVersion(version.id)}
                              >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Restaurer
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => navigate(`/editorial/cours/${id}/compare?v1=${versions[index].version_numero}&v2=${versions[index - 1].version_numero}`)}
                              >
                                <GitCompare className="h-4 w-4 mr-2" />
                                Comparer
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {version.commentaire && (
                        <div className="mt-3 p-3 bg-muted rounded-lg">
                          <p className="text-sm italic">"{version.commentaire}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
