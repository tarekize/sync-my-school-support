import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FlashCard } from "@/components/revision/FlashCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, RotateCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Revision = () => {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewed, setReviewed] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (subjectId) {
      fetchQuestions();
    }
  }, [subjectId]);

  const fetchQuestions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("school_level")
        .eq("id", user.id)
        .single();

      // Utiliser la vue publique qui n'inclut pas les réponses
      const { data, error } = await supabase
        .from("quiz_questions_public")
        .select("*")
        .eq("subject_id", subjectId)
        .eq("school_level", profile?.school_level);

      if (error) throw error;

      // Shuffle questions
      const shuffled = (data || []).sort(() => Math.random() - 0.5);
      setQuestions(shuffled);
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les questions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleDifficulty = (difficulty: string) => {
    setReviewed(prev => new Set([...prev, currentIndex]));
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setReviewed(new Set());
    fetchQuestions();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-4">Aucune question disponible</h2>
        <Button onClick={() => navigate("/liste-cours")}>
          Retour au catalogue
        </Button>
      </div>
    );
  }

  const progress = (reviewed.size / questions.length) * 100;
  const currentQuestion = questions[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/liste-cours")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>

          <Button
            variant="outline"
            onClick={handleReset}
          >
            <RotateCw className="h-4 w-4 mr-2" />
            Recommencer
          </Button>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Carte {currentIndex + 1} sur {questions.length}
              </span>
              <span className="text-sm font-medium">
                {reviewed.size} révisées
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* FlashCard désactivé temporairement car les réponses ne sont plus accessibles directement */}
          <div className="text-center p-6 bg-card rounded-lg border-2">
            <h3 className="text-xl font-bold mb-2">Mode révision temporairement indisponible</h3>
            <p className="text-muted-foreground">
              Cette fonctionnalité sera bientôt disponible avec un système sécurisé de flashcards.
            </p>
            <Button onClick={() => navigate("/liste-cours")} className="mt-4">
              Retour au catalogue
            </Button>
          </div>

          {/* <FlashCard
            question={currentQuestion.question}
            answer={currentQuestion.correct_answer}
            onNext={handleNext}
            onDifficulty={handleDifficulty}
          /> */}

          {currentIndex === questions.length - 1 && reviewed.size === questions.length && (
            <div className="text-center p-6 bg-card rounded-lg border-2">
              <h3 className="text-2xl font-bold mb-2">Bravo ! 🎉</h3>
              <p className="text-muted-foreground mb-4">
                Vous avez révisé toutes les cartes !
              </p>
              <Button onClick={handleReset}>
                Recommencer la session
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Revision;