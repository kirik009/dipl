import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Exercise, Task } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
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
import { Loader2, Pencil, Trash2, Search, FilePlus } from "lucide-react";
import { useDeleteExercisesMutation, useDeleteTaskMutation } from "@/hooks/use-mutate";

export default function TaskManagement() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(null);
  const itemsPerPage = 10;

  // Fetch exercises
  const { data: tasks, isLoading, error } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    
  });


  // Delete exercise mutation
  const deleteTaskMutation = useDeleteTaskMutation(() => setTaskToDelete(null))

 
  const deleteExercisesMutation = useDeleteExercisesMutation();
  
  const totalPages = tasks ? Math.ceil(tasks.length / itemsPerPage) : 0;
  const paginatedTasks = tasks
    ? tasks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : [];

  const handleDeleteTask = (task: Task) => {
    setTaskToDelete(task);
  };

  const confirmDeleteTask = () => {
    if (taskToDelete) {
      deleteTaskMutation.mutate(taskToDelete.id);
    }
  };

  const handleEditTask = (taskId: number) => {
    navigate(`/admin/tasks/${taskId}/edit`);
  };


  if (isLoading) {
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
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        </div>
        <div className="flex space-x-2">
       
          <Button
          onClick={()=> {deleteExercisesMutation.mutate()}} 
          asChild>
            
            <Link href="/admin/tasks/new">
              <FilePlus className="mr-2 h-4 w-4" />
              Добавить задание
            </Link>
          </Button>
        </div>
      </div>

      {/* Exercises Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Название</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ограничение по времени </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Количество попыток </th>
            
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 w-full ">
         
            {paginatedTasks.map((task) => (
                < >
              <tr key={task.id}>
                <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                  {task.name}
                </td>
                <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                  {task.timeConstraint}
                </td>
                <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                {task.triesNumber}
                </td>
              
            
                <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditTask(task.id)}
                    className="text-primary hover:text-primary-600 mr-2"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTask(task)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            
              </>
            ))} 
          </tbody>
        </table>

      </div>
            
      {/* Empty state */}
      {paginatedTasks.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-md">
          <p className="text-gray-500">Таких упражнений не найдено</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-end">
          
          <div className="flex space-x-1">
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

      {/* Delete Task Confirmation */}
      <AlertDialog 
        open={!!taskToDelete} 
        onOpenChange={(open) => !open && setTaskToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
            <AlertDialogDescription>
            Это действие удалит задание. И его нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отменить</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteTask}
              className="bg-red-500 text-white hover:bg-red-600"
              disabled={deleteTaskMutation.isPending}
            >
              {deleteTaskMutation.isPending ? "Удаление..." : "Удалить задание"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


       
    </div>
  );
}




