import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, BookOpen, CheckCircle2, XCircle, PenTool, Send, Eye, Clock } from "lucide-react";
import { ChapterExercise } from "@/data/mathSecondeChapters";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { useTimeTracking, formatTime } from "@/hooks/useTimeTracking";

interface ChapterMathExercisesProps {
  exercises: ChapterExercise[];
  chapterTitle: string;
  chapterId: string;
  onClose: () => void;
}

export const ChapterMathExercises = ({ exercises, chapterTitle, chapterId, onClose }: ChapterMathExercisesProps) => {
  const [currentExercise, setCurrentExercise] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<string, { submitted: boolean; correct: boolean }>>({});
  const [showCorrection, setShowCorrection] = useState<Record<string, boolean>>({});
  const [exerciseTimes, setExerciseTimes] = useState<Record<string, number>>({});

  const exercise = currentExercise !== null ? exercises[currentExercise] : null;

  // Generate stable exercise content ID
  const currentExerciseContentId = useMemo(() => {
    if (currentExercise === null) return "";
    return `exercise-${chapterId}-${currentExercise}`;
  }, [chapterId, currentExercise]);

  // Time tracking pour l'exercice en cours
  const { formattedTime: currentExerciseTime, elapsedSeconds } = useTimeTracking({
    contentType: "exercise",
    contentId: currentExerciseContentId,
    chapterId: chapterId,
    autoStart: true,
    enabled: currentExercise !== null,
  });

  // Update exercise times when navigating away
  useEffect(() => {
    if (currentExerciseContentId && elapsedSeconds > 0) {
      setExerciseTimes(prev => ({
        ...prev,
        [currentExerciseContentId]: elapsedSeconds
      }));
    }
  }, [currentExerciseContentId, elapsedSeconds]);

  const handleAnswerChange = (id: string, value: string) => {
    setUserAnswers(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (ex: ChapterExercise) => {
    const userAnswer = userAnswers[ex.id]?.trim().toLowerCase() || "";
    const isCorrect = ex.acceptedAnswers.some(
      accepted => accepted.toLowerCase().trim() === userAnswer ||
                  userAnswer.includes(accepted.toLowerCase().trim()) ||
                  accepted.toLowerCase().trim().includes(userAnswer)
    );
    
    setSubmittedAnswers(prev => ({
      ...prev,
      [ex.id]: { submitted: true, correct: isCorrect }
    }));
  };

  const isSubmitted = (id: string) => submittedAnswers[id]?.submitted || false;
  const isCorrect = (id: string) => submittedAnswers[id]?.correct || false;

  const toggleCorrection = (id: string) => {
    setShowCorrection(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (currentExercise !== null && exercise) {
    const submitted = isSubmitted(exercise.id);
    const correct = isCorrect(exercise.id);
    const correctionVisible = showCorrection[exercise.id];

    return (
      <Card className="max-w-3xl mx-auto">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setCurrentExercise(null)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Button>
            <span className="text-sm px-2 py-1 rounded-full bg-primary/10 text-primary">
              Exercice {currentExercise + 1}/10
            </span>
          </div>
          <CardTitle className="text-xl mt-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                <PenTool className="h-5 w-5 text-orange-500" />
              </div>
              {exercise.title}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-lg">
              <Clock className="h-4 w-4 text-primary" />
              <span className="font-mono font-medium">{currentExerciseTime}</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Énoncé */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Énoncé
            </h4>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  code: ({ children }) => (
                    <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto">
                      {children}
                    </pre>
                  )
                }}
              >
                {exercise.statement}
              </ReactMarkdown>
            </div>
          </div>

          {/* Zone de réponse */}
          <div className="space-y-4">
            <div className="flex gap-3">
              <Input
                placeholder="Entrez votre réponse..."
                value={userAnswers[exercise.id] || ""}
                onChange={(e) => handleAnswerChange(exercise.id, e.target.value)}
                disabled={submitted}
                className={cn(
                  "flex-1 font-mono",
                  submitted && correct && "border-green-500 bg-green-500/10",
                  submitted && !correct && "border-red-500 bg-red-500/10"
                )}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !submitted && userAnswers[exercise.id]?.trim()) {
                    handleSubmit(exercise);
                  }
                }}
              />
              <Button
                onClick={() => handleSubmit(exercise)}
                disabled={submitted || !userAnswers[exercise.id]?.trim()}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                Valider
              </Button>
            </div>

            {/* Feedback */}
            {submitted && (
              <div className={cn(
                "p-4 rounded-lg flex items-center gap-3",
                correct ? "bg-green-500/10 border border-green-500/30" : "bg-red-500/10 border border-red-500/30"
              )}>
                {correct ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    <div>
                      <p className="font-medium text-green-700 dark:text-green-300">Bonne réponse ! 🎉</p>
                      <p className="text-sm text-muted-foreground">Réponse attendue : {exercise.expectedAnswer}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                    <div>
                      <p className="font-medium text-red-700 dark:text-red-300">Réponse incorrecte</p>
                      <p className="text-sm text-muted-foreground">
                        Votre réponse : {userAnswers[exercise.id]} — Attendue : {exercise.expectedAnswer}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Bouton Correction (seulement après soumission) */}
          <Button
            variant="outline"
            onClick={() => toggleCorrection(exercise.id)}
            disabled={!submitted}
            className={cn(
              "w-full gap-2",
              !submitted && "opacity-50 cursor-not-allowed"
            )}
          >
            <Eye className="h-4 w-4" />
            {correctionVisible ? "Masquer la correction" : "Afficher la correction"}
          </Button>

          {/* Correction détaillée */}
          {correctionVisible && (
            <div className="p-4 bg-muted/30 rounded-lg border">
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-primary">
                <CheckCircle2 className="h-4 w-4" />
                Correction détaillée
              </h4>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    strong: ({ children }) => (
                      <strong className="text-primary">{children}</strong>
                    ),
                    code: ({ children }) => (
                      <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                        {children}
                      </code>
                    )
                  }}
                >
                  {exercise.solution}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3">
            {currentExercise > 0 && (
              <Button 
                variant="outline" 
                onClick={() => setCurrentExercise(currentExercise - 1)}
                className="flex-1"
              >
                Exercice précédent
              </Button>
            )}
            {currentExercise < exercises.length - 1 && (
              <Button 
                onClick={() => setCurrentExercise(currentExercise + 1)}
                className="flex-1"
              >
                Exercice suivant
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Liste des exercices
  const completedCount = Object.values(submittedAnswers).filter(s => s.submitted && s.correct).length;
  
  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
              <PenTool className="h-5 w-5 text-white" />
            </div>
            Exercices
          </CardTitle>
          <Button variant="outline" onClick={onClose}>
            Retour au cours
          </Button>
        </div>
        <p className="text-muted-foreground mt-2">
          {chapterTitle} — {completedCount}/{exercises.length} réussis
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {exercises.map((ex, index) => {
            const submitted = isSubmitted(ex.id);
            const correct = isCorrect(ex.id);
            const exerciseId = `exercise-${chapterId}-${index}`;
            const timeForExercise = exerciseTimes[exerciseId] || 0;
            
            return (
              <button
                key={ex.id}
                onClick={() => setCurrentExercise(index)}
                className={cn(
                  "w-full p-4 rounded-lg border text-left transition-all hover:shadow-md",
                  "flex items-center justify-between gap-4",
                  submitted && correct ? "bg-green-500/5 border-green-500/30" : 
                  submitted && !correct ? "bg-red-500/5 border-red-500/30" : 
                  "hover:bg-accent"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                    submitted && correct ? "bg-green-500 text-white" :
                    submitted && !correct ? "bg-red-500 text-white" :
                    "bg-muted"
                  )}>
                    {submitted && correct ? <CheckCircle2 className="h-4 w-4" /> : 
                     submitted && !correct ? <XCircle className="h-4 w-4" /> : 
                     index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium">{ex.title}</h4>
                    <span className="text-sm text-muted-foreground line-clamp-1">
                      {ex.statement.substring(0, 60)}...
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {timeForExercise > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      <Clock className="h-3 w-3" />
                      {formatTime(timeForExercise)}
                    </div>
                  )}
                  <span className="text-primary">→</span>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
