import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Exercise } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

export default function ExerciseManagement() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [grammarTopicFilter, setGrammarTopicFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(null);
  const itemsPerPage = 10;

  // Fetch exercises
  const { data: exercises, isLoading, error } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises"],
  });

  // Fetch grammar topics for filtering
  const { data: grammarTopics } = useQuery({
    queryKey: ["/api/grammar-topics"],
  });

  // Delete exercise mutation
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

  // Handle search and filtering
  const filteredExercises = exercises
    ? exercises.filter((exercise) => {
        const matchesSearch =
          exercise.correctSentence.toLowerCase().includes(searchQuery.toLowerCase()) ||
          exercise.translation.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDifficulty = difficultyFilter === "all" || exercise.difficulty === difficultyFilter;
        const matchesGrammarTopic = grammarTopicFilter === "all" || exercise.grammarTopic === grammarTopicFilter;
        return matchesSearch && matchesDifficulty && matchesGrammarTopic;
      })
    : [];

  // Handle pagination
  const totalPages = Math.ceil(filteredExercises.length / itemsPerPage);
  const paginatedExercises = filteredExercises.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDeleteExercise = (exercise: Exercise) => {
    setExerciseToDelete(exercise);
  };

  const confirmDeleteExercise = () => {
    if (exerciseToDelete) {
      deleteExerciseMutation.mutate(exerciseToDelete.id);
    }
  };

  const handleEditExercise = (exerciseId: number) => {
    navigate(`/admin/exercises/${exerciseId}/edit`);
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
          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Difficulties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Difficulties</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>

          <Select value={grammarTopicFilter} onValueChange={setGrammarTopicFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Grammar Topics" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grammar Topics</SelectItem>
              {grammarTopics?.map((topic: any) => (
                <SelectItem key={topic.id} value={topic.name}>
                  {topic.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button asChild>
            <Link href="/admin/exercises/new">
              <FilePlus className="mr-2 h-4 w-4" />
              Add Exercise
            </Link>
          </Button>
        </div>
      </div>

      {/* Exercises Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Translation</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">English Sentence</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grammar Topic</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difficulty</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedExercises.map((exercise) => (
              <tr key={exercise.id}>
                <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">{exercise.id}</td>
                <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                  {exercise.translation}
                </td>
                <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                  {exercise.correctSentence}
                </td>
                <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">{exercise.grammarTopic}</td>
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

      {/* Empty state */}
      {paginatedExercises.length === 0 && (
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
              {Math.min(currentPage * itemsPerPage, filteredExercises.length)}
            </span>{" "}
            of <span className="font-medium">{filteredExercises.length}</span> results
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

      {/* Delete Exercise Confirmation */}
      <AlertDialog 
        open={!!exerciseToDelete} 
        onOpenChange={(open) => !open && setExerciseToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this exercise and all associated user progress. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteExercise}
              className="bg-red-500 text-white hover:bg-red-600"
              disabled={deleteExerciseMutation.isPending}
            >
              {deleteExerciseMutation.isPending ? "Deleting..." : "Delete Exercise"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
