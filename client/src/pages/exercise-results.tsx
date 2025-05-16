import { useParams, useLocation, Link as WouterLink } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { AssingedTask, Exercise, insertTaskProgressSchema, Task, } from "@shared/schema";
import { CheckCircle, XCircle } from "lucide-react";
import { Loader2 } from "lucide-react";
import { navigate } from "wouter/use-browser-location";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";

export default function ExerciseResults() {
  const { taskId, progressId, exerciseId, seq} = useParams<{taskId : string, progressId: string, exerciseId: string, seq: string}>();
  const {user} = useAuth()
  const searchParams = new URLSearchParams(window.location.search);
  const isCorrect = searchParams.get('isCorrect') === 'true';
  const isSkipped = searchParams.get('skipped') === 'true';
 queryClient.invalidateQueries({queryKey: [`/api/task_exercises_prog/${progressId}`]});

   const [timeLeft, setTimeLeft] = useState<number | null>(() => {
  const stored = localStorage.getItem("timeLeft");
  return stored ? parseInt(stored, 10) : null;
});

const nextSeq = parseInt(seq) + 1;

 const { data: task, isLoading: taskLoading, error: taskError } = useQuery<Task>({
      queryKey: [`/api/tasks/${taskId}`],
      queryFn: async () => {
          const response = await fetch(`/api/tasks/${taskId}`);
          if (!response.ok) throw new Error("Failed to fetch tasks");
          return response.json();
        },
        staleTime: 0,          
  refetchOnMount: true, 
    });

 const { data: nextExercise, isLoading: nextExerciseLoading, error: nextExerciseError } = useQuery<Exercise>({
    queryKey: [`/api/task_exercises/${taskId}/seq/${nextSeq}`],
    queryFn: async () => {
        const response = await fetch(`/api/task_exercises/${taskId}/seq/${nextSeq}`); //возможно  seq
        if (!response.ok) throw new Error("Failed to fetch next exercise");
        return response.json();
      },
     
  }); 

 
  const { data: exercise, isLoading: exerciseLoading, error: exerciseError } = useQuery<Exercise>({
    queryKey: [`/api/task_exercises/${taskId}/seq/${seq}`],
    queryFn: async () => {
        const response = await fetch(`/api/task_exercises/${taskId}/seq/${seq}`);
        if (!response.ok) throw new Error("Failed to fetch this exercises");
        return response.json();
      },
     
   
  }); 
  
 const { data: assignedTasks, isLoading: assignedTasksLoading, error: assignedTasksError } = useQuery<AssingedTask[]>({
    queryKey: [`/api/assignedTasks/${user?.id}`],   
   
  }); 
  
    const  isLoading = exerciseLoading || taskLoading || nextExerciseLoading || assignedTasksLoading;
    const error = taskError || exerciseError || exerciseError || assignedTasksError;
    
 
  
  type FormValues = z.infer<typeof insertTaskProgressSchema>;

  const updateTaskMutation =  useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("PATCH", `/api/task_prog/${progressId}`, data);
      return await res.json();
    },
    onSuccess: () => {
     
      navigate(`/tasks/${taskId}/prog/${progressId}/results`)
    },
    onError: (error: Error) => {
      toast({
        title: "Обновление не выполнено",
        description: error.message,
        variant: "destructive",
      });
    },
  });

    const updateAssignedTaskStatusMutation =  useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/assignedTasks/${taskId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: [`/api/assignedTasks/${user?.id}`]});
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
 if (timeLeft === null) return;
    if (timeLeft <= 0) {
      if (assignedTasks && assignedTasks?.length > 0) {
    updateAssignedTaskStatusMutation.mutate();
      }
      updateTaskMutation.mutate( 
        {isActive: false}
     )
      
    }
  
    const timer = setTimeout(() => {
      setTimeLeft(prev => (prev !== null ? prev - 1000 : null));
    }, 1000);
  
    return () => clearTimeout(timer);
  }, [timeLeft]);
  
  const handleComplete = () => {
    if (task && nextSeq >=  Number(task.exercisesNumber)) {
     
if (assignedTasks && assignedTasks?.length > 0) {
    updateAssignedTaskStatusMutation.mutate();
}
    updateTaskMutation.mutate( 
         {isActive: false}
      )
      
      
}
 else {
    console.log(nextExercise)
  if (timeLeft !== null)
  localStorage.setItem("timeLeft", String(timeLeft));
 
  if (nextExercise?.id)
  navigate(`/tasks/${taskId}/prog/${progressId}/exercises/${nextExercise?.id}/seq/${nextSeq}`)
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
  
  if (error) {
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
        {timeLeft !== null && (
      <p className="text-lg text-gray-600 mb-8">{
(() =>  {
  const totalSeconds = Math.floor(timeLeft / 1000); 
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).length === 1 ? `0${hours}` : hours}:${String(minutes).length === 1 ? `0${minutes}` : minutes}:${String(seconds).length === 1 ? `0${seconds}` : seconds}`
})()
}
</p>)}
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
                  <p className="p-3 bg-gray-50 rounded text-gray-800">{exercise?.correctSentence}</p>
                </div>
                
                <div className="mb-6">
                  <h4 className="font-medium text-gray-700 mb-2">Перевод:</h4>
                  <p className="p-3 bg-gray-50 rounded text-gray-800">{exercise?.translation}</p>
                </div>
                
                <div className="mb-6">
                  <h4 className="font-medium text-gray-700 mb-2">Пояснение:</h4>
                  <div className="p-4 bg-primary-50 rounded-lg text-gray-700">
                    <p>{exercise?.grammarExplanation}</p>
                  </div>
                </div>
                
                <div className="flex justify-center">
                {(task && nextSeq >=  Number(task.exercisesNumber)) ? 
                  <button
                  onClick={handleComplete}>      
                    Завершить
                    </button>
                     : 
                     <button
                  onClick={handleComplete}>      
                    Следующее
                    </button>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
