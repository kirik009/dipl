import { useParams, useLocation, Link as WouterLink } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Exercise, ExerciseProgress, Task, TaskProgress } from "@shared/schema";
import { CheckCircle, XCircle } from "lucide-react";
import { Loader2 } from "lucide-react";
import { navigate } from "wouter/use-browser-location";

export default function TaskResults() {
  const { taskId, progressId} = useParams<{taskId : string, progressId: string}>();

  // Extract query parameters
  const searchParams = new URLSearchParams(window.location.search);


   const { data: prog, isLoading, error } = useQuery<TaskProgress>({
      queryKey: [`/api/task_prog/${progressId}`],
      queryFn: async () => {
          const response = await fetch(`/api/task_prog/${progressId}`);
          if (!response.ok) throw new Error("Failed to fetch tasks");
          return response.json();
        },
    });
  
    const { data: task } = useQuery<Task>({
      queryKey: [`/api/tasks/${taskId}`],
      queryFn: async () => {
          const response = await fetch(`/api/tasks/${taskId}`);
          if (!response.ok) throw new Error("Failed to fetch tasks");
          return response.json();
        },
    });

    const { data: exerciseProgs} = useQuery<ExerciseProgress[]>({
      queryKey: [`/api/task_exercises_prog/${progressId}`],
      queryFn: async () => {
          const response = await fetch(`/api/task_exercises_prog/${progressId}`);
          if (!response.ok) throw new Error("Failed to fetch exercises progress");
          return response.json();
        },
    }); 

    const { data: exercises} = useQuery<Exercise[]>({
      queryKey: [`/api/task_exercises/${taskId}`],
      queryFn: async () => {
          const response = await fetch(`/api/task_exercises/${taskId}`);
          if (!response.ok) throw new Error("Failed to fetch exercises");
          return response.json();
        },
    }); 

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
  
  if (error ) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto pt-20 pb-12 px-4 min-h-screen">
          <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-sm mt-8 text-center">
            <h2 className="text-2xl font-bold text-red-500 mb-4">Error Loading Results</h2>
            <p className="text-gray-600 mb-6">
              {error?.message || "Could not load the exercise results. Please try again."}
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
        <p className="mx-auto w-fit">Задание начато: {String(prog?.startedAt)}</p>
        <p className=" mx-auto w-fit">Задание закончено: {String(prog?.completedAt)}</p>
        <p className=" mx-auto w-fit">Правильных ответов: {prog?.correctAnswers}/{task?.exercisesNumber}</p>
       
        <div className="flex flex-col gap-4">
      {Array.from({ length: Number(task?.exercisesNumber) }).map((_, index) => (
        <div key={index} className="flex gap-4">
          <div className="bg-blue-300 p-4 rounded">
          <p> Вопрос {index}</p>
          <p> {exerciseProgs && exerciseProgs[index].isCorrect} </p>
          </div>
          <div className="bg-green-300 p-4 rounded">
          <p> {exercises && exercises[index].words}</p>
          <p> Ответ: {exercises && exercises[index].correctSentence} </p>
          </div>
        </div>
      ))}
    </div>
        <button  className="gap-2"      
                onClick={() => navigate("/tasks")}
                >
                    Завершить обзор
                </button>
      </div>
      </div>
     </>
  );
}
