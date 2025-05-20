import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Exercise, insertTaskSchema, Task } from "@shared/schema";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCreateTaskMutation, useDeleteExerciseMutation, useUpdateTaskMutation } from "@/hooks/use-mutate";
import { queryClient } from "@/lib/queryClient";
type FormValues = z.infer<typeof insertTaskSchema>;

export default function TaskEditor() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(null);
  const isEditing = !!id && id !== "new";
  const {user} = useAuth();
  const [cursorPos, setCursorPos] = useState<number>(0); // Состояние для хранения позиции курсора
  const timeInputRef = useRef<HTMLInputElement | null>(null);


  const { data: exercises, isLoading: isLoadingExercise, error } = isEditing ? useQuery<(Exercise)[]>({
    queryKey: [`/api/task_exercises/${id}`],
    enabled: isEditing,
  }) : 
  useQuery<Exercise[]>({
    queryKey: [`/api/new_task_exercises/${user?.id}`],
  });
 
  const { data: task, isLoading: isLoadingTask, error: taskError } = useQuery<Task>({
    queryKey: [`/api/tasks/${id}`],
    enabled: isEditing,
  });


  const { data: allTasks, isLoading: tasksLoading, error: tasksError } = useQuery<Task[]>({
  queryKey: ["/api/tasks"],
});
  // Form definition
  const form = useForm<FormValues>({
    resolver: zodResolver(insertTaskSchema),
    defaultValues: {
      name: "",
      triesNumber:0,
      timeConstraint: "00:00:00",
      createdBy: user?.id,
      exercisesNumber: exercises?.length,
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

  useEffect(() => {
  const subscription = form.watch((values) => {
    localStorage.setItem(`taskForm-${id ?? "new"}`, JSON.stringify(values));
  });
  return () => subscription.unsubscribe();
}, [form, id]);

useEffect(() => {
  const saved = localStorage.getItem(`taskForm-${id ?? "new"}`);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      form.reset(parsed);
    } catch (err) {
      console.error("Не удалось восстановить сохранённые данные формы", err);
    }
  } else if (task) {
    form.reset(task); 
  }
}, [task, form, id]);
  
   

  const updateTaskMutation =  useUpdateTaskMutation(id);
  
    const createTaskMutation = useCreateTaskMutation();
  const deleteExerciseMutation = useDeleteExerciseMutation(id, isEditing,  () => setExerciseToDelete(null))
  
  
    const handleEditExercise = (exerciseId: number) => {
      navigate(`/admin/tasks/${id}/exercises/${exerciseId}/edit`);
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
  
  if (allTasks?.some(task => task.name.trim().toLowerCase() === values.name.trim().toLowerCase() && task.id !== Number(id))) {
  form.setError("name", { message: "Задание с таким названием уже существует" });
  return;
}
  if (!values.name.trim()) {
    form.setError("name", { message: "Название обязательно" });
    return;
  }

  if (!exercises || exercises.length === 0) {
    toast({
      title: "Ошибка",
      description: "Добавьте хотя бы одно предложение перед сохранением.",
      variant: "destructive",
    });
    return;
  }
localStorage.removeItem(`taskForm-${id ?? "new"}`);
  const taskData = {
    ...values,
    exercisesNumber: exercises.length,
  };
 
  if (isEditing) {
    updateTaskMutation.mutate(taskData);
  } else {
    
    createTaskMutation.mutate(taskData);
    queryClient.invalidateQueries({ queryKey: [`/api/newTask/${user?.id}`] }); 
    queryClient.invalidateQueries({ queryKey: ["/api/tasks"] }); 
     
    
 }
    
  window.history.back();
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
  if (isLoading || isLoadingExercise || tasksLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div>
      <div className="bg-gray-100 px-6 py-4 flex items-center border-b border-gray-200">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/tasks")} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад
        </Button>
        <h2 className="text-xl font-semibold">
          {isEditing ? "Редактирование упражнения" : "Создание нового упражнения"}
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
                    <Input {...field} placeholder="Введите название" />
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
                    <Input type="number"{...field} 
                     onChange={(e) => field.onChange(Number(e.target.value))}
                     placeholder="Введите 0, если хотите неограниченное количество попыток" />
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
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">№</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Перевод</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Предложение</th>
        
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {exercises.map((exercise, index) => (
              <tr key={exercise.id}>
                <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                  {exercise.translation}
                </td>
                <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                  {exercise.correctSentence}
                </td>
                
                <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { handleEditExercise(exercise.id)}}
                    className="text-primary hover:text-primary-600 mr-2"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                  type="button"
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
    type="button"
     onClick={() => navigate(`/admin/tasks/${id}/exercises/new`)}
    >
      Добавить пример
  </Button>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/tasks")}
                className="mr-2"
              >
                Отменить
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



      {/* Delete Task Confirmation */}
            <AlertDialog 
              open={!!exerciseToDelete} 
              onOpenChange={(open) => !open && setExerciseToDelete(null)}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Это действие удалить предложение. И его нельзя отменить.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отменить</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={confirmDeleteExercise}
                    className="bg-red-500 text-white hover:bg-red-600"
                    disabled={deleteExerciseMutation.isPending}
                  >
                    {deleteExerciseMutation.isPending ? "Удаление..." : "Удалить предложение"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
      
    </div>
  );
}
