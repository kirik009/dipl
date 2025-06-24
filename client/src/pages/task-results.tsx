import { useParams, Link as WouterLink } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Exercise, ExerciseProgress, Task, TaskProgress } from "@shared/schema";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { navigate } from "wouter/use-browser-location";

export default function TaskResults() {
  const { taskId, progressId } = useParams<{
    taskId: string;
    progressId: string;
  }>();

  const {
    data: prog,
    isLoading: progLoading,
    error: progError,
  } = useQuery<TaskProgress>({
    queryKey: [`/api/task_prog/${progressId}`],
    queryFn: async () => {
      const response = await fetch(`/api/task_prog/${progressId}`);
      if (!response.ok) throw new Error("Failed to fetch task progress");
      return response.json();
    },
    refetchOnMount: true,
    staleTime: 0,
  });

  const {
    data: task,
    isLoading: taskLoading,
    error: taskError,
  } = useQuery<Task>({
    queryKey: [`/api/tasks/${taskId}`],
    queryFn: async () => {
      const response = await fetch(`/api/tasks/${taskId}`);
      if (!response.ok) throw new Error("Failed to fetch task");
      return response.json();
    },
  });

  const {
    data: exerciseProgs,
    isLoading: exerciseProgsLoading,
    error: exerciseProgsError,
  } = useQuery<({ correctSentence: string | null } & ExerciseProgress)[]>({
    queryKey: [`/api/task_exercises_prog/${progressId}`],
    queryFn: async () => {
      const response = await fetch(`/api/task_exercises_prog/${progressId}`);
      if (!response.ok) throw new Error("Failed to fetch exercises progress");
      return response.json();
    },
  });

  const isLoading = progLoading || taskLoading || exerciseProgsLoading;
  if (!prog || !task) {
    return null; // или loader
  }
  const error = progError || taskError || exerciseProgsError;

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
              Ошибка загрузки
            </h2>
            <p className="text-gray-600 mb-6">
              {error?.message ||
                "Не удалось загрузить результаты. Попробуйте снова."}
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

      <div className="mt-16">
        <div className="flex flex-col items-center mb-6">
          <p className="mx-auto w-fit">
            Задание начато:{" "}
            {new Date(prog.startedAt).toLocaleString("ru-RU", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false,
              timeZone: "UTC",
            })}
          </p>
          <p className="mx-auto w-fit">
            Задание завершено:{" "}
            {prog.completedAt
              ? new Date(prog.completedAt)
              .toLocaleString("ru-RU",
                )

              : "—"}
          </p>
          <p className="mx-auto w-fit">
            Правильных ответов: {prog.correctAnswers}/{task.exercisesNumber}
          </p>

          <div className="flex flex-col gap-4 mt-8">
            {exerciseProgs &&
              exerciseProgs.map((exProg, index) => (
                <div key={index} className="flex gap-4">
                  <div className="bg-blue-300 p-4 rounded w-fit min-w-[175px]">
                    <p className="font-bold mb-2">Вопрос {index + 1}</p>
                    <p className="flex items-center gap-2">
                      {exProg.isCorrect ? (
                        <CheckCircle className="text-green-600" />
                      ) : (
                        <XCircle className="text-red-600" />
                      )}
                      {exProg.isCorrect ? "Правильно" : "Неправильно"}
                    </p>
                  </div>
                  <div className="bg-green-300 p-4 rounded flex-1">
                    <p>
                      <strong>Ваш ответ:</strong> {exProg.userAnswer}
                    </p>
                    <p>
                      <strong>Правильный ответ:</strong>{" "}
                      {exProg.correctSentence}
                    </p>
                  </div>
                </div>
              ))}
          </div>

          <Button className="mt-8" onClick={() => navigate("/tasks")}>
            Завершить обзор
          </Button>
        </div>
      </div>
    </>
  );
}
