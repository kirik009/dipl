import { useParams, useLocation, Link as WouterLink } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Exercise, insertTaskProgressSchema, Task, TaskProgress } from "@shared/schema";
import { CheckCircle, XCircle } from "lucide-react";
import { Loader2 } from "lucide-react";
import { navigate } from "wouter/use-browser-location";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";

export default function ExerciseResults() {
  const { taskId, progressId, exerciseId, seq} = useParams<{taskId : string, progressId: string, exerciseId: string, seq: string}>();
  
  const searchParams = new URLSearchParams(window.location.search);
  const isCorrect = searchParams.get('isCorrect') === 'true';
  const isSkipped = searchParams.get('skipped') === 'true';


     const { data: prog } = useQuery<TaskProgress>({
        queryKey: [`/api/task_prog/${progressId}`],
        queryFn: async () => {
            const response = await fetch(`/api/task_prog/${progressId}`);
            if (!response.ok) throw new Error("Failed to fetch tasks");
            return response.json();
          },
      });


  const { data: exercise, isLoading, error } = useQuery<Exercise>({
    queryKey: [`/api/task_exercises/${taskId}/seq/${seq}`],
    queryFn: async () => {
        const response = await fetch(`/api/task_exercises/${taskId}/seq/${seq}`);
        if (!response.ok) throw new Error("Failed to fetch exercises");
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


  const nextExerciseId = parseInt(exerciseId) + 1;
  const nextSeq = parseInt(seq) + 1;
  type FormValues = z.infer<typeof insertTaskProgressSchema>;

  const updateTaskMutation =  useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("PUT", `/api/task_prog/${progressId}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "task progress updated",
        description: "The task progress has been successfully updated.",
      });
      navigate(`/tasks/${taskId}/prog/${progressId}/results`)
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleComplete = () => {
    if (task && nextSeq >=  Number(task.exercisesNumber)) {
      updateTaskMutation.mutate( 
         {}
      )
      
}
  
}
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
  
  if (error || !exercise) {
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
      <main className="container mx-auto pt-20 pb-12 px-4">
        <div className="py-16">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {isSkipped ? (
                <div className="bg-amber-500 p-6 text-white">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <h3 className="font-heading text-2xl font-semibold">Пропущено</h3>
                  </div>
                </div>
              ) : isCorrect ? (
                <div className="bg-green-500 p-6 text-white">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 mr-3" />
                    <h3 className="font-heading text-2xl font-semibold">Верно!</h3>
                  </div>
                </div>
              ) : (
                <div className="bg-red-500 p-6 text-white">
                  <div className="flex items-center">
                    <XCircle className="h-8 w-8 mr-3" />
                    <h3 className="font-heading text-2xl font-semibold">Не верно</h3>
                  </div>
                </div>
              )}
              
              <div className="p-6">
                <div className="mb-6">
                  <h4 className="font-medium text-gray-700 mb-2">Correct answer:</h4>
                  <p className="p-3 bg-gray-50 rounded text-gray-800">{exercise.correctSentence}</p>
                </div>
                
                <div className="mb-6">
                  <h4 className="font-medium text-gray-700 mb-2">Перевод:</h4>
                  <p className="p-3 bg-gray-50 rounded text-gray-800">{exercise.translation}</p>
                </div>
                
                <div className="mb-6">
                  <h4 className="font-medium text-gray-700 mb-2">Пояснение:</h4>
                  <div className="p-4 bg-primary-50 rounded-lg text-gray-700">
                    <p>{exercise.grammarExplanation}</p>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  
                  <Button asChild 
                  onClick={handleComplete}>

                    {(task && nextSeq >=  Number(task.exercisesNumber)) ? <p>
                    Завершить</p>
                     : 
                     <WouterLink href={`/tasks/${taskId}/prog/${progressId}/exercises/${nextExerciseId}/seq/${nextSeq}`}>
                      Следующее 
                    </WouterLink>
                   
}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
