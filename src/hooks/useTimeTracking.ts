import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TimeTrackingOptions {
  contentType: "chapter" | "quiz" | "exercise";
  contentId: string;
  chapterId?: string;
  autoStart?: boolean;
  saveIntervalMs?: number;
  enabled?: boolean;
}

interface TimeTrackingResult {
  elapsedSeconds: number;
  formattedTime: string;
  isRunning: boolean;
  isPaused: boolean;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
}

export const formatTime = (seconds: number): string => {
  if (!seconds || seconds < 0) return "0s";
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, "0")}min`;
  }
  if (minutes > 0) {
    return `${minutes}min ${secs.toString().padStart(2, "0")}s`;
  }
  return `${secs}s`;
};

export const useTimeTracking = ({
  contentType,
  contentId,
  chapterId,
  autoStart = true,
  saveIntervalMs = 30000,
  enabled = true,
}: TimeTrackingOptions): TimeTrackingResult => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedRef = useRef<number>(0);
  const lastSavedRef = useRef<number>(0);

  // Sync elapsedRef with elapsedSeconds
  useEffect(() => {
    elapsedRef.current = elapsedSeconds;
  }, [elapsedSeconds]);

  // Récupérer le temps déjà passé depuis la BDD
  const fetchInitialTime = useCallback(async () => {
    if (!enabled || !contentId || contentId === "none") {
      setIsInitialized(true);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsInitialized(true);
        return;
      }

      setUserId(user.id);

      const { data } = await supabase
        .from("time_tracking")
        .select("time_spent_seconds")
        .eq("user_id", user.id)
        .eq("content_type", contentType)
        .eq("content_id", contentId)
        .maybeSingle();

      if (data) {
        setElapsedSeconds(data.time_spent_seconds);
        elapsedRef.current = data.time_spent_seconds;
        lastSavedRef.current = data.time_spent_seconds;
      } else {
        setElapsedSeconds(0);
        elapsedRef.current = 0;
        lastSavedRef.current = 0;
      }
      setIsInitialized(true);
    } catch (error) {
      console.error("Error fetching initial time:", error);
      setIsInitialized(true);
    }
  }, [contentType, contentId, enabled]);

  // Sauvegarder le temps en BDD
  const saveTime = useCallback(async () => {
    if (!userId || !enabled || !contentId || contentId === "none") return;

    const currentElapsed = elapsedRef.current;
    const additionalSeconds = currentElapsed - lastSavedRef.current;

    if (additionalSeconds <= 0) return;

    try {
      await supabase.rpc("upsert_time_tracking", {
        p_user_id: userId,
        p_content_type: contentType,
        p_content_id: contentId,
        p_chapter_id: chapterId || null,
        p_additional_seconds: additionalSeconds,
      });
      lastSavedRef.current = currentElapsed;
    } catch (error) {
      console.error("Error saving time tracking:", error);
    }
  }, [userId, contentType, contentId, chapterId, enabled]);

  // Démarrer le compteur
  const start = useCallback(() => {
    if (isRunning || !enabled) return;

    setIsRunning(true);
    setIsPaused(false);

    // Increment every second
    intervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => {
        const newVal = prev + 1;
        elapsedRef.current = newVal;
        return newVal;
      });
    }, 1000);

    // Save periodically
    saveIntervalRef.current = setInterval(() => {
      saveTime();
    }, saveIntervalMs);
  }, [isRunning, saveIntervalMs, saveTime, enabled]);

  // Mettre en pause
  const pause = useCallback(() => {
    if (!isRunning || isPaused) return;

    setIsPaused(true);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Sauvegarder immédiatement lors de la pause
    saveTime();
  }, [isRunning, isPaused, saveTime]);

  // Reprendre
  const resume = useCallback(() => {
    if (!isPaused) return;

    setIsPaused(false);

    intervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => {
        const newVal = prev + 1;
        elapsedRef.current = newVal;
        return newVal;
      });
    }, 1000);
  }, [isPaused]);

  // Réinitialiser
  const reset = useCallback(() => {
    setElapsedSeconds(0);
    setIsRunning(false);
    setIsPaused(false);
    elapsedRef.current = 0;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current);
      saveIntervalRef.current = null;
    }
  }, []);

  // Gestion de la visibilité de l'onglet (pause auto)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isRunning && !isPaused) {
        pause();
      } else if (!document.hidden && isPaused && isRunning) {
        resume();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pause, resume, isPaused, isRunning]);

  // Initialisation - reset quand le contentId change
  useEffect(() => {
    setIsInitialized(false);
    setIsRunning(false);
    setIsPaused(false);
    elapsedRef.current = 0;
    lastSavedRef.current = 0;
    setElapsedSeconds(0);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current);
      saveIntervalRef.current = null;
    }

    fetchInitialTime();
  }, [contentId, fetchInitialTime]);

  // Auto-start après initialisation
  useEffect(() => {
    if (autoStart && isInitialized && userId && !isRunning && enabled && contentId && contentId !== "none") {
      start();
    }
  }, [autoStart, isInitialized, userId, isRunning, start, enabled, contentId]);

  // Cleanup et sauvegarde finale
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }

      // Sauvegarder le temps restant non sauvegardé
      const currentElapsed = elapsedRef.current;
      const toSave = currentElapsed - lastSavedRef.current;
      
      if (toSave > 0 && userId && enabled && contentId && contentId !== "none") {
        supabase.rpc("upsert_time_tracking", {
          p_user_id: userId,
          p_content_type: contentType,
          p_content_id: contentId,
          p_chapter_id: chapterId || null,
          p_additional_seconds: toSave,
        });
      }
    };
  }, [userId, contentType, contentId, chapterId, enabled]);

  return {
    elapsedSeconds,
    formattedTime: formatTime(elapsedSeconds),
    isRunning,
    isPaused,
    start,
    pause,
    resume,
    reset,
  };
};

// Hook pour récupérer les temps de tous les chapitres
export const useChaptersTimes = (chapterIds: string[]) => {
  const [times, setTimes] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimes = async () => {
      if (chapterIds.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data } = await supabase
          .from("time_tracking")
          .select("content_id, time_spent_seconds")
          .eq("user_id", user.id)
          .eq("content_type", "chapter")
          .in("content_id", chapterIds);

        if (data) {
          const timesMap: Record<string, number> = {};
          data.forEach((item) => {
            timesMap[item.content_id] = item.time_spent_seconds;
          });
          setTimes(timesMap);
        }
      } catch (error) {
        console.error("Error fetching chapters times:", error);
      }
      setLoading(false);
    };

    fetchTimes();
  }, [JSON.stringify(chapterIds)]);

  return { times, loading, formatTime };
};

// Hook pour récupérer les temps de tous les exercices d'un chapitre
export const useExercisesTimes = (chapterId: string, exerciseIds: string[]) => {
  const [times, setTimes] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimes = async () => {
      if (exerciseIds.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data } = await supabase
          .from("time_tracking")
          .select("content_id, time_spent_seconds")
          .eq("user_id", user.id)
          .eq("content_type", "exercise")
          .in("content_id", exerciseIds);

        if (data) {
          const timesMap: Record<string, number> = {};
          data.forEach((item) => {
            timesMap[item.content_id] = item.time_spent_seconds;
          });
          setTimes(timesMap);
        }
      } catch (error) {
        console.error("Error fetching exercises times:", error);
      }
      setLoading(false);
    };

    fetchTimes();
  }, [chapterId, JSON.stringify(exerciseIds)]);

  return { times, loading, formatTime };
};
