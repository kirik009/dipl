  import { useEffect, useState } from "react";
  import { useQuery, useMutation, useQueries } from "@tanstack/react-query";
  import { AssingedTask, Exercise, ExerciseProgress, InsertUser, registerUserSchema, Task, TaskProgress, User } from "@shared/schema";
  import { apiRequest, queryClient } from "@/lib/queryClient";
  import { useToast } from "@/hooks/use-toast";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog";
  import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog";
  import { Loader2, Pencil, Trash2, Search, UserPlus, CheckCircle, XCircle } from "lucide-react";
  import { useAssignMutation, useCreateUserMutation, useDeleteAssignedTaskMutation, useDeleteUserMutation,  useUpdateAssignedTaskMutation,  useUpdateUserMutation } from "@/hooks/use-mutate";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";


  type UserWithoutPassword = Omit<User, 'password'>;

  export default function UserManagement() {
     const { user } = useAuth();
     const [searchTerm, setSearchTerm] = useState("");
     
    const [searchQuery, setSearchQuery] = useState("");

    const [roleFilter, setRoleFilter] = useState("user");
    const [currentPage, setCurrentPage] = useState(1);
    const [userToDelete, setUserToDelete] = useState<UserWithoutPassword | null>(null);
    const [userToEdit, setUserToEdit] = useState<UserWithoutPassword | null>(null);
    const [userToAddTask, setUserToAddTask] = useState<UserWithoutPassword | null>(null);
     const [userToCreate, setUserToCreate] = useState<InsertUser | null>(null);
    const itemsPerPage = 10;
    
    const [selectedExercises, setSelectedExercises] = useState<
    { exerciseId: number; dueDate: string }[]
  >([]);
    const [selectedExercisesToDelete, setSelectedExercisesToDelete] = useState<
    { id: number}[]
  >([]);

  

  const { data: assignedTasks, isLoading: assignedLoading } = useQuery<(AssingedTask & { taskName: string | null } & {authorName: string | null })[]>(
  {
    queryKey: [`/api/assignedTasks/${userToAddTask?.id}`],
 
  }
);

  const { data: assignedSolvedTasks, isLoading: assignedSolvedLoading } = useQuery<(AssingedTask & { taskName: string | null } & {authorName: string | null })[]>(
  {
    queryKey: [`/api/assignedSolvedTasks/${Number(userToAddTask?.id || 0)}`],
 
  }
);
  const { data: assignedExpiredTasks, isLoading: assignedExpiredLoading } = useQuery<(AssingedTask & { taskName: string | null } & {authorName: string | null })[]>(
  {
    queryKey: [`/api/assignedExpiredTasks/${Number(userToAddTask?.id || 0)}`],
 
  }
);

const queries = assignedSolvedTasks?.map((task) => ({
    queryKey: [`/api/task_prog/${task.taskId}/${userToAddTask?.id}`],
    queryFn: async (): Promise<({exercisesNumber: number | null} & TaskProgress)[]> => {
      const res = await fetch(`/api/task_prog/${task.taskId}/${userToAddTask?.id}`);
      if (!res.ok) throw new Error("Failed to fetch task progress");
      return res.json();
    },
    enabled: !!userToAddTask?.id,
  })) || [];
  const results = useQueries({queries})
    const { data: users, isLoading, error } = useQuery<UserWithoutPassword[]>({
      queryKey: ["/api/admin/users"],
    });
    const { data: tasks } = useQuery<Task[]>({
      queryKey: ["/api/tasks"],
    });

    
    // Delete user mutation
    const deleteUserMutation = useDeleteUserMutation( () => setUserToDelete(null))

    // Update user mutation
    const updateUserMutation = useUpdateUserMutation(() => setUserToEdit(null))
    const assignMutation = useAssignMutation();
    const updateAssignedTaskMutation = useUpdateAssignedTaskMutation();
    const deleteAssignedTaskMutation = useDeleteAssignedTaskMutation();
    
    const handleUpdateAssignedTask = (assignmentId: number, updatedData: { dueDate?: Date }) => {
  updateAssignedTaskMutation.mutate({
    id: assignmentId,
    ...updatedData,
  },
{onSuccess: () => {queryClient.invalidateQueries({ queryKey: [`/api/assignedTasks/${userToAddTask?.id}`] });}}
);
};


    const handleAssign = (e: React.FormEvent) => {
      e.preventDefault();
      if (!userToAddTask) return;
      
      selectedExercises.forEach(({ exerciseId, dueDate }) => {
        
        assignMutation.mutate({assignedBy: user?.id, userId: userToAddTask.id, taskId: exerciseId, dueDate: new Date(dueDate) }, 
        {onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: [`/api/assignedTasks/${userToAddTask?.id}`] });
      setUserToAddTask(null)}});
      });
        selectedExercisesToDelete.forEach(({ id }) => {
        
        deleteAssignedTaskMutation.mutate(id, {onSuccess: () => {queryClient.invalidateQueries({ queryKey: [`/api/assignedTasks/${userToAddTask?.id}`] });}});
      });
      setSelectedExercisesToDelete([]);
      setSelectedExercises([]);
      setUserToAddTask(null);
    };

    const filteredUsers = users
      ? users.filter((user) => {
          const matchesSearch =
            user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.fullName.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesRole = roleFilter === "all" || user.role === roleFilter;

          return matchesSearch && matchesRole;
        })
      : [];

    // Handle pagination
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const paginatedUsers = filteredUsers.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );

    const handleDeleteUser = (user: UserWithoutPassword) => {
      setUserToDelete(user);
    };

    const confirmDeleteUser = () => {
      if (userToDelete) {
        deleteUserMutation.mutate(userToDelete.id);
      }
    };

    const handleEditUser = (userToEdit: UserWithoutPassword) => {
      if (user?.role === 'admin') setUserToEdit(userToEdit);
      else if (user?.role ==='teacher') {
        setUserToAddTask(userToEdit)
      // queryClient.invalidateQueries({queryKey: [`api/assignedTasks/${userToEdit.id}`]});
      };
    };

    const handleUpdateUser = (e: React.FormEvent) => {
      e.preventDefault();
      if (userToEdit) {
        updateUserMutation.mutate(userToEdit);
      }
    };



    const getInitials = (name: string) => {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("");
    };
