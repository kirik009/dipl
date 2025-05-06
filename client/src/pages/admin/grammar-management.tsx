import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Exercise, GrammarTopic, InsertGrammarTopic, Task } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
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

export default function GrammarManagement() {
  const { toast } = useToast();
 
   
  
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [topicToDelete, setTopicToDelete] = useState<GrammarTopic | null>(null);
  const itemsPerPage = 10;

  // Fetch exercises
  const { data: topics, isLoading, error } = useQuery<GrammarTopic[]>({
    queryKey: ["/api/grammar-topics"],
  });

  const [isEditable, setIsEditable] = useState(Array(topics?.length).fill(false));
  
  const toggleEditable = (index: number, id: number, data: InsertGrammarTopic) => {
    if (isEditable[index]) {
    updateTopicMutation.mutate({id, data})
    }
    setIsEditable((prev) =>
      prev.map((val, i) => (i === index ? !val : val))
    );
    
  };
 

  // Delete exercise mutation
  const deleteTopicMutation = useMutation({
    mutationFn: async (taskId: number) => {
      await apiRequest("DELETE", `/api/grammar-topics/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grammar-topics"] });
      toast({
        title: "Операция выполнена",
        description: "Грамматическая тема удалена.",
      });
      setTopicToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Удаление не выполнено",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateTopicMutation =  useMutation({
      mutationFn: async ({ id, data }: { id: number; data: InsertGrammarTopic }) => {
        
          const res = await apiRequest("PUT", `/api/grammar-topics/${id}`, data);
        return await res.json();
      } 
      ,
      onSuccess: () => {
        toast({
          title: "Операция выполнена",
          description: "Грамматическая тема успешно обновлена",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/grammar-topics"] });
     
      },
      onError: (error: Error) => {
        toast({
          title: "Обновление не выполнено",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  

    const createTopicMutation = useMutation({
        mutationFn: async () => {
          const res = await apiRequest("POST", "/api/grammar-topics");
          return await res.json();
        },
        onSuccess: () => {
          queryClient.invalidateQueries({queryKey: ["/api/grammar-topics"]});
          toast({
            title: "Операция выполнена",
            description: "Упражнение успешно создано.",
          });
          
        },
        onError: (error: Error) => {
          toast({
            title: "Создание не выполнено",
            description: error.message,
            variant: "destructive",
          });
        },
      });

  const totalPages = topics ? Math.ceil(topics.length / itemsPerPage) : 0;
  const paginatedTopics = topics
    ? topics.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : [];

  const handleDeleteTopic = (task: GrammarTopic) => {
    setTopicToDelete(task);
  };

  const confirmDeleteTopic = () => {
    if (topicToDelete) {
      deleteTopicMutation.mutate(topicToDelete.id);
    }
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
          onClick={()=> {createTopicMutation.mutate()}} 
         >
              Добавить тему
          </Button>

        </div>
      </div>

      {/* Exercises Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Название</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Описание </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 w-full ">
         
            {paginatedTopics.map((topic, index) => (
                < >
              <tr key={topic.id}>
                <td contentEditable={isEditable[index]} 
                data-name
                className="py-4 px-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                  {topic.name}
                </td>
                <td contentEditable={isEditable[index]} 
                data-description
                className="py-4 px-4 text-sm text-gray-500 max-w-xs">
                  {topic.description}
                </td>
              
            
                <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">
                
                <Button onClick={() => {
                    const row = document.querySelectorAll("tbody tr")[index];
                    const nameEl = row.querySelector("[data-name]");
                    const descriptionEl = row.querySelector("[data-description]");
                
                    const name = nameEl?.textContent?.trim() ?? "";
                    const description = descriptionEl?.textContent?.trim() ?? "";
                    toggleEditable(index, topic.id,{name, description})}

                }>
                    {isEditable[index] ? "Сохранить": "Редактировать"}       
                </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTopic(topic)}
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
      {paginatedTopics.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-md">
          <p className="text-gray-500">No exercises found matching your criteria.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
            <span className="font-medium">
              {topics && Math.min(currentPage * itemsPerPage, topics.length)}
            </span>{" "}
            of <span className="font-medium">{topics && topics.length}</span> results
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

      {/* Delete Task Confirmation */}
      <AlertDialog 
        open={!!topicToDelete} 
        onOpenChange={(open) => !open && setTopicToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
            <AlertDialogDescription>
            Это действие удалит грамматическую тему. И его нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отменить</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteTopic}
              className="bg-red-500 text-white hover:bg-red-600"
              disabled={deleteTopicMutation.isPending}
            >
              {deleteTopicMutation.isPending ? "Удаление..." : "Удалить тему"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


       
    </div>
  );
}




