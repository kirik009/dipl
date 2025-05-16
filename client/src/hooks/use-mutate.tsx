import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { AssingedTask, insertExerciseSchema, insertTaskSchema, InsertUser, LoginUserInput, RegisterUserInput, Task, User } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import {  useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useLocation } from "wouter";
import { ConsoleLogWriter } from "drizzle-orm";

type TaskFormValues = z.infer<typeof insertTaskSchema>;

const formSchema = insertExerciseSchema.extend({
  newWord: z.string().optional()
 
});

type ExerciseFormValues = z.infer<typeof formSchema>;

type UserWithoutPassword = Omit<User, 'password'>;


      export function useUpdateTaskMutation(id: string) {
        const [, navigate] = useLocation();
        const { toast } = useToast();
        return useMutation({
          mutationFn: async (data: Partial<Task>) => {
            const res = await apiRequest("PUT", `/api/tasks/${id}`, data);
            return await res.json();
          },
          onSuccess: () => {
            toast({
              title: "Операция выполнена",
              description: "Упражнение успешно обновлено.",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
            navigate("/admin/tasks");
          },
          onError: (error: Error) => {
            toast({
              title: "Обновление не выполнено",
              description: error.message,
              variant: "destructive",
            });
          },
        });
      }

      export function useDeleteExerciseMutation(id: string, isEditing: boolean, onSuccessCallback?: () => void ) {
        const [, navigate] = useLocation();
        const { toast } = useToast();

        return useMutation({
            mutationFn: async (exerciseId: number) => {
              await apiRequest("DELETE", `/api/exercises/${exerciseId}`);
            },
            onSuccess: () => {
              queryClient.invalidateQueries({
                queryKey: [isEditing ? `/api/task_exercises/${id}` : `/api/new_task_exercises`],
              });
              toast({
                title: "Операция выполнена",
                description: "Упражнение успешно одалено.",
              });
              onSuccessCallback?.();
            },
            onError: (error: Error) => {
              toast({
                title: "Удаление не выполнено",
                description: error.message,
                variant: "destructive",
              });
            },
          });
      }

     

      export function useUpdateExerciseMutation(id: string, task_id: string) {
        
        const { toast } = useToast();
        return useMutation({
          mutationFn: async (data: Omit<ExerciseFormValues, "newWord">) => {
            const res = await apiRequest("PUT", `/api/exercises/${id}`, data);
            return await res.json();
          },
          onSuccess: () => {
            queryClient.invalidateQueries({queryKey: [`/api/task_exercises/${task_id}`]});
            toast({
              title: "Операция выполнена",
              description: "Предложение успешно обновлено",
            });
            window.history.back();
          },
          onError: (error: Error) => {
            toast({
              title: "Обновление не выполнено",
              description: error.message,
              variant: "destructive",
            });
          },
        });
      }

      export function useCreateExerciseMutation(task_id: string) {
        const { toast } = useToast();
        return useMutation({
            mutationFn: async (data: Omit<ExerciseFormValues, "newWord">) => {
              data.task_id = Number(task_id)
              
              const res = await apiRequest("POST", "/api/exercises", data);
              return await res.json();
            },
            onSuccess: () => {
              queryClient.invalidateQueries({queryKey: [`/api/task_exercises/${task_id}`]});
              queryClient.invalidateQueries({queryKey: [`/api/new_task_exercises`]});
              toast({
                title: "Операция выполнена",
                description: "Предложение успешно создано.",
              });
              window.history.back()
            },
            onError: (error: Error) => {
              toast({
                title: "Создание не выполнено",
                description: error.message,
                variant: "destructive",
              });
            },
          });
      }

      // export function useDeleteTopicMutation(onSuccessCallback?: () => void) {
      //   const { toast } = useToast();
      //   return  useMutation({
      //       mutationFn: async (taskId: number) => {
      //         await apiRequest("DELETE", `/api/grammar-topics/${taskId}`);
      //       },
      //       onSuccess: () => {
      //         queryClient.invalidateQueries({ queryKey: ["/api/grammar-topics"] });
      //         toast({
      //           title: "Операция выполнена",
      //           description: "Грамматическая тема удалена.",
      //         });
      //         onSuccessCallback?.();
      //       },
      //       onError: (error: Error) => {
      //         toast({
      //           title: "Удаление не выполнено",
      //           description: error.message,
      //           variant: "destructive",
      //         });
      //       },
      //     });
      // }

      // export function useUpdateTopicMutation() {
      //   const { toast } = useToast();
      //   return useMutation({
      //         mutationFn: async ({ id, data }: { id: number; data: InsertGrammarTopic }) => {
                
      //             const res = await apiRequest("PUT", `/api/grammar-topics/${id}`, data);
      //           return await res.json();
      //         },
      //         onSuccess: () => {
      //           toast({
      //             title: "Операция выполнена",
      //             description: "Грамматическая тема успешно обновлена",
      //           });
      //           queryClient.invalidateQueries({ queryKey: ["/api/grammar-topics"] });
             
      //         },
      //         onError: (error: Error) => {
      //           toast({
      //             title: "Обновление не выполнено",
      //             description: error.message,
      //             variant: "destructive",
      //           });
      //         },
      //       });
      // }

      // export function useCreateTopicMutation() {
      //   const { toast } = useToast();
      //   return useMutation({
      //           mutationFn: async () => {
      //             const res = await apiRequest("POST", "/api/grammar-topics");
      //             return await res.json();
      //           },
      //           onSuccess: () => {
      //             queryClient.invalidateQueries({queryKey: ["/api/grammar-topics"]});
      //             toast({
      //               title: "Операция выполнена",
      //               description: "Упражнение успешно создано.",
      //             });
                  
      //           },
      //           onError: (error: Error) => {
      //             toast({
      //               title: "Создание не выполнено",
      //               description: error.message,
      //               variant: "destructive",
      //             });
      //           },
      //         });
      // }


      export function useDeleteExercisesMutation() {
        return useMutation({
          mutationFn: async () => {
            await apiRequest("DELETE", `/api/exercises`);
          },
          onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: [`/api/new_task_exercises`] });
          }
        });
      }

      export function useDeleteTaskMutation(onSuccessCallback?: () => void) {
        const { toast } = useToast();
        return useMutation({
            mutationFn: async (taskId: number) => {
              await apiRequest("DELETE", `/api/tasks/${taskId}`);
            },
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
              toast({
                title: "Операция выполнена",
                description: "Задание успешно удалено.",
              });
              onSuccessCallback?.();
            },
            onError: (error: Error) => {
              toast({
                title: "Удаление не выполнено",
                description: error.message,
                variant: "destructive",
              });
            },
          });
      }

      export function useDeleteUserMutation(onSuccessCallback?: () => void) {
        const {toast} = useToast();
        return useMutation({
            mutationFn: async (userId: number) => {
              await apiRequest("DELETE", `/api/admin/users/${userId}`);
            },
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
              toast({
                title: "Операция выполнена",
                description: "Пользователь успешно удален",
              });
             onSuccessCallback?.();
            },
            onError: (error: Error) => {
              toast({
                title: "Удаление не выполнено",
                description: error.message,
                variant: "destructive",
              });
            },
          });
      }

      export function useUpdateUserMutation(onSuccessCallback: () => void) {
        const {toast} = useToast();
        return useMutation({
          mutationFn: async (user: Partial<UserWithoutPassword>) => {
            const res = await apiRequest("PATCH", `/api/admin/users/${user.id}`, user);
            return await res.json();
          },
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
            toast({
              title: "Операция выполнена",
              description: "Пользователь успешно обновлен",
            });
            onSuccessCallback?.();
          },
          onError: (error: Error) => {
            toast({
              title: "Обновление не выполнено",
              description: error.message,
              variant: "destructive",
            });
          },
        });
      }

      export function useCreateTaskMutation() {
        const [, navigate] = useLocation();
        const assignExercises =  useMutation({
              mutationFn: async (newTaskId: number) => {
              const res = await apiRequest("PUT", `/api/task_exercises/assign/${newTaskId}`);
                return await res.json();
             
              },
              onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
                navigate("/admin/tasks");
              },
              
            });
      
        const { toast } = useToast();
    return useMutation({
    
        mutationFn: async (data: TaskFormValues) => {
          const res = await apiRequest("POST", "/api/tasks", data);
          return await res.json();
        },
        onSuccess: (data) => {
      
          assignExercises.mutate(data.id);
         
        },
        onError: (error: Error) => {
          
          toast({
            title: "Создание не выполнено",
            description: error.message,
            variant: "destructive",
          });
        },
      });
    }
        export function useAssignMutation() {
          const {toast} = useToast();
          return useMutation({
            mutationFn: async (data: Partial<AssingedTask>) => {
              const res = await apiRequest("POST", `/api/assignedTasks`, data);
              
              return await res.json();
            },
          
            onError: (error: Error) => {
              toast({
                title: "Назначение не выполнено",
                description: error.message,
                variant: "destructive",
              });
            },
          });
        }


        export function useUpdateAssignedTaskMutation() {
          const {toast} = useToast();
          return useMutation({
            mutationFn: async (data: Partial<AssingedTask>) => {
              const res = await apiRequest("PUT", `/api/assignedTasks/${data.id}`, data);
              return await res.json();
            },
           
            onError: (error: Error) => {
              toast({
                title: "Обновление не выполнено",
                description: error.message,
                variant: "destructive",
              });
            },
          });
        }

              export function useDeleteAssignedTaskMutation() {
        const {toast} = useToast();
        return useMutation({
            mutationFn: async (id: number) => {
              await apiRequest("DELETE", `/api/assignedTasks/${id}`);
            },
         
            onError: (error: Error) => {
              toast({
                title: "Операция не выполнена",
                description: error.message,
                variant: "destructive",
              });
            },
          });
        }


           export function useCreateUserMutation() { 
            const {toast} = useToast();
            return useMutation({
            mutationFn: async (userData: InsertUser) => {
            
              const res = await apiRequest("POST", "/api/createUser", userData);
              return await res.json();
            },
            onSuccess: (user: Omit<User, 'password'>) => {
              queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
            },
            onError: (error: Error) => {
              toast({
                title: "Операция не выполнена",
                description: error.message,
                variant: "destructive",
              });
            },
          });
        }