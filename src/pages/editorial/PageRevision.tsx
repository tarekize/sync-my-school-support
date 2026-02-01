import { useEffect, useState } from "react";
import { reviewService } from "@/services/reviewService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, Eye, Calendar, User } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

export default function PageRevision() {
  const [coursesInReview, setCoursesInReview] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [reviewComments, setReviewComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadCoursesInReview();
  }, []);

  const loadCoursesInReview = async () => {
    try {
      setLoading(true);
      const data = await reviewService.listPending();
      setCoursesInReview(data || []);
    } catch (error: any) {
      toast.error("Erreur lors du chargement des cours en révision");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCourse = async (course: any) => {
    try {
      const fullCourse = await reviewService.getCourseForReview(course.id);
      setSelectedCourse(fullCourse);
      setReviewComments(fullCourse.commentaire_revue || "");
    } catch (error) {
      console.error('Error loading course details:', error);
      toast.error("Erreur lors du chargement du cours");
    }
  };

  const approveCourse = async () => {
    if (!selectedCourse) return;

    setSubmitting(true);
    try {
      await reviewService.approve(selectedCourse.id, reviewComments);
      toast.success("Cours approuvé et publié avec succès");
      setSelectedCourse(null);
      setReviewComments("");
      await loadCoursesInReview();
    } catch (error: any) {
      toast.error("Erreur lors de l'approbation");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const requestChanges = async () => {
    if (!selectedCourse) return;
    if (!reviewComments.trim()) {
      toast.error("Veuillez ajouter des commentaires pour les modifications demandées");
      return;
    }

    setSubmitting(true);
    try {
      await reviewService.requestChanges(selectedCourse.id, reviewComments);
      toast.info("Modifications demandées à l'auteur");
      setSelectedCourse(null);
      setReviewComments("");
      await loadCoursesInReview();
    } catch (error: any) {
      toast.error("Erreur lors de la demande de modifications");
      console.error(error);
    } finally {
      setSubmitting(false);
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Révision des cours</h1>
        <p className="text-muted-foreground mt-2">
          Examinez et approuvez les cours soumis par les éditeurs
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des cours en révision */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Cours en attente</CardTitle>
              <CardDescription>
                {coursesInReview.length} cours à réviser
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {coursesInReview.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Aucun cours en attente de révision
                    </p>
                  ) : (
                    coursesInReview.map((course) => (
                      <Card
                        key={course.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedCourse?.id === course.id ? "ring-2 ring-primary" : ""
                        }`}
                        onClick={() => handleSelectCourse(course)}
                      >
                        <CardHeader className="p-4">
                          <CardTitle className="text-base">{course.titre}</CardTitle>
                          <CardDescription className="text-xs space-y-1">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              Par {course.auteur?.full_name || course.auteur?.email}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(course.date_modification), "dd MMM yyyy", { locale: fr })}
                            </div>
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Détail du cours sélectionné */}
        <div className="lg:col-span-2">
          {!selectedCourse ? (
            <Card>
              <CardContent className="flex items-center justify-center py-16">
                <div className="text-center">
                  <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Sélectionnez un cours pour le réviser
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Informations du cours */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-2xl">{selectedCourse.titre}</CardTitle>
                      <CardDescription className="mt-2">
                        {selectedCourse.description}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="ml-4">
                      {selectedCourse.statut}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Matière</p>
                      <p className="text-sm">{selectedCourse.matiere?.nom}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Niveau</p>
                      <p className="text-sm">{selectedCourse.niveau?.nom}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Auteur</p>
                      <p className="text-sm">{selectedCourse.auteur?.full_name || selectedCourse.auteur?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Difficulté</p>
                      <p className="text-sm">{selectedCourse.difficulte}/5</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Preview du contenu */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Contenu du cours
                    </h3>
                    {selectedCourse.sections && selectedCourse.sections.length > 0 ? (
                      <ScrollArea className="h-[300px] border rounded-lg p-4">
                        <div className="space-y-4">
                          {selectedCourse.sections
                            .sort((a: any, b: any) => a.ordre - b.ordre)
                            .map((section: any) => (
                              <div
                                key={section.id}
                                className={`p-4 rounded-lg ${
                                  section.type === "definition"
                                    ? "border-l-4 border-blue-500 bg-blue-50/50"
                                    : section.type === "propriete"
                                    ? "border-l-4 border-green-500 bg-green-50/50"
                                    : section.type === "exemple"
                                    ? "border-l-4 border-yellow-500 bg-yellow-50/50"
                                    : section.type === "methode"
                                    ? "border-l-4 border-purple-500 bg-purple-50/50"
                                    : "border-l-4 border-gray-400 bg-gray-50/50"
                                }`}
                              >
                                <h4 className="font-semibold mb-2">{section.titre}</h4>
                                <Badge variant="outline" className="mb-2 capitalize">
                                  {section.type}
                                </Badge>
                                <div className="prose prose-sm max-w-none">
                                  <ReactMarkdown>{section.contenu_texte || ""}</ReactMarkdown>
                                </div>
                              </div>
                            ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <p className="text-sm text-muted-foreground">Aucune section disponible</p>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => navigate(`/cours/${selectedCourse.id}`)}
                    className="w-full"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Voir le cours complet
                  </Button>
                </CardContent>
              </Card>

              {/* Actions de révision */}
              <Card>
                <CardHeader>
                  <CardTitle>Commentaires et décision</CardTitle>
                  <CardDescription>
                    Ajoutez vos commentaires et approuvez ou demandez des modifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Commentaires
                    </label>
                    <Textarea
                      value={reviewComments}
                      onChange={(e) => setReviewComments(e.target.value)}
                      placeholder="Ajoutez vos commentaires sur le cours..."
                      rows={6}
                      className="resize-none"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={approveCourse}
                      disabled={submitting}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {submitting ? "Approbation..." : "Approuver et Publier"}
                    </Button>
                    <Button
                      onClick={requestChanges}
                      disabled={submitting || !reviewComments.trim()}
                      variant="outline"
                      className="flex-1 border-orange-500 text-orange-600 hover:bg-orange-50"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      {submitting ? "Envoi..." : "Demander Modifications"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
