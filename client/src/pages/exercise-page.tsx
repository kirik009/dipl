import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Navbar } from "@/components/layout/navbar";
import { DragItem } from "@/components/ui/dnd/drag-item";
import { DropZone } from "@/components/ui/dnd/drop-zone";
import  WordBank  from "@/components/ui/dnd/word-bank";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Exercise, Task, TaskProgress, taskProgress, insertTaskProgressSchema } from "@shared/schema";
import { Loader2, RefreshCw, SkipForward } from "lucide-react";
import { ConsoleLogWriter } from "drizzle-orm";
import { z } from "zod";
export default function ExercisePage() {

  const { taskId, progressId, exerciseId, seq } = useParams<{taskId : string, progressId: string, exerciseId: string, seq: string}>();
      
  const { data: prog } = useQuery<TaskProgress>({
          queryKey: [`/api/task_prog/${progressId}`],
          queryFn: async () => {
              const response = await fetch(`/api/task_prog/${progressId}`);
              if (!response.ok) throw new Error("Failed to fetch tasks");
              return response.json();
            },
        });

  const { data: task } = useQuery<Task>({
    queryKey: [`/api/tasks/${taskId}`],
    queryFn: async () => {
        const response = await fetch(`/api/tasks/${taskId}`);
        if (!response.ok) throw new Error("Failed to fetch tasks");
        return response.json();
      },
  });

  const [, navigate] = useLocation();
  const { toast } = useToast();
  type WordItem = { id: string; text: string };  
  // State for word bank and sentence building
  const [wordBank, setWordBank] = useState<WordItem[]>([]);
  const [sentence, setSentence] = useState<WordItem[]>([]);

  const [timeLeft, setTimeLeft] = useState(() => {
    const stored = localStorage.getItem("timeLeft");
    return stored ? parseInt(stored, 10) : 0;
  });

   type FormValues = z.infer<typeof insertTaskProgressSchema>;

  const updateTaskMutation =  useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("PUT", `/api/task_prog/${progressId}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "task progress updated",
        description: "The task progress has been successfully updated.",
      });
      navigate(`/tasks/${taskId}/prog/${progressId}/results`)
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

useEffect(() => {

      if (timeLeft <= 0) {
        updateTaskMutation.mutate( 
          {}
       )
        
      }
    
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1000);
      }, 1000);
    
      return () => clearTimeout(timer);
    }, [timeLeft]);
    
  


  // Fetch exercise data
  const { data: exercise, isLoading, error } = useQuery<Exercise>({
    queryKey: [`/api/exercises/${exerciseId}`],
  });

   
  useEffect(() => {
    if (exercise) {
      setWordBank(
        exercise.words.map((word, index) => ({
          id: `${word}-${index}-${crypto.randomUUID()}`,
          text: word,
        }))
      );
      setSentence([]);
    }
  }, [exercise]);
  
  // Submit exercise mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      const userAnswer = sentence.map(w => w.text).join(" ");
     
      const res = await apiRequest("POST", "/api/exercises/submit", {
        taskId: parseInt(taskId),
        exerciseId: parseInt(exerciseId),
        userAnswer,
        taskProgressId: parseInt(progressId),
      });
      return await res.json();
    },
    onSuccess: (data) => {
      navigate(`/tasks/${taskId}/prog/${progressId}/exercises/${exerciseId}/seq/${seq}/results?isCorrect=${data.isCorrect}`);
    },
      onError: (error: Error) => {
      toast({
        title: "Error submitting answer",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle moving a word from word bank to sentence
  // const handleAddWord = (word: string) => {
  //   setWordBank(wordBank.filter(w => w !== word));
  //   setSentence([...sentence, word]);
  // };
  
  // Handle removing a word from sentence back to word bank
  const handleRemoveWord = (word: string) => {
    
  };
  
  // Reset exercise
  const handleReset = () => {
    if (exercise) {
      setWordBank(
        exercise.words.map((word, index) => ({
          id: `${word}-${index}-${crypto.randomUUID()}`,
          text: word,
        }))
      );
      setSentence([]);
    }
  };
  
  // Check answer
  const handleCheckAnswer = () => {
    if (sentence.length === 0) {
      toast({
        title: "Please build a sentence",
        description: "Drag words from the word bank to form a sentence.",
        variant: "destructive",
      });
      return;
    }
    
    submitMutation.mutate();
    localStorage.setItem("timeLeft", timeLeft.toString());
  };
  
  // Skip exercise
  const handleSkip = () => {
    // Fetch the next exercise - for now we just navigate to the results
    navigate(`/tasks/${taskId}/results/${exerciseId}?skipped=true`);
  };
  
  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto pt-20 pb-12 px-4 min-h-screen flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </>
    );
  }
  
  if (error || !exercise) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto pt-20 pb-12 px-4 min-h-screen">
          <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-sm mt-8 text-center">
            <h2 className="text-2xl font-bold text-red-500 mb-4">Error Loading Exercise</h2>
            <p className="text-gray-600 mb-6">
              {error?.message || "Could not load the exercise. Please try again."}
            </p>
            <Button onClick={() => navigate("/")}>На главную</Button>
          </div>
        </div>
      </>
    );
  }
  
  return (
    <>
      
      <Navbar />
      <main className="container mx-auto pt-20 pb-12 px-4">
      <p className="text-lg text-gray-600 mb-8">{
(() =>  {
  const totalSeconds = Math.floor(timeLeft / 1000); 
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).length === 1 ? `0${hours}` : hours}:${String(minutes).length === 1 ? `0${minutes}` : minutes}:${String(seconds).length === 1 ? `0${seconds}` : seconds}`
})()
}
</p>
        <div className="py-16">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="bg-primary text-white p-6">
                <div className="flex justify-between items-center">
                  <h2 className="font-heading text-2xl font-semibold">Sentence Builder</h2>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="capitalize">{exercise.difficulty}</span>
                    </div>
                    {/* <div className="bg-white text-primary px-3 py-1 rounded-full font-medium text-sm">
                      {exercise.grammarTopic}
                    </div> */}
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <Progress value={40} className="h-2 bg-white/20" />
                  <span className="ml-3 text-white text-sm font-medium">4/10</span>
                </div>
              </div>
              
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg text-gray-700 mb-1">Arrange the words to form a correct English sentence:</h3>
                  <p className="text-gray-500 italic">Расположите слова, чтобы составить правильное предложение</p>
                </div>
                
                <div className="mb-8">
                  <div className="p-4 bg-gray-50 rounded-lg mb-4">
                    <p className="text-gray-700 font-medium">{exercise.translation}</p>
                  </div>
                  
                  <DropZone 
                    onDrop={(wordItem) => {
                      setSentence(prev => [...prev, wordItem]) 
                     
                    }}
                    
                      isEmpty={sentence.length === 0}
                    className="mb-6"
                  >
                    {sentence.map((word, index) => (
                      <DragItem
                      
                      id={word.id}
                      text={word.text}
                      index={index}
                        canMove={true}
                        onRemove={() => {
                          setSentence(prev => prev.filter(w => w.id !== word.id));
                        }}
                        moveCard={(dragIndex: number, hoverIndex: number) => {
                          setSentence((prevSentence) => {
                            
                            const updated = [...prevSentence];
                            const [removed] = updated.splice(dragIndex, 1);
                            updated.splice(hoverIndex, 0, removed);
                           
                            return updated;
                          });
                        }}
                        
                      />
                    ))
                    
                    }
                  </DropZone>
                </div>
                
                <WordBank
                words={wordBank}
                activeWords={sentence}
                onWordDragged={(wordItem) => {
                  
                  setWordBank(prev => prev.filter(w => w.id !== wordItem.id));
                }}
                onWordReturned={(wordItem) => {
                  setWordBank(prev => [...prev, wordItem]);
                }}
                >
                </WordBank>
                
                <div className="mt-8 flex justify-between">
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="gap-1"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Перезагрузить
                  </Button>
                  <div>
                    <Button
                      variant="outline"
                      onClick={handleSkip}
                      className="mr-2 gap-1"
                    >
                      <SkipForward className="h-4 w-4" />
                      Пропустить
                    </Button>
                    <Button
                      onClick={handleCheckAnswer}
                      disabled={submitMutation.isPending}
                    >
                      {submitMutation.isPending ? "Проверка..." : "Проверить ответ"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    
    </>
  );
}
