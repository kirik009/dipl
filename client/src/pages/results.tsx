import { FC, useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, XCircle, ArrowLeft, RotateCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Exercise } from '@shared/schema';

const Results: FC = () => {
  const { taskId, progressId, exerciseId } = useParams<{taskId : string, progressId: string, exerciseId: string}>();
 
  const [, setLocation] = useLocation();
  
  const [userSentence, setUserSentence] = useState<string>('');
  const [correctSentence, setCorrectSentence] = useState<string>('');
  const [explanation, setExplanation] = useState<string>('');
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  
  // Fetch the exercise data
  const { data: exercise } = useQuery<Exercise>({
    queryKey: [`/api/exercises/${exerciseId}`],
    queryFn: async () => {
      const res = await fetch(`/api/exercises/${exerciseId}`);
      if (!res.ok) throw new Error('Failed to fetch exercise');
      return res.json();
    },
  });
  
  useEffect(() => {
    // Get results from localStorage
    const storedExerciseId = localStorage.getItem('lastExerciseId');
    
    if (storedExerciseId === exerciseId) {
      const storedUserSentence = localStorage.getItem('lastUserSentence') || '';
      const storedCorrectSentence = localStorage.getItem('lastCorrectSentence') || '';
      const storedExplanation = localStorage.getItem('lastExplanation') || '';
      const storedIsCorrect = localStorage.getItem('lastIsCorrect') === 'true';
      
      setUserSentence(storedUserSentence);
      setCorrectSentence(storedCorrectSentence);
      setExplanation(storedExplanation);
      setIsCorrect(storedIsCorrect);
    } else if (exercise) {
      // If no data in localStorage but we have the exercise, show default data
      setCorrectSentence(exercise.correctSentence);
      setExplanation(exercise.grammarExplanation!);
      setIsCorrect(false);
    } else {
      // If we don't have data, redirect to dashboard
      setLocation('/dashboard');
    }
  }, [exerciseId, exercise, setLocation]);
  
  const handleTryAgain = () => {
    setLocation(`/exercise/${exerciseId}`);
  };
  
  const handleBackToDashboard = () => {
    setLocation('/dashboard');
  };
  
  return (
    <div className="py-8 max-w-4xl mx-auto">
      <Card className="overflow-hidden">
        <div className={`p-6 text-white ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
          <div className="flex items-center">
            {isCorrect ? (
              <CheckCircle className="text-3xl mr-3" />
            ) : (
              <XCircle className="text-3xl mr-3" />
            )}
            <h3 className="font-heading text-2xl font-semibold">
              {isCorrect ? 'Correct!' : 'Not quite right'}
            </h3>
          </div>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <h4 className="font-medium text-gray-700 mb-2">Your answer:</h4>
            <p className="p-3 bg-gray-50 rounded text-gray-800">
              {userSentence || 'No answer provided'}
            </p>
          </div>
          
          {!isCorrect && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-700 mb-2">Correct answer:</h4>
              <p className="p-3 bg-primary-50 rounded text-gray-800 border-l-4 border-primary">
                {correctSentence}
              </p>
            </div>
          )}
          
          <div className="mb-6">
            <h4 className="font-medium text-gray-700 mb-2">Grammar explanation:</h4>
            <div className="p-4 bg-primary-50 rounded-lg text-gray-700">
              {explanation.split('\n').map((line, index) => (
                <p key={index} className={index > 0 ? 'mt-2' : ''}>
                  {line}
                </p>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleBackToDashboard}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <Button onClick={handleTryAgain}>
              <RotateCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Results;
