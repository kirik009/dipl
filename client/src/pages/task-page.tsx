import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Exercise, Task, TaskProgress } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { useLocation, useParams } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { Loader2 } from "lucide-react";

export default function TaskPage() {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();

  const {
    data: task,
    isLoading,
    error,
  } = useQuery<Task>({
    queryKey: [`/api/tasks/${id}`],
    queryFn: async () => {
      const response = await fetch(`/api/tasks/${id}`);
      if (!response.ok) throw new Error("Failed to fetch tasks");
      return response.json();
    },
  });

  const {
    data: exercises,
    isLoading: exercisesLoading,
    error: exercisesError,
  } = useQuery<Exercise[]>({
    queryKey: [`/api/task_exercises/${id}`],
  });
  ("");
  const {
    data: taskProgs,
    isLoading: taskProgsLoading,
    error: taskProgsError,
  } = useQuery<TaskProgress[]>({
    queryKey: [`/api/task_prog/${task?.id}/${user?.id}`],
    enabled: !!task,
  });
  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/tasks/prog`, {
        correctAnswers: 0,
        userId: Number(user?.id),
        taskId: Number(id),
        startedAt: new Date(),
      });
      const data = await res.json();
      return data;
    },
    onSuccess: (data) => {
      const newProgressId = data.id;
      queryClient.invalidateQueries({
        queryKey: [`/api/task_prog/${newProgressId}`],
      });

      if (exercises) {
        const exerciseId = exercises[0].id;
        if (task?.exercisesNumber) {
          for (let i = 0; i < task?.exercisesNumber; i++) {
            submitProgressMutation.mutate({ newProgressId, i });
          }
        }
        queryClient.invalidateQueries({
          queryKey: [`/api/task_exercises_prog/${newProgressId}`],
        });

        navigate(
          `${id}/prog/${newProgressId}/exercises/${exerciseId}/seq/${0}`
        );
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error submitting answer",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const submitProgressMutation = useMutation({
    mutationFn: async ({
      newProgressId,
      i,
    }: {
      newProgressId: number;
      i: number;
    }) => {
      const res = await apiRequest("POST", "/api/exercises/submit", {
        exerciseId: exercises ? exercises[i].id : 0,
        userId: user?.id,
        taskProgressId: newProgressId,
      });
      return await res.json();
    },
    onSuccess: (newProgressId: number) => {},
    onError: (error: Error) => {
      toast({
        title: "Ошибка при отправке задания",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  const handleSubmit = () => {
    if (
      Number(task?.triesNumber) != 0 &&
      task &&
      taskProgs &&
      taskProgs?.length >= Number(task?.triesNumber)
    ) {
      toast({
        title: "Вы не можете пройти это задание",
        variant: "destructive",
      });
      return;
    }

    submitMutation.mutate();
  };

  if (isLoading || exercisesLoading || taskProgsLoading) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="py-12 text-center">
          <p className="text-red-500">{(error as Error).message}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="mt-16">
        <div className="flex flex-col items-center mb-6">
          <p className="mx-auto w-fit">{task?.name}</p>
          <p className="mx-auto w-fit">
            Количество попыток:{" "}
            {task?.triesNumber !== 0 ? task?.triesNumber : "не ограничено"}
          </p>
          <p className="mx-auto w-fit">
            Ограничение по времени:{" "}
            {task?.timeConstraint !== "00:00:00"
              ? task?.timeConstraint
              : "не ограничено"}
          </p>

          {/* Статистика по попыткам */}
          {taskProgs && taskProgs.length > 0 ? (
            <div className="mt-6 w-full max-w-md bg-gray-50 p-4 rounded-md shadow-sm">
              <h3 className="text-lg font-semibold mb-2">Ваши попытки:</h3>
              <ul className="space-y-2">
                {taskProgs.map((prog, index) => (
                  <li
                    key={prog.id}
                    className="border-b pb-2 text-sm text-gray-700"
                  >
                    Попытка {index + 1}: {prog.correctAnswers ?? 0} правильных
                    ответов{" "}
                    {"из " +
                      (Number(task?.exercisesNumber) !== 0
                        ? String(task?.exercisesNumber) + "  вопросов"
                        : "")}{" "}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-gray-500 mt-4">
              У вас пока нет попыток.
            </p>
          )}

          {/* Кнопка начать */}
          <button
            className="mt-6 h-10 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleSubmit}
          >
            Начать тест
          </button>
        </div>
      </div>
    </>
  );
}
