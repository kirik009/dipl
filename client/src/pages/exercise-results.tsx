import { useParams, useLocation, Link as WouterLink } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import {
  AssingedTask,
  Exercise,
  insertTaskProgressSchema,
  Task,
  TaskProgress,
} from "@shared/schema";
import { CheckCircle, XCircle } from "lucide-react";
import { Loader2 } from "lucide-react";
import { navigate } from "wouter/use-browser-location";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";

export default function ExerciseResults() {
  const { taskId, progressId, exerciseId, seq } = useParams<{
    taskId: string;
    progressId: string;
    exerciseId: string;
    seq: string;
  }>();
  const { user } = useAuth();
  const searchParams = new URLSearchParams(window.location.search);
  const isCorrect = searchParams.get("isCorrect") === "true";

  const {
    data: taskProg,
    isLoading: taskProgLoading,
    error: taskProgError,
  } = useQuery<TaskProgress>({
    queryKey: [`/api/task_prog/${progressId}`],
  });

  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const nextSeq = parseInt(seq) + 1;

  const {
    data: task,
    isLoading: taskLoading,
    error: taskError,
  } = useQuery<Task>({
    queryKey: [`/api/tasks/${taskId}`],
    queryFn: async () => {
      const response = await fetch(`/api/tasks/${taskId}`);
      if (!response.ok) throw new Error("Failed to fetch tasks");
      return response.json();
    },
    staleTime: 0,
    refetchOnMount: true,
  });

  const {
    data: nextExercise,
    isLoading: nextExerciseLoading,
    error: nextExerciseError,
  } = useQuery<Exercise>({
    queryKey: [`/api/task_exercises/${taskId}/seq/${nextSeq}`],
    queryFn: async () => {
      const response = await fetch(
        `/api/task_exercises/${taskId}/seq/${nextSeq}`
      ); //возможно  seq
      if (!response.ok) throw new Error("Failed to fetch next exercise");
      return response.json();
    },
  });

  const {
    data: exercise,
    isLoading: exerciseLoading,
    error: exerciseError,
  } = useQuery<Exercise>({
    queryKey: [`/api/task_exercises/${taskId}/seq/${seq}`],
    queryFn: async () => {
      const response = await fetch(`/api/task_exercises/${taskId}/seq/${seq}`);
      if (!response.ok) throw new Error("Failed to fetch this exercises");
      return response.json();
    },
  });

  const {
    data: assignedTasks,
    isLoading: assignedTasksLoading,
    error: assignedTasksError,
  } = useQuery<AssingedTask[]>({
    queryKey: [`/api/assignedTasks/${user?.id}`],
  });

  const isLoading =
    exerciseLoading ||
    taskLoading ||
    nextExerciseLoading ||
    assignedTasksLoading ||
    taskProgLoading;
  const error =
    taskError ||
    exerciseError ||
    exerciseError ||
    assignedTasksError ||
    taskProgError;

  type FormValues = z.infer<typeof insertTaskProgressSchema>;

  const updateTaskMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest(
        "PATCH",
        `/api/task_prog/${progressId}`,
        data
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/task_prog/${progressId}`],
      });
      navigate(`/tasks/${taskId}/prog/${progressId}/results`);
    },
    onError: (error: Error) => {
      toast({
        title: "Обновление не выполнено",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateAssignedTaskStatusMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        "PATCH",
        `/api/assignedTasks/${taskId}/${user?.id}`
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/assignedTasks/${user?.id}`],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Обновление не выполнено",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function parseTimeStringToMs(timeString: string): number {
    const [hours, minutes, seconds] = timeString.split(":").map(Number);
    return ((hours * 60 + minutes) * 60 + seconds) * 1000;
  }

  useEffect(() => {
    if (!taskProg || !task) return;

    const startTime =
      new Date(taskProg.startedAt).getTime() - 3 * 60 * 60 * 1000; // если у тебя UTC
    const durationStr = task.timeConstraint;

    const duration = parseTimeStringToMs(durationStr);
    const endTime = startTime + duration;

    const update = () => {
      const now = Date.now();
      const newTimeLeft = endTime - now;
      setTimeLeft(newTimeLeft <= 0 ? 0 : newTimeLeft);
    };

    update();

    const interval = setInterval(update, 1000);

    // Очистка при размонтировании
    return () => clearInterval(interval);
  }, [taskProg, task]);

  useEffect(() => {
    if (timeLeft === null || timeLeft > 0) return;
    if (task?.timeConstraint === "00:00:00") return;
    if (assignedTasks && assignedTasks?.length > 0) {
      updateAssignedTaskStatusMutation.mutate();
    }
    updateTaskMutation.mutate({ isActive: false });
  }, [timeLeft]);
  const handleComplete = () => {
    if (task && nextSeq >= Number(task.exercisesNumber)) {
      if (assignedTasks && assignedTasks?.length > 0) {
        updateAssignedTaskStatusMutation.mutate();
      }
      updateTaskMutation.mutate({ isActive: false });
      queryClient.invalidateQueries({ queryKey: [`/api/task_exercises_prog/${progressId}`] });
    } else {
      if (nextExercise?.id)
        navigate(
          `/tasks/${taskId}/prog/${progressId}/exercises/${nextExercise?.id}/seq/${nextSeq}`
        );
    }
  };
  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto pt-20 pb-12 px-4 min-h-screen flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto pt-20 pb-12 px-4 min-h-screen">
          <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-sm mt-8 text-center">
            <h2 className="text-2xl font-bold text-red-500 mb-4">
              Error Loading Results
            </h2>
            <p className="text-gray-600 mb-6">
              {error?.message ||
                "Could not load the exercise results. Please try again."}
            </p>
            <Button asChild>
              <WouterLink href="/">На главную</WouterLink>
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="container mx-auto pt-20 pb-12 px-4">
        {timeLeft !== null && task?.timeConstraint !== "00:00:00" && (
          <p className="text-lg text-gray-600 mb-8">
            {(() => {
              const totalSeconds = Math.floor(timeLeft / 1000);
              const hours = Math.floor(totalSeconds / 3600);
              const minutes = Math.floor((totalSeconds % 3600) / 60);
              const seconds = totalSeconds % 60;
              return `${String(hours).length === 1 ? `0${hours}` : hours}:${
                String(minutes).length === 1 ? `0${minutes}` : minutes
              }:${String(seconds).length === 1 ? `0${seconds}` : seconds}`;
            })()}
          </p>
        )}
        <div className="py-16">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {isCorrect ? (
                <div className="bg-green-500 p-6 text-white">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 mr-3" />
                    <h3 className="font-heading text-2xl font-semibold">
                      Верно!
                    </h3>
                  </div>
                </div>
              ) : (
                <div className="bg-red-500 p-6 text-white">
                  <div className="flex items-center">
                    <XCircle className="h-8 w-8 mr-3" />
                    <h3 className="font-heading text-2xl font-semibold">
                      Не верно
                    </h3>
                  </div>
                </div>
              )}

              <div className="p-6">
                <div className="mb-6">
                  <h4 className="font-medium text-gray-700 mb-2">
                    Правильный ответ:
                  </h4>
                  <p className="p-3 bg-gray-50 rounded text-gray-800">
                    {exercise?.correctSentence}
                  </p>
                </div>

                <div className="mb-6">
                  <h4 className="font-medium text-gray-700 mb-2">Перевод:</h4>
                  <p className="p-3 bg-gray-50 rounded text-gray-800">
                    {exercise?.translation}
                  </p>
                </div>

                <div className="mb-6">
                  <h4 className="font-medium text-gray-700 mb-2">Пояснение:</h4>
                  <div className="p-4 bg-primary-50 rounded-lg text-gray-700">
                    <p>{exercise?.grammarExplanation}</p>
                  </div>
                </div>

                <div className="flex justify-center">
                  {task && nextSeq >= Number(task.exercisesNumber) ? (
                    <button onClick={handleComplete}>Завершить</button>
                  ) : (
                    <button onClick={handleComplete}>Следующее</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
