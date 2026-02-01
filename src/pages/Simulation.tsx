import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { QuizQuestion } from "@/components/exam/QuizQuestion";
import { ExamTimer } from "@/components/exam/ExamTimer";
import { ResultsSummary } from "@/components/exam/ResultsSummary";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Simulation = () => {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<{ correct: boolean; time: number }[]>([]);
  const [startTime] = useState(Date.now());
  const [showResults, setShowResults] = useState(false);
  const [examDuration] = useState(1800); // 30 minutes

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

      // Utiliser la vue publique qui n'inclut pas les réponses correctes
      const { data, error } = await supabase
        .from("quiz_questions_public")
        .select("*")
        .eq("subject_id", subjectId)
        .eq("school_level", profile?.school_level)
        .limit(20);

      if (error) throw error;

      // Shuffle questions and parse options
      const shuffled = (data || [])
        .sort(() => Math.random() - 0.5)
        .map(q => ({
          ...q,
          options: Array.isArray(q.options) ? q.options : []
        }));
      
      setQuestions(shuffled);
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger l'examen",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (isCorrect: boolean) => {
    const newAnswers = [...answers, { correct: isCorrect, time: Date.now() - startTime }];
    setAnswers(newAnswers);

    if (currentIndex < questions.length - 1) {
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
      }, 2000);
    } else {
      setTimeout(() => {
        finishExam(newAnswers);
      }, 2000);
    }
  };

  const finishExam = async (finalAnswers: { correct: boolean; time: number }[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const score = finalAnswers.filter(a => a.correct).length;
    const duration = Math.floor((Date.now() - startTime) / 1000);

    await supabase.from("exam_attempts").insert({
      user_id: user.id,
      subject_id: subjectId!,
      score,
      total_questions: questions.length,
      duration_seconds: duration,
      answers: finalAnswers,
    });

    setShowResults(true);
  };

  const handleTimeUp = () => {
    finishExam(answers);
    toast({
      title: "Temps écoulé !",
      description: "Votre examen a été soumis automatiquement.",
    });
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setAnswers([]);
    setShowResults(false);
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

  if (showResults) {
    const score = answers.filter(a => a.correct).length;
    const duration = Math.floor((Date.now() - startTime) / 1000);

    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
        <div className="container mx-auto px-4 py-8">
          <ResultsSummary
            score={score}
            totalQuestions={questions.length}
            duration={duration}
            onRetry={handleRetry}
            onReturn={() => navigate("/liste-cours")}
          />
        </div>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / questions.length) * 100;
  const currentQuestion = questions[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => {
              if (confirm("Êtes-vous sûr de vouloir quitter l'examen ?")) {
                navigate("/liste-cours");
              }
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quitter
          </Button>

          <ExamTimer
            duration={examDuration}
            onTimeUp={handleTimeUp}
          />
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Question {currentIndex + 1} sur {questions.length}
              </span>
              <span className="text-sm font-medium">
                {answers.filter(a => a.correct).length} correctes
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <QuizQuestion
            questionId={currentQuestion.id}
            question={currentQuestion.question}
            options={currentQuestion.options}
            explanation={currentQuestion.explanation}
            onAnswer={handleAnswer}
            showResult={true}
          />
        </div>
      </div>
    </div>
  );
};

export default Simulation;