const pad = (n: number) => String(n).padStart(2, "0");

// Получаем локальное время в формате "YYYY-MM-DDTHH:mm"
const getLocalDateTimeForMin = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1); // Месяцы с 0
  const day = pad(now.getDate());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};


const createUserMutation = useCreateUserMutation();
const handleCreateUser = (e: React.FormEvent) => {
      e.preventDefault();
     if (userToCreate) 
    createUserMutation.mutate(
      userToCreate  
    );
    setUserToCreate(null);
  };
    if (isLoading || assignedSolvedLoading || assignedExpiredLoading || assignedLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="py-12 text-center">
          <p className="text-red-500">{(error as Error).message}</p>
        </div>
      );
    }

    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-64">
            <Input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
          <div className="flex space-x-2">
              {user?.role === 'admin' &&
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все роли</SelectItem>
                <SelectItem value="user">Студент</SelectItem>
                <SelectItem value="teacher">Преподаватель</SelectItem>
                <SelectItem value="admin">Администратор</SelectItem>
              </SelectContent>
            </Select>
  }
            {user?.role === 'admin' &&
            <Dialog open={!!userToCreate} onOpenChange={(open) => !open && setUserToCreate(null)}>
              <DialogTrigger asChild>
                <Button onClick={() => setUserToCreate({ fullName: "", username: "", role: "user", password: "" })}>
                <UserPlus className="mr-2 h-4 w-4" />
                Добавить пользователя
              </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Создание нового пользователя</DialogTitle>
                  
                </DialogHeader>
                {
                  userToCreate && 
                  <form onSubmit={handleCreateUser} className="space-y-4 py-4">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <label htmlFor="create-fullName" className="text-sm font-medium">
            Полное имя
          </label>
          <Input
            id="create-fullName"
            value={userToCreate?.fullName}
            onChange={(e) =>
                        setUserToCreate({ ...userToCreate, fullName: e.target.value })
                      }
            placeholder="John Doe"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="create-nickName" className="text-sm font-medium">
            Никнейм
          </label>
          <Input
            id="create-nickName"
            value={userToCreate?.username}
            onChange={(e) =>
                        setUserToCreate({ ...userToCreate, username: e.target.value })
                      }
            placeholder="johndoe"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="create-role" className="text-sm font-medium">
            Роль
          </label>
          <Select value={userToCreate?.role} onValueChange={(value) =>
                        setUserToCreate({ ...userToCreate, role: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите роль" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">Студент</SelectItem>
              <SelectItem value="teacher">Преподаватель</SelectItem>
              <SelectItem value="admin">Администратор</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label htmlFor="create-password" className="text-sm font-medium">
            Пароль
          </label>
          <Input
            type="password"
            id="create-password"
            value={userToCreate?.password}
            onChange={(e) =>
                        setUserToCreate({ ...userToCreate, password: e.target.value })}
            placeholder="••••••••"
          />
        </div>
      </div>

      <button
        type="submit"
        className="mt-4 bg-primary text-white px-4 py-2 rounded hover:bg-primary/90"
      >
        Создать пользователя
      </button>
    </form>
  }
               
              </DialogContent>
            </Dialog>
  }
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Имя</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Никнейм</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Роль</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedUsers.map((userr) => (
                <tr key={userr.id}>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-500 font-medium">
                        {getInitials(userr.fullName)}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{userr.fullName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">{userr.username}</td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        userr.role === "admin"
                          ? "bg-red-100 text-red-800"
                          : userr.role === "teacher"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {userr.role === "user" ? "Студент" : userr.role === "teacher" ? "Преподаватель" : "Администратор"}
                    </span>
                  </td>
      
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">
                    <Button
                      variant="ghost"
                      size="sm"
                      
                      onClick={() => {
                        
                        handleEditUser(userr)}}
                      
                      className="text-primary hover:text-primary-600 mr-2"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {user?.role === "admin" && 
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteUser(userr)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
  }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-end">
           
            <div className="flex space-x-1 items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Назад
              </Button>
              {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => {
                const pageNumber = currentPage > 2 && totalPages > 3 ? currentPage - 1 + i : i + 1;
                return pageNumber <= totalPages ? (
                  <Button
                    key={pageNumber}
                    variant={pageNumber === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNumber)}
                  >
                    {pageNumber}
                  </Button>
                ) : null;
              })}
              {totalPages > 3 && currentPage < totalPages - 1 && (
                <Button variant="outline" size="sm" disabled>
                  ...
                </Button>
              )}
              {totalPages > 3 && currentPage < totalPages - 1 && (
                <Button
                  variant={totalPages === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                >
                  {totalPages}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Дальше
              </Button>
            </div>
          </div>
        )}

        {/* Edit User Dialog */}
        <Dialog open={!!userToEdit} onOpenChange={(open) => !open && setUserToEdit(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Обновление пользователя</DialogTitle>
              
            </DialogHeader>
            {userToEdit && (
              <form onSubmit={handleUpdateUser} className="space-y-4 py-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="edit-fullName" className="text-sm font-medium">
                      Полное имя
                    </label>
                    <Input
                      id="edit-fullName"
                      value={userToEdit.fullName}
                      onChange={(e) =>
                        setUserToEdit({ ...userToEdit, fullName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="edit-username" className="text-sm font-medium">
                      Никнейм
                    </label>
                    <Input
                      id="edit-username"
                      value={userToEdit.username}
                      onChange={(e) =>
                        setUserToEdit({ ...userToEdit, username: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="edit-role" className="text-sm font-medium">
                      Роль
                    </label>
                    <Select
                      value={userToEdit.role}
                      onValueChange={(value) =>
                        setUserToEdit({ ...userToEdit, role: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Студент</SelectItem>
                        <SelectItem value="teacher">Преподаватель</SelectItem>
                        <SelectItem value="admin">Администратор</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={updateUserMutation.isPending}
                  >
                    {updateUserMutation.isPending ? "Updating..." : "Update User"}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete User Confirmation */}
        <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
              <AlertDialogDescription>
              Это действие удалит аккаунт у {" "}
                <span className="font-semibold">{userToDelete?.fullName}</span>. Это действие нельзя отменить.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отменить</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteUser}
                className="bg-red-500 text-white hover:bg-red-600"
                disabled={deleteUserMutation.isPending}
              >
                {deleteUserMutation.isPending ? "Удаление..." : "Удалить пользователя"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

            {/* Edit User Dialog */}
             <Dialog open={!!userToAddTask} onOpenChange={(open) => {!open && setUserToAddTask(null)
              queryClient.invalidateQueries({ queryKey: [`/api/assignedExpiredTasks/${userToAddTask?.id}`] });
              queryClient.invalidateQueries({ queryKey: [`/api/assignedSolvedTasks/${userToAddTask?.id}`] });
              queryClient.invalidateQueries({ queryKey: [`/api/assignedTasks/${userToAddTask?.id}`] });
             }
              
             }>
          <DialogContent className="max-h-[80vh] overflow-y-auto">
         { userToAddTask &&  (
       
  <form onSubmit={handleAssign} className="space-y-4 py-4">
   
    <div className="grid grid-cols-1 gap-4">

      {/* Информация о пользователе */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Полное имя</label>
        <p className="text-sm">{userToAddTask.fullName}</p>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Никнейм</label>
        <p className="text-sm">{userToAddTask.username}</p>
      </div>
 <div className="space-y-2">
  <label className="text-sm font-medium">Поиск заданий</label>
  <Input
    type="text"
    placeholder="Введите название задания"
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />
</div>
     {assignedTasks && assignedTasks.length > 0 && (
       
     
        <div className="space-y-2">
          <h3 className="font-semibold">Назначенные задания</h3>
          {assignedTasks?.filter(task => (task.taskName?.toLowerCase().includes(searchTerm.toLowerCase() )))
          .map((task) => {
             const selected = selectedExercisesToDelete.find(e => e.id === task.id);
            return (
            <>
            <div key={task.id} className="border p-3 rounded-md space-y-2">
              <div className="flex justify-between items-center">
                <span>{task.taskName}</span>
      <input
  type="checkbox"
  checked={!!selected}
  onChange={(e) => {
    if (e.target.checked) {
      setSelectedExercisesToDelete(prev => [...prev, { id: task.id }]);
    } else {
      setSelectedExercisesToDelete(prev => prev.filter(ex => ex.id !== task.id));
    }
  }}
  className={cn(
    "appearance-none w-5 h-5 border border-gray-400 rounded-sm bg-white",
    "checked:bg-red-500 checked:border-red-500",
    "relative",
    "checked:after:content-['✕'] checked:after:text-white checked:after:absolute checked:after:inset-0 checked:after:flex checked:after:items-center checked:after:justify-center checked:after:text-sm"
  )}
/>
              </div>
             
            </div>
            </>
          )
  })}
        </div>
     )
         }


              {assignedExpiredTasks && assignedExpiredTasks.length > 0 && (
       
     
        <div className="space-y-2">
          <h3 className="font-semibold">Просроченные задания</h3>
          {assignedExpiredTasks?.filter(task => (task.taskName?.toLowerCase().includes(searchTerm.toLowerCase() )))
          .map((task) => {
             const selected = selectedExercisesToDelete.find(e => e.id === task.id);
            return (
            <>
            <div key={task.id} className="border p-3 rounded-md space-y-2">
              <div className="flex justify-between items-center">
                <span>{task.taskName}</span>
      <input
  type="checkbox"
  checked={!!selected}
  onChange={(e) => {
    if (e.target.checked) {
      setSelectedExercisesToDelete(prev => [...prev, { id: task.id }]);
    } else {
      setSelectedExercisesToDelete(prev => prev.filter(ex => ex.id !== task.id));
    }
  }}
  className={cn(
    "appearance-none w-5 h-5 border border-gray-400 rounded-sm bg-white",
    "checked:bg-red-500 checked:border-red-500",
    "relative",
    "checked:after:content-['✕'] checked:after:text-white checked:after:absolute checked:after:inset-0 checked:after:flex checked:after:items-center checked:after:justify-center checked:after:text-sm"
  )}
/>
              </div>
             
            </div>
            </>
          )
  })}
        </div>
     )
         }



              {assignedSolvedTasks && assignedSolvedTasks.length > 0 && (
       
     
        <div className="space-y-2">
          <h3 className="font-semibold">Решенные задания</h3>
          {assignedSolvedTasks?.filter(task => (task.taskName?.toLowerCase().includes(searchTerm.toLowerCase() )))
          .map((task) => {
             const selected = selectedExercisesToDelete.find(e => e.id === task.id);
            return (
            <>
            <div key={task.id} className="border p-3 rounded-md space-y-2">
              <div className="flex justify-between items-center">
                <span>{task.taskName}</span>
      <input
  type="checkbox"
  checked={!!selected}
  onChange={(e) => {
    if (e.target.checked) {
      setSelectedExercisesToDelete(prev => [...prev, { id: task.id }]);
    } else {
      setSelectedExercisesToDelete(prev => prev.filter(ex => ex.id !== task.id));
    }
  }}
  className={cn(
    "appearance-none w-5 h-5 border border-gray-400 rounded-sm bg-white",
    "checked:bg-red-500 checked:border-red-500",
    "relative",
    "checked:after:content-['✕'] checked:after:text-white checked:after:absolute checked:after:inset-0 checked:after:flex checked:after:items-center checked:after:justify-center checked:after:text-sm"
  )}
/>
              </div>
             
               <div>
                <label className="text-sm block mb-1">Результаты:</label> 
                   <div className="flex flex-col gap-4 mt-2">
            {results && results.map((taskProgs) => (
              
              <div  className="flex gap-4">
                
                <div className="p-2 rounded flex-1">
                  <p>
                    {taskProgs.data?.map((taskProg, index) => (
                      <div className="p-2 rounded w-64">
                  <p className="font-bold mb-2">Попытка {index + 1}</p>
                  <p>
                    <strong>Правильных ответов:</strong> {taskProg.correctAnswers}/{taskProg.exercisesNumber}
                  </p>
                </div>
                
                    ))}
                   </p> 
                </div>
              </div>
            ))}
          </div>
              </div>
            </div>
            </>
          )
  })}
        </div>
     )
         }




      {/* Список доступных заданий для назначения */}
      {tasks
  ?.filter(task => !assignedTasks?.some(assigned => assigned.taskId === task.id))
  .filter(task => !assignedSolvedTasks?.some(assigned => assigned.taskId === task.id))
.filter(task => !assignedExpiredTasks?.some(assigned => assigned.taskId === task.id))
.filter(task => task.name.toLowerCase().includes(searchTerm.toLowerCase()))
  .map(task => {
    const selected = selectedExercises.find(e => e.exerciseId === task.id);
    return (
      <div key={task.id} className="border p-3 rounded-md space-y-2">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={!!selected}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedExercises(prev => [...prev, { exerciseId: task.id, dueDate: "" }]);
              } else {
                setSelectedExercises(prev => prev.filter(e => e.exerciseId !== task.id));
              }
            }}
          />
          <span>{task.name}</span>
        </div>

        {selected && (
          <div className="pl-6">
            <label className="text-sm block mb-1">Срок сдачи:</label>
            <Input
              type="datetime-local"
              min={getLocalDateTimeForMin()}
              value={selected.dueDate}
              onChange={(e) => {
                setSelectedExercises(prev =>
                  prev.map(item =>
                    item.exerciseId === task.id
                      ? { ...item, dueDate: e.target.value }
                      : item
                  )
                );
              }}
            />
          </div>
        )}
      </div>
    );
  })}
    </div>

    <DialogFooter>
      <Button type="submit" disabled={assignMutation.isPending}>
        {assignMutation.isPending ? "Назначение..." : "Назначить задания"}
      </Button>
    </DialogFooter>
  </form>
)}
  </DialogContent>
</Dialog>

        
      </div> 
    );
  }