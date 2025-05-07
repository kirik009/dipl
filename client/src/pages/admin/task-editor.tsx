import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Exercise, insertExerciseSchema, insertTaskSchema, Task } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { X, Plus, Loader2, ArrowLeft, Pencil, Trash2 } from "lucide-react";
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
import { useCreateTaskMutation, useDeleteExerciseMutation, useUpdateExercisesMutation, useUpdateTaskMutation } from "@/hooks/use-mutate";
type FormValues = z.infer<typeof insertTaskSchema>;

export default function TaskEditor() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(null);
  const isEditing = !!id && id !== "new";
  const {user} = useAuth();
  const [cursorPos, setCursorPos] = useState<number>(0); // Состояние для хранения позиции курсора
  const timeInputRef = useRef<HTMLInputElement | null>(null);


  const { data: exercises, isLoading: isLoadingExercise, error } = isEditing ? useQuery<(Exercise & { topicName: string | null })[]>({
    queryKey: [`/api/task_exercises/${id}`],
    enabled: isEditing,
  }) : 
  useQuery<(Exercise & { topicName: string | null })[]>({
    queryKey: [`/api/new_task_exercises`]
  });
 
  const { data: task} = useQuery<Task>({
    queryKey: [`/api/tasks/${id}`],
    enabled: isEditing,
  });

  const { data: newTask} = useQuery<Task>({
    queryKey: [`/api/NewTask`]
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
  
    const updateExercisesMutation = useUpdateExercisesMutation(newTask, id, isEditing)

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
    // Remove the extra fields we added for UI purposes
    const taskData = {
      ...values,
      exercisesNumber: exercises?.length, // добавляем актуальное значение
    };
    
    if (isEditing) {
      updateTaskMutation.mutate(taskData);
    } else {
      createTaskMutation.mutate(taskData);
    }
    updateExercisesMutation.mutate();
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
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Темы</th>
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
                <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">{exercise.topicName}</td>
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
