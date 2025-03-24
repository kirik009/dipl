import { FC, useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Exercise as ExerciseType } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import WordBank from '@/components/ui/dnd/word-bank';
import DropZone from '@/components/ui/dnd/drop-zone';
import { RefreshCw, SkipForward, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const Exercise: FC = () => {
  const { id } = useParams();
  const exerciseId = parseInt(id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // State for the current sentence being built
  const [sentenceWords, setSentenceWords] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch the exercise data
  const { data: exercise, isLoading } = useQuery<ExerciseType>({
    queryKey: [`/api/exercises/${id}`],
    queryFn: async () => {
      const res = await fetch(`/api/exercises/${id}`);
      if (!res.ok) throw new Error('Failed to fetch exercise');
      return res.json();
    },
  });
  
  // Submit progress mutation
  const submitProgressMutation = useMutation({
    mutationFn: async (data: { exerciseId: number; correct: boolean }) => {
      const res = await apiRequest('POST', '/api/progress', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/progress'] });
      setLocation(`/results/${exerciseId}`);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      setIsSubmitting(false);
    },
  });
  
  // Handle adding word to the sentence
  const handleAddWord = (word: string) => {
    setSentenceWords([...sentenceWords, word]);
  };
  
  // Handle removing word from the sentence
  const handleRemoveWord = (word: string, index: number) => {
    setSentenceWords(sentenceWords.filter((_, i) => i !== index));
  };
  
  // Handle reordering words in the sentence
  const handleReorderWords = (dragIndex: number, hoverIndex: number) => {
    const newWords = [...sentenceWords];
    const draggedWord = newWords[dragIndex];
    newWords.splice(dragIndex, 1);
    newWords.splice(hoverIndex, 0, draggedWord);
    setSentenceWords(newWords);
  };
  
  // Reset the exercise
  const handleReset = () => {
    setSentenceWords([]);
  };
  
  // Skip the exercise
  const handleSkip = () => {
    submitProgressMutation.mutate({
      exerciseId,
      correct: false,
    });
  };
  
  // Check the answer
  const handleCheckAnswer = () => {
    if (!exercise) return;
    
    setIsSubmitting(true);
    
    // Get the correct sentence words
    const correctWords = exercise.correctSentence.toLowerCase().split(' ').map(w => w.replace(/[.,!?;:]/g, ''));
    
    // Compare the user's sentence with the correct one
    const userSentence = sentenceWords.join(' ').toLowerCase();
    const correctSentence = correctWords.join(' ').toLowerCase();
    
    // Store result in localStorage to display on the results page
    localStorage.setItem('lastExerciseId', String(exerciseId));
    localStorage.setItem('lastUserSentence', sentenceWords.join(' '));
    localStorage.setItem('lastCorrectSentence', exercise.correctSentence);
    localStorage.setItem('lastExplanation', exercise.explanation);
    localStorage.setItem('lastIsCorrect', String(userSentence === correctSentence));
    
    // Submit progress
    submitProgressMutation.mutate({
      exerciseId,
      correct: userSentence === correctSentence,
    });
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!exercise) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Exercise Not Found</h2>
        <p className="text-gray-600 mb-6">The exercise you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => setLocation('/dashboard')}>Return to Dashboard</Button>
      </div>
    );
  }
  
  return (
    <div className="py-8 max-w-4xl mx-auto">
      <Card className="overflow-hidden">
        <div className="bg-primary text-white p-6">
          <div className="flex justify-between items-center">
            <h2 className="font-heading text-2xl font-semibold">Sentence Builder</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                <span className="capitalize">{exercise.difficultyLevel}</span>
              </div>
              <Badge className="bg-white text-primary px-3 py-1 rounded-full">
                {exercise.grammarTopic}
              </Badge>
            </div>
          </div>
        </div>
        
        <CardContent className="p-6">
          <div className="mb-6">
            <h3 className="text-lg text-gray-700 mb-1">Arrange the words to form a correct English sentence:</h3>
            <p className="text-gray-500 italic">Расположите слова, чтобы составить правильное предложение</p>
          </div>
          
          <div className="mb-8">
            <div className="p-4 bg-gray-50 rounded-lg mb-4">
              <p className="text-gray-700 font-medium">{exercise.translationText}</p>
            </div>
            
            {/* Drop Zone for sentence building */}
            <DropZone 
              activeWords={sentenceWords}
              onAddWord={handleAddWord}
              onRemoveWord={handleRemoveWord}
              onReorderWords={handleReorderWords}
            />
          </div>
          
          {/* Word Bank */}
          <WordBank 
            words={exercise.words}
            activeWords={sentenceWords}
            onWordDragged={() => {}}
            onWordReturned={() => {}}
          />
          
          <div className="mt-8 flex justify-between">
            <Button 
              variant="outline" 
              onClick={handleReset}
              disabled={sentenceWords.length === 0 || isSubmitting}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <div>
              <Button 
                variant="outline" 
                className="mr-2"
                onClick={handleSkip}
                disabled={isSubmitting}
              >
                <SkipForward className="h-4 w-4 mr-1" />
                Skip
              </Button>
              <Button 
                onClick={handleCheckAnswer}
                disabled={sentenceWords.length === 0 || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Check Answer
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Exercise;
