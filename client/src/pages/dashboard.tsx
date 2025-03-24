import { FC } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Exercise, UserProgress } from '@shared/schema';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, BookOpen, CheckCircle, XCircle, Loader2 } from 'lucide-react';

const Dashboard: FC = () => {
  const { user } = useAuth();
  
  const { data: exercises, isLoading: isLoadingExercises } = useQuery<Exercise[]>({
    queryKey: ['/api/exercises', user?.difficultyLevel],
    queryFn: async () => {
      const res = await fetch(`/api/exercises?difficulty=${user?.difficultyLevel}`);
      if (!res.ok) throw new Error('Failed to fetch exercises');
      return res.json();
    },
  });
  
  const { data: progress, isLoading: isLoadingProgress } = useQuery<UserProgress[]>({
    queryKey: ['/api/progress'],
    queryFn: async () => {
      const res = await fetch('/api/progress');
      if (!res.ok) throw new Error('Failed to fetch progress');
      return res.json();
    },
  });
  
  const isLoading = isLoadingExercises || isLoadingProgress;
  
  // Calculate statistics
  const totalCompleted = progress?.length || 0;
  const totalCorrect = progress?.filter(p => p.correct).length || 0;
  const accuracyRate = totalCompleted > 0 ? Math.round((totalCorrect / totalCompleted) * 100) : 0;
  
  // Get completed exercise IDs for filtering
  const completedExerciseIds = new Set(progress?.map(p => p.exerciseId) || []);
  
  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-gray-900 mb-2">
          {user ? `Welcome, ${user.username}!` : 'Dashboard'}
        </h1>
        <p className="text-gray-600">
          Track your progress and continue your English sentence building practice.
        </p>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Completed Exercises</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-primary mr-2">{totalCompleted}</span>
                  <span className="text-gray-500">exercises</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Accuracy Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-primary mr-2">{accuracyRate}%</span>
                  <span className="text-gray-500">correct answers</span>
                </div>
                <Progress 
                  value={accuracyRate} 
                  className="h-2 mt-2" 
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Current Level</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-primary mr-2 capitalize">
                    {user?.difficultyLevel || 'Beginner'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Available Exercises */}
          <div className="mb-8">
            <h2 className="font-heading text-2xl font-semibold text-gray-900 mb-4">
              Available Exercises
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exercises && exercises.length > 0 ? (
                exercises.map((exercise) => (
                  <Card key={exercise.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">Exercise #{exercise.id}</CardTitle>
                          <CardDescription className="mt-1 line-clamp-2">
                            {exercise.translationText}
                          </CardDescription>
                        </div>
                        <Badge variant={
                          completedExerciseIds.has(exercise.id) 
                            ? (progress?.find(p => p.exerciseId === exercise.id)?.correct 
                              ? "success" 
                              : "destructive") 
                            : "outline"
                        }>
                          {completedExerciseIds.has(exercise.id) 
                            ? (progress?.find(p => p.exerciseId === exercise.id)?.correct 
                              ? "Completed" 
                              : "Incorrect") 
                            : "Not Started"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className="flex items-center space-x-2 text-sm">
                        <Badge variant="secondary">{exercise.grammarTopic}</Badge>
                        <Badge variant="outline" className="capitalize">{exercise.difficultyLevel}</Badge>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Link href={`/exercise/${exercise.id}`}>
                        <Button className="w-full">
                          <BookOpen className="w-4 h-4 mr-2" />
                          {completedExerciseIds.has(exercise.id) ? 'Try Again' : 'Start Exercise'}
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                  <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No exercises available</h3>
                  <p className="text-gray-600 mb-4">
                    There are no exercises available for your current level. Try changing your difficulty level in your profile settings.
                  </p>
                  <Link href="/profile">
                    <Button variant="outline">Go to Profile Settings</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
          
          {/* Recent Results */}
          {progress && progress.length > 0 && (
            <div>
              <h2 className="font-heading text-2xl font-semibold text-gray-900 mb-4">
                Recent Results
              </h2>
              
              <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exercise</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {progress.slice(0, 5).map((item) => {
                      const exercise = exercises?.find(e => e.id === item.exerciseId);
                      
                      return (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">Exercise #{item.exerciseId}</div>
                            {exercise && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">{exercise.translationText}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {item.correct ? (
                              <div className="flex items-center text-green-600">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                <span>Correct</span>
                              </div>
                            ) : (
                              <div className="flex items-center text-red-600">
                                <XCircle className="h-4 w-4 mr-1" />
                                <span>Incorrect</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.completedAt ? new Date(item.completedAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <Link href={`/exercise/${item.exerciseId}`}>
                              <Button variant="outline" size="sm">Try Again</Button>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
