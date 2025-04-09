import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Exercise, insertExerciseSchema } from "@shared/schema";
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
import { X, Plus, Loader2, ArrowLeft } from "lucide-react";

const formSchema = insertExerciseSchema.extend({
  newWord: z.string().optional(),
  currentTag: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function ExerciseEditor() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [wordInput, setWordInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const isEditing = !!id && id !== "new";
  
  // Fetch exercise if editing
  const { data: exercise, isLoading: isLoadingExercise } = useQuery<Exercise>({
    queryKey: [`/api/exercises/${id}`],
    enabled: isEditing,
  });
  
  // Fetch grammar topics
  const { data: grammarTopics, isLoading: isLoadingTopics } = useQuery({
    queryKey: ["/api/grammar-topics"],
    queryFn: async () => {
      const response = await fetch("/api/grammar-topics");
      if (!response.ok) throw new Error("Failed to fetch");
      return response.json();
    },
  });
  
  // Form definition
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "sentence-builder",
      difficulty: "intermediate",
      grammarTopic_id: 1,
      translation: "",
      correctSentence: "",
      words: [],
      grammarExplanation: "",
      tags: [],
      newWord: "",
      currentTag: "",
    }
  });
  
  // Update form values when exercise data is loaded
  useEffect(() => {
    if (exercise) {
      form.reset({
        ...exercise,
        newWord: "",
        currentTag: "",
      });
    }
  }, [exercise, form]);
  
  // Create exercise mutation
  const createExerciseMutation = useMutation({
    mutationFn: async (data: Omit<FormValues, "newWord" | "currentTag">) => {
      const res = await apiRequest("POST", "/api/exercises", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Exercise created",
        description: "The exercise has been successfully created.",
      });
      navigate("/admin/exercises");
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
  const updateExerciseMutation = useMutation({
    mutationFn: async (data: Omit<FormValues, "newWord" | "currentTag">) => {
      const res = await apiRequest("PUT", `/api/exercises/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Exercise updated",
        description: "The exercise has been successfully updated.",
      });
      navigate("/admin/exercises");
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle adding a word
  const handleAddWord = () => {
    if (!wordInput.trim()) return;
    
    const currentWords = form.getValues("words") || [];
    form.setValue("words", [...currentWords, wordInput.trim()]);
    setWordInput("");
  };
  
  // Handle removing a word
  const handleRemoveWord = (word: string) => {
    const currentWords = form.getValues("words") || [];
    form.setValue("words", currentWords.filter(w => w !== word));
  };
  
  // Handle adding a tag
  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    
    const currentTags = form.getValues("tags") || [];
    form.setValue("tags", [...currentTags, tagInput.trim()]);
    setTagInput("");
  };
  
  // Handle removing a tag
  const handleRemoveTag = (tag: string) => {
    const currentTags = form.getValues("tags") || [];
    form.setValue("tags", currentTags.filter(t => t !== tag));
  };
  
  // Handle form submission
  const onSubmit = (values: FormValues) => {
    // Remove the extra fields we added for UI purposes
    const { newWord, currentTag, ...exerciseData } = values;
    
    if (isEditing) {
      updateExerciseMutation.mutate(exerciseData);
    } else {
      createExerciseMutation.mutate(exerciseData);
    }
  };
  
  const isLoading = isLoadingExercise || isLoadingTopics;
  
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exercise Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select exercise type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sentence-builder">Sentence Builder</SelectItem>
                        <SelectItem value="gap-fill">Gap Fill</SelectItem>
                        <SelectItem value="word-order">Word Order</SelectItem>
                        <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select difficulty level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="grammarTopic_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grammar Topic</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select grammar topic" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {grammarTopics?.map((topic: any) => (
                          <SelectItem key={topic.id} value={topic.name}>
                            {topic.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div>
                <FormLabel>Tags</FormLabel>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.watch("tags")?.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveTag(tag)}
                        className="text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag..."
                    className="rounded-r-none"
                  />
                  <Button 
                    type="button" 
                    onClick={handleAddTag}
                    className="rounded-l-none"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="translation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Translation (Russian)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter the Russian translation" />
                  </FormControl>
                  <FormDescription>
                    The sentence in Russian that students need to translate.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="correctSentence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correct Sentence (English)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter the correct English sentence" />
                  </FormControl>
                  <FormDescription>
                    The correct English translation that will be used to validate answers.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div>
              <FormLabel>Words for Exercise</FormLabel>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex flex-wrap gap-2 mb-4">
                  {form.watch("words")?.map((word, index) => (
                    <div key={index} className="bg-white px-3 py-2 rounded shadow-sm flex items-center">
                      {word}
                      <button
                        type="button"
                        onClick={() => handleRemoveWord(word)}
                        className="ml-2 text-gray-400 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="flex">
                  <Input
                    value={wordInput}
                    onChange={(e) => setWordInput(e.target.value)}
                    placeholder="Add a word..."
                    className="rounded-r-none"
                  />
                  <Button 
                    type="button" 
                    onClick={handleAddWord}
                    className="rounded-l-none"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {form.formState.errors.words && (
                <p className="text-sm font-medium text-destructive mt-2">
                  {form.formState.errors.words.message}
                </p>
              )}
            </div>
            
            <FormField
              control={form.control}
              name="grammarExplanation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grammar Explanation</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Provide a grammar explanation that will be shown after the exercise is completed"
                      rows={4}
                      value= {field.value ?? ""} 
                    />
                  </FormControl>
                  <FormDescription>
                    This explanation will help students understand the grammar rules used in the sentence.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/exercises")}
                className="mr-2"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createExerciseMutation.isPending || updateExerciseMutation.isPending}
              >
                {createExerciseMutation.isPending || updateExerciseMutation.isPending
                  ? "Saving..."
                  : isEditing
                  ? "Update Exercise"
                  : "Create Exercise"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
