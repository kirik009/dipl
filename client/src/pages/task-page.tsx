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
export default function TaskPage() {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  
  const [currentPage, setCurrentPage] = useState(1);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const itemsPerPage = 10;
 
  // Fetch exercises
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
        const response = await fetch(`/api/task_exercises/${id}`);
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
      const data = await res.json(); // здесь data должен быть объектом с id
      return data; 
    },
     onSuccess: (data) => {
      const newProgressId = data.id;
      if (exercise && Array.isArray(exercise)) {
        const exerciseId = exercise[0].id;
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


  const handleSubmit = () => {
    submitMutation.mutate();
    
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
        <p className=" mx-auto w-fit">Ограничение по времени: {task?.timeConstraint ? task.timeConstraint : "не ограничено"}</p>
        <button  className="gap-2"
              
                onClick={handleSubmit}
                >
              
                    Начать тест
                </button>
      </div>

      
      {/* Empty state
      {paginatedTasks.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-md">
          <p className="text-gray-500">No exercises found matching your criteria.</p>
        </div>
      )} */}

  

     
    </div>
    </>
  );
}
