import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Navbar } from "@/components/layout/navbar";
import { DragItem } from "@/components/ui/dnd/drag-item";
import { DropZone } from "@/components/ui/dnd/drop-zone";
import WordBank from "@/components/ui/dnd/word-bank";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Exercise,
  TaskProgress,
  insertTaskProgressSchema,
  ExerciseProgress,
  AssingedTask,
  Task,
} from "@shared/schema";
import { Loader2, RefreshCw } from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
export default function ExercisePage() {
  const { user } = useAuth();
  const { taskId, progressId, exerciseId, seq } = useParams<{
    taskId: string;
    progressId: string;
    exerciseId: string;
    seq: string;
  }>();

  const {
    data: taskProg,
    isLoading: taskProgLoading,
    error: taskProgError,
  } = useQuery<
    { exercisesNumber: number | null } & {
      timeConstraint: string | null;
    } & TaskProgress
  >({
    queryKey: [`/api/task_prog/${progressId}`],
  });
  const {
    data: exercise,
    isLoading,
    error,
  } = useQuery<Exercise>({
    queryKey: [`/api/exercises/${exerciseId}`],
  });

  const {
    data: exerciseProgs,
    isLoading: exerciseProgsLoading,
    error: exerciseProgsError,
    refetch,
  } = useQuery<ExerciseProgress[]>({
    queryKey: [`/api/task_exercises_prog/${progressId}`],
  });

  const {
    data: assignedTasks,
    isLoading: assignedTasksLoading,
    error: assignedTasksError,
  } = useQuery<AssingedTask[]>({
    queryKey: [`/api/assignedTasks/${user?.id}`],
  });

  const [, navigate] = useLocation();
  const { toast } = useToast();
  type WordItem = { id: string; text: string };
  // State for word bank and sentence building
  const [wordBank, setWordBank] = useState<WordItem[]>([]);
  const [sentence, setSentence] = useState<WordItem[]>([]);

  function calculateTimeLeft(
    startedAtRaw: string,
    timeConstraint: string
  ): number {
    const startTime = new Date(startedAtRaw).getTime() - 3 * 60 * 60 * 1000;
    const duration = parseTimeConstraint(timeConstraint);
    const now = Date.now();

    return startTime + duration - now;
  }

  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  function parseTimeConstraint(time: string): number {
    const [hours, minutes, seconds] = time.split(":").map(Number);

    return ((hours * 60 + minutes) * 60 + seconds) * 1000;
  }

  useEffect(() => {
    if (!taskProg?.startedAt) return;
    if (!taskProg.timeConstraint && taskProg.timeConstraint === "00:00:00")
      return;

    const updateTimer = () => {
      const left = calculateTimeLeft(
        String(taskProg.startedAt),
        String(taskProg.timeConstraint)
      );
      setTimeLeft(left > 0 ? left : 0);
    };

    updateTimer(); // начальная установка
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [taskProg?.startedAt]);

  useEffect(() => {
    let i = 0;
    let nextExId = 0;
    exerciseProgs?.forEach((exerciseProg) => {
      if (exerciseProg.userAnswer !== null) {
        i++;
      } else {
        nextExId = exerciseProg?.exerciseId!;
      }
    });
    if (i >= parseInt(seq) + 1)
      navigate(
        `/tasks/${taskId}/prog/${progressId}/exercises/${nextExId}/seq/${i}`
      );
    if (taskProg?.exercisesNumber !== exerciseProgs?.length) {
      refetch();
    }
    if (timeLeft === null || timeLeft > 0) return;
    if (taskProg?.timeConstraint === "00:00:00") return;
    if (assignedTasks && assignedTasks?.length > 0) {
      updateAssignedTaskStatusMutation.mutate();
    }

    updateTaskMutation.mutate({ isActive: false });

    navigate(`/tasks/${taskId}/prog/${progressId}/results`);
  }, [timeLeft]);

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

  useEffect(() => {
    if (exercise) {
      setWordBank(
        exercise.words.map((word, index) => ({
          id: `${word}-${index}-${crypto.randomUUID()}`,
          text: word,
        }))
      );
      setSentence([]);
    }
  }, [exercise]);

  // Submit exercise mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      const userAnswer = sentence
       .map((w, index) => {
    const isPunctuation = /^[.,:;!?]$/.test(w.text);

    if (isPunctuation) {
      return w.text + " ";
    }
    const prev = sentence[index - 1];
    const needsSpace = index > 0 && !/^[.,:;!?]$/.test(prev.text);
    return (needsSpace ? " " : "") + w.text;
  })
  .join("")
  .toLowerCase()
  .trim();
      const correctAnswer = exercise?.correctSentence
        .replace(/[!?.]\s*$/, "")
        .toLowerCase()
        .trim();
        console.log(correctAnswer, userAnswer);
      if (exerciseProgs) {
        const res = await apiRequest(
          "PATCH",
          `/api/exerciseProg/${exerciseProgs[Number(seq)]?.id}`,
          {
            // exerciseId: parseInt(exerciseId),
            isCorrect: userAnswer === correctAnswer,
            userAnswer,
            completedAt: new Date(),
          }
        );
        return await res.json();
      }
    },
    onSuccess: (data) => {
      if (typeof taskProg?.correctAnswers == "number") {
        updateTaskMutation.mutate({
          correctAnswers: taskProg?.correctAnswers + (data.isCorrect ? 1 : 0),
          isActive: true,
        });
      }
      navigate(
        `/tasks/${taskId}/prog/${progressId}/exercises/${exerciseId}/seq/${seq}/results?isCorrect=${data.isCorrect}`
      );
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка при отправке результата задания",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reset exercise
  const handleReset = () => {
    if (exercise) {
      setWordBank(
        exercise.words.map((word, index) => ({
          id: `${word}-${index}-${crypto.randomUUID()}`,
          text: word,
        }))
      );
      setSentence([]);
    }
  };
  // Check answer
  const handleCheckAnswer = () => {
    if (sentence.length === 0) {
      toast({
        title: "Пожалуйста постройте предложение",
        description: "Перетаскивайте слова, чтобы сформировать предложение.",
        variant: "destructive",
      });
      return;
    }

    submitMutation.mutate();
    if (timeLeft !== null) {
    }
  };

  if (
    taskProg?.exercisesNumber !== exerciseProgs?.length ||
    isLoading ||
    exerciseProgsLoading ||
    taskProgLoading ||
    assignedTasksLoading
  ) {
    refetch();
    return (
      <>
        <Navbar />
        <div className="container mx-auto pt-20 pb-12 px-4 min-h-screen flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </>
    );
  }

  if (error || exerciseProgsError || taskProgError || assignedTasksError) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto pt-20 pb-12 px-4 min-h-screen">
          <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-sm mt-8 text-center">
            <h2 className="text-2xl font-bold text-red-500 mb-4">
              Error Loading Exercise
            </h2>
            <p className="text-gray-600 mb-6">
              {error?.message ||
                "Could not load the exercise. Please try again."}
            </p>
            <Button onClick={() => navigate("/")}>На главную</Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="container mx-auto pt-20 pb-12 px-4">
        {timeLeft !== null && taskProg?.timeConstraint !== "00:00:00" && (
          <p className="text-lg text-gray-600 mb-8">
            {(() => {
              const totalSeconds = Math.floor(timeLeft / 1000);
              const hours = Math.floor(totalSeconds / 3600);
              const minutes = Math.floor((totalSeconds % 3600) / 60);
              const seconds = totalSeconds % 60;
              return `${hours.toString().padStart(2, "0")}:${minutes
                .toString()
                .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
            })()}
          </p>
        )}
        <div className="py-16">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="bg-primary text-white p-6">
                <div className="flex justify-between items-center">
                  <h2 className="font-heading text-2xl font-semibold">
                    Sentence Builder
                  </h2>
                  <div className="flex items-center space-x-4"></div>
                </div>
                <div className="mt-4 flex items-center">
                  <Progress value={40} className="h-2 bg-white/20" />
                  <span className="ml-3 text-white text-sm font-medium">
                    {Number(parseInt(seq) + 1)}/{taskProg?.exercisesNumber}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg text-gray-700 mb-1">
                    Arrange the words to form a correct English sentence:
                  </h3>
                  <p className="text-gray-500 italic">
                    Расположите слова, чтобы составить правильное предложение
                  </p>
                </div>

                <div className="mb-8">
                  <div className="p-4 bg-gray-50 rounded-lg mb-4">
                    <p className="text-gray-700 font-medium">
                      {exercise?.translation}
                    </p>
                  </div>

                  <DropZone
                    onDrop={(wordItem) => {
                      setSentence((prev) => [...prev, wordItem]);
                    }}
                    isEmpty={sentence.length === 0}
                    className="mb-6"
                  >
                    {sentence.map((word, index) => (
                      <DragItem
                        id={word.id}
                        text={word.text}
                        index={index}
                        canMove={true}
                        onRemove={() => {
                          setSentence((prev) =>
                            prev.filter((w) => w.id !== word.id)
                          );
                        }}
                        moveCard={(dragIndex: number, hoverIndex: number) => {
                          setSentence((prevSentence) => {
                            const updated = [...prevSentence];
                            const [removed] = updated.splice(dragIndex, 1);
                            updated.splice(hoverIndex, 0, removed);

                            return updated;
                          });
                        }}
                      />
                    ))}
                  </DropZone>
                </div>

                <WordBank
                  words={wordBank}
                  activeWords={sentence}
                  onWordDragged={(wordItem) => {
                    setWordBank((prev) =>
                      prev.filter((w) => w.id !== wordItem.id)
                    );
                  }}
                  onWordReturned={(wordItem) => {
                    setWordBank((prev) => [...prev, wordItem]);
                  }}
                ></WordBank>

                <div className="mt-8 flex justify-between">
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="gap-1"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Перезагрузить
                  </Button>
                  <div>
                    <Button
                      onClick={handleCheckAnswer}
                      disabled={submitMutation.isPending}
                    >
                      {submitMutation.isPending
                        ? "Проверка..."
                        : "Проверить ответ"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
