import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Exercise, Task, TaskProgress } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { toast, useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation, useParams } from "wouter";
import { Navbar } from "@/components/layout/navbar";


import { Loader2, Pencil, Trash2, Search, FilePlus } from "lucide-react";
import { query } from "express";
export default function TaskPage() {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
 

  const { data: task, isLoading, error } = useQuery<Task>({
    queryKey: [`/api/tasks/${id}`],
    queryFn: async () => {
        const response = await fetch(`/api/tasks/${id}`);
        if (!response.ok) throw new Error("Failed to fetch tasks");
        return response.json();
      },
  });

  const { data: exercise } = useQuery<Exercise>({
    queryKey: [`/api/task_exercises/${id}/seq/${0}`],
    queryFn: async () => {
        const response = await fetch(`/api/task_exercises/${id}/seq/${0}`);
        if (!response.ok) throw new Error("Failed to fetch exercises");
        return response.json();
      },
  });


  const submitMutation = useMutation({
    mutationFn: async () => {   
      const res = await apiRequest("POST", `/api/tasks/prog`, {
        correctAnswers: 0,
        userId: Number(user?.id),
        taskId: Number(id),
      });
      const data = await res.json();
      return data; 
    },
     onSuccess: (data) => {
      const newProgressId = data.id;
      if (exercise) {
        const exerciseId = exercise.id;
         if (task?.exercisesNumber){
      for (let i = 0; i < task?.exercisesNumber; i++)  {
        submitProgressMutation.mutate(newProgressId);}

    }
    
        queryClient.invalidateQueries({queryKey: [`/api/last_task_prog/${user?.id}`]});
        queryClient.invalidateQueries({queryKey: [`/api/task_prog/${newProgressId}`]});
        queryClient.invalidateQueries({queryKey: [`/api/exercises/${exerciseId}`]});
        
        navigate(`${id}/prog/${newProgressId}/exercises/${exerciseId}/seq/${0}`);
        
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
    mutationFn: async (newProgressId: number) => {
     
      const res = await apiRequest("POST", "/api/exercises/submit", {
        
        userId: user?.id,
        taskProgressId: newProgressId,
      });
      return await res.json();
    },
    onSuccess: (newProgressId: number) => {
      queryClient.invalidateQueries({ queryKey: [`/api/task_exercises_prog/${newProgressId}`]});
    },
      onError: (error: Error) => {
      toast({
        title: "Ошибка при отправке задания",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  const handleSubmit = () => {
    submitMutation.mutate();
   
    
    const [hours, minutes, seconds] = task?.timeConstraint ? task?.timeConstraint.split(":").map(Number) : [0, 0, 0];
    const durationMs = ((hours * 60 + minutes) * 60 + seconds) * 1000;
    const date = task ? new Date(task?.createdAt): new Date()
    const date2 = task ? new Date(date.getTime() - durationMs): new Date()
    const timeLeft = task ? (date.getTime() -  date2.getTime() ) : 0;
    localStorage.setItem("timeLeft", timeLeft.toString());    
  };


  if (isLoading) {
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
        <p className=" mx-auto w-fit">{task?.name}</p>
        <p className="mx-auto w-fit">Количество попыток: {task?.triesNumber ? task.triesNumber : "не ограничено"}</p>
        <p className=" mx-auto w-fit">Ограничение по времени: {task?.timeConstraint !== "00:00:00" ? task?.timeConstraint : "не ограничено"}</p>
        <button  className="h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90"
              
                onClick={handleSubmit}
                >             
                    Начать тест
                </button>
      </div>     
    </div>
    </>
  );
}
