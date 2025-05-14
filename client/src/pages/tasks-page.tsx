import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AssingedTask, Exercise, ExerciseProgress, Task, TaskProgress } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { Navbar } from "@/components/layout/navbar";

import { Loader2, Pencil, Trash2, Search, FilePlus } from "lucide-react";
import { navigate } from "wouter/use-browser-location";
import { array } from "zod";
export default function TasksPage() {
    const { user} = useAuth();
  const [activeTab, setActiveTab] = useState<"all" | "assigned">("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [currentPage, setCurrentPage] = useState(1);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const itemsPerPage = 10;

  // Fetch exercises
  const { data: tasks, isLoading, error } = useQuery<(Task & { creatorFullName: string | null })[]>({
    queryKey: ["/api/tasks"],
    queryFn: async () => {
        const response = await fetch("/api/tasks");
        if (!response.ok) throw new Error("Failed to fetch tasks");
        return response.json();
      },
  });

    const { data: assignedTasks, isLoading: assignedLoading, error: assignedError } = useQuery<(AssingedTask& { taskName: string | null }  & {authorName: string | null })[]>({
    queryKey: [`/api/assignedUserTasks/${user?.id}`],
  });
 
   const { data: taskProg, isLoading: progLoading, error: progError } = useQuery<TaskProgress>({
    queryKey: [`/api/last_task_prog/${user?.id}`],
  });


  
   const { data: exerciseProgs, isLoading: exerciseProgsLoading, error: exerciseProgsError } = useQuery<ExerciseProgress[]>({
    queryKey: [`/api/task_exercises_prog/${taskProg?.id}`],
  });
  let nextSeq = 0;
  if (exerciseProgs) {
  
  for (let i = 0; i < exerciseProgs?.length; i++) {
    if (exerciseProgs[i].isCorrect !== null) {
      nextSeq+= 1;
    }
  }
}
  console.log(exerciseProgs, nextSeq);
     const { data: nextExercise, isLoading: nextExerciseLoading, error: nextExerciseError } = useQuery<Exercise>({
    queryKey: [`/api/task_exercises/${taskProg?.taskId}/seq/${nextSeq}`],
    queryFn: async () => {
        const response = await fetch(`/api/task_exercises/${taskProg?.taskId}/seq/${nextSeq}`);
        if (!response.ok) throw new Error("Failed to fetch exercises");
        return response.json();
      },
      staleTime: 0,           
  refetchOnMount: true, 
  }); 


const filteredAllTasks = tasks?.filter((task) => {
  const search = searchQuery.toLowerCase();
  return (
    task.name.toLowerCase().includes(search) ||
    task.creatorFullName?.toLowerCase().includes(search)
  );
}) ?? [];

const filteredAssignedTasks = assignedTasks?.filter((task) => {
  const search = searchQuery.toLowerCase();
  return task.taskName?.toLowerCase().includes(search);
}) ?? [];

const currentTasks = activeTab === "all" ? filteredAllTasks : filteredAssignedTasks;
  // Handle pagination
const totalPages = Math.ceil(currentTasks.length / itemsPerPage);
const paginatedTasks = currentTasks.slice(
  (currentPage - 1) * itemsPerPage,
  currentPage * itemsPerPage
);

if (taskProg?.isActive&& nextExercise) {
  navigate(`/tasks/${taskProg.taskId}/prog/${taskProg.id}/exercises/${nextExercise.id + 1}/seq/${nextSeq}`);
  return null;
}
  if (isLoading || exerciseProgsLoading || assignedLoading||  progLoading || nextExerciseLoading) {
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
                <div className="mb-4 mt-20 flex justify-center space-x-4">
  <button
    onClick={() => setActiveTab("all")}
    className={`px-4 py-2 rounded ${
      activeTab === "all" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
    }`}
  >
    Все задания
  </button>
  <button
    onClick={() => setActiveTab("assigned")}
    className={`px-4 py-2 rounded ${
      activeTab === "assigned" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
    }`}
  >
    Назначенные ({assignedTasks?.length ?? 0})
  </button>
</div>
    <div className="mt-16">
      <div className="flex justify-between items-center mb-6">
       
          <Input
            type="text"
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
     
       
      </div>

      {/* Exercises Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Название</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Автор</th>
           {activeTab !== "all" &&
           <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Срок</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
  {paginatedTasks.map((task) => (
    <tr key={task.id}>
      <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
        <a href={`/tasks/${task.id}`}>
          {activeTab === "all"
  ? (task as Task & { creatorFullName: string | null }).name
  : (task as AssingedTask & { taskName: string | null }& { authorName: string | null }).taskName}
        </a>
      </td>
      <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
        {activeTab === "all"
  ? (task as Task & { creatorFullName: string | null }).creatorFullName
  : (task as AssingedTask& { taskName: string | null } & { authorName: string | null }).authorName}
      </td>
      {activeTab !== "all" 
      ?
      <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
  {(task as AssingedTask).dueDate
    ? new Date((task as AssingedTask).dueDate!).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-"}
</td>
      : null}
    </tr>
  ))}
</tbody>
        </table>
      </div>

      {/* Empty state */}
      {paginatedTasks.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-md">
          <p className="text-gray-500">Нет упражнений.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-600">
  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
  <span className="font-medium">
    {Math.min(currentPage * itemsPerPage, currentTasks.length)}
  </span>{" "}
  of <span className="font-medium">{currentTasks.length}</span> results
</p>  
          <div className="flex space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
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
              Next
            </Button>
          </div>
        </div>
      )}

     
    </div>
    </>
  );
}
