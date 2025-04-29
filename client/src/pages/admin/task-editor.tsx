import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Exercise, insertExerciseSchema, insertTaskSchema, Task } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus, Loader2, ArrowLeft, Pencil, Trash2 } from "lucide-react";

type FormValues = z.infer<typeof insertTaskSchema>;

export default function TaskEditor() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [wordInput, setWordInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(null);
  const isEditing = !!id && id !== "new";
  
  const [cursorPos, setCursorPos] = useState<number>(0); // Состояние для хранения позиции курсора
  const timeInputRef = useRef<HTMLInputElement | null>(null);

  const { data: exercises, isLoading: isLoadingExercise, error } = useQuery<Exercise[]>({
    queryKey: [`/api/task_exercises/${id}`],
  });
  
  const { data: task} = useQuery<Task>({
    queryKey: [`/api/tasks/${id}`],
    enabled: isEditing,
  });
  
  // Form definition
  const form = useForm<FormValues>({
    resolver: zodResolver(insertTaskSchema),
    defaultValues: {
      name: "",
      triesNumber:0,
      timeConstraint: "0",
    }
  });
  
  // Update form values when exercise data is loaded
  useEffect(() => {
    if (task) {
      form.reset({
        ...task
      });
    }
  }, [task, form]);
  
  // Create exercise mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("POST", "/api/tasks", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Task created",
        description: "The task has been successfully created.",
      });
      navigate("/tasks");
    },
    onError: (error: Error) => {
      toast({
        title: "Creation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update exercise mutation
  const updateTaskMutation =  useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("PUT", `/api/tasks/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Exercise updated",
        description: "The exercise has been successfully updated.",
      });
      navigate("/tasks");
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
   
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      await apiRequest("DELETE", `/api/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task deleted",
        description: "The task has been successfully deleted.",
      });
      setTaskToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Deletion failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

    const deleteExerciseMutation = useMutation({
      mutationFn: async (exerciseId: number) => {
        await apiRequest("DELETE", `/api/exercises/${exerciseId}`);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
        toast({
          title: "Exercise deleted",
          description: "The exercise has been successfully deleted.",
        });
        setExerciseToDelete(null);
      },
      onError: (error: Error) => {
        toast({
          title: "Deletion failed",
          description: error.message,
          variant: "destructive",
        });
      },
    });

    const handleDeleteTask = (task: Task) => {
      setTaskToDelete(task);
    };
  
  
    const handleEditExercise = (exerciseId: number) => {
      navigate(`/admin/exercises/${exerciseId}/edit`);
    };

      const handleDeleteExercise = (exercise: Exercise) => {
        setExerciseToDelete(exercise);
      };
    
      const confirmDeleteExercise = () => {
        if (exerciseToDelete) {
          deleteExerciseMutation.mutate(exerciseToDelete.id);
        }
      };
    
  // Handle form submission
  const onSubmit = (values: FormValues) => {
    // Remove the extra fields we added for UI purposes
    const {...taskData } = values;
    
    if (isEditing) {
      updateTaskMutation.mutate(taskData);
    } else {
      createTaskMutation.mutate(taskData);
    }
  };
  
  const isLoading = isLoadingExercise;
  
 
  function formatToTimeString(value: string): string {
    // Удаляем всё кроме цифр
    const digitsOnly = value.replace(/\D/g, "").slice(0, 6); // не больше 6 цифр
    const parts: string[] = digitsOnly.match(/.{1,2}/g) || [];
  
    // Добавляем нули, если не хватает
    while (parts.length < 3) {
      parts.unshift("00");
    }
  
    return parts.map(part => part.padStart(2, "0")).join(":");
  }
  
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatToTimeString(raw);
    form.setValue("timeConstraint", formatted); // обновляем значение формы

    // Сохраняем позицию курсора до обновления
    let cursorPosition = e.target.selectionStart || 0;
    if (cursorPosition == 2 || cursorPosition == 5) {
    setCursorPos(cursorPosition + 1);
    console.log(cursorPosition)
      cursorPosition += 1
  }
    else setCursorPos(cursorPosition);
    // Обновляем значение в input
    setTimeout(() => {
      if (timeInputRef.current) {
        // Восстанавливаем позицию курсора
        timeInputRef.current.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 0);
  };

  const handleFocus = () => {
    if (timeInputRef.current) {
      // Используем setTimeout с нулевой задержкой, чтобы установить курсор в начало сразу после рендера
      setTimeout(() => {
        if (timeInputRef.current) {
          timeInputRef.current.setSelectionRange(0, 0); // Устанавливаем курсор в начало
        }
      }, 0);
    }
  };
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div>
      <div className="bg-gray-100 px-6 py-4 flex items-center border-b border-gray-200">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/exercises")} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Exercises
        </Button>
        <h2 className="text-xl font-semibold">
          {isEditing ? "Edit Exercise" : "Create New Exercise"}
        </h2>
      </div>
      
      <div className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
          
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter the Russian translation" />
                  </FormControl>
                  
                  <FormMessage />
                </FormItem>
              )}
            />

<FormField
              control={form.control}
              name="triesNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Количество попыток </FormLabel>
                  <FormControl>
                    <Input type="number"{...field} placeholder="Введите 0, если хотите неограниченное количество попыток" />
                  </FormControl>
                  
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="timeConstraint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ограничение по времени </FormLabel>
                  <FormControl>
                <Input
                  onFocus={handleFocus}
                  ref={timeInputRef}
                  value={field.value}
                  onChange={(e) => handleTimeChange(e)} // Обработчик изменения времени
                  placeholder="Введите 00:00:00, если хотите неограниченное время"
                />
              </FormControl>
                  
                  <FormMessage />
                </FormItem>
              )}
            />
            
   
            
          {/* Exercises Table */}
     {exercises!= undefined && exercises!=null && exercises.length > 0 && 
       
     <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Перевод</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Предложение</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Темы</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сложность</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {exercises.map((exercise) => (
              <tr key={exercise.id}>
                <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">{exercise.id}</td>
                <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                  {exercise.translation}
                </td>
                <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                  {exercise.correctSentence}
                </td>
                <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">{exercise.grammarTopic_id}</td>
                <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      exercise.difficulty === "beginner"
                        ? "bg-green-100 text-green-800"
                        : exercise.difficulty === "intermediate"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    {exercise.difficulty}
                  </span>
                </td>
                <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditExercise(exercise.id)}
                    className="text-primary hover:text-primary-600 mr-2"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteExercise(exercise)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
}
  <Button
    type="submit"
    onClick={() => navigate("/admin/exercises/new")}
    >
      Добавить пример
  </Button>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/tasks")}
                className="mr-2"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
              >
                {createTaskMutation.isPending || updateTaskMutation.isPending
                  ? "Сохранение..."
                  : isEditing
                  ? "Обновить упражнение"
                  : "Создать упражнение"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
