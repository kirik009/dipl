import { desc, eq, ExerciseProgress, InsertTaskProgress, TaskProgress, taskProgress } from "@shared/schema";
import { db } from "server/db";
import { getExerciseProgress } from "./exerciseProgress";

export async function updateTaskProg(id: number, num :number| undefined, isActive: boolean): Promise<TaskProgress | undefined> {
    try {
      if (num) {
        const [updatedTask] = await db
        .update(taskProgress)
        .set({ correctAnswers: num,
          isActive: isActive
         })
        .where(eq(taskProgress.id, id))
        .returning();
      
      return updatedTask;
      }
      else {
      const [updatedTask] = await db
        .update(taskProgress)
        .set({ completedAt: new Date(), 
          isActive: isActive
        })
        .where(eq(taskProgress.id, id))
        .returning();
      
      return updatedTask;
      }
    } catch (error) {
      console.error("Error updating task:", error);
      return undefined;
    }
  }

   export async function getTaskProgress( taskProgressId: number): Promise<TaskProgress> {
      try {
        
        const [progr] = await db
          .select()
          .from(taskProgress)
          .where(eq(taskProgress.id, taskProgressId));
          
          return progr
        } catch (error) {
        console.error("Error getting task progress:", error);
        throw new Error("Failed to get task progress");
      }
    }

       export async function getLastTaskProgress( userId: number): Promise<TaskProgress> {
      try {
        
        const [progr] = await db
           .select()
      .from(taskProgress)
      .where(eq(taskProgress.userId, userId))
      .orderBy(desc(taskProgress.id)) // или desc(taskProgress.createdAt), если есть createdAt
      .limit(1);
          return progr
        } catch (error) {
        console.error("Error getting task progress:", error);
        throw new Error("Failed to get task progress");
      }
    }


  export async function getTaskProgressSummary(userId: number): Promise<{
      totalExercises: number;
      correctExercises: number;
      incorrectExercises: number;
      accuracy: number;
      recentResults: ExerciseProgress[];
    }> {
      try {
        // Get all user progress entries for the user
        const progressEntries = await getExerciseProgress(userId);
        
        // Calculate summary statistics
        const totalExercises = progressEntries.length;
        const correctExercises = progressEntries.filter(p => p.isCorrect).length;
        const incorrectExercises = totalExercises - correctExercises;
        const accuracy = totalExercises > 0 ? (correctExercises / totalExercises) * 100 : 0;
        
        // Get the 5 most recent results
        const recentResults = progressEntries.slice(0, 5);
        
        return {
          totalExercises,
          correctExercises,
          incorrectExercises,
          accuracy,
          recentResults
        };
      } catch (error) {
        console.error("Error getting user progress summary:", error);
        return {
          totalExercises: 0,
          correctExercises: 0,
          incorrectExercises: 0,
          accuracy: 0,
          recentResults: []
        };
      }
    }

    export async function createTaskProgress(progress: InsertTaskProgress): Promise<TaskProgress> {
        try {
            const [newProgress] = await db
          .insert(taskProgress)
          .values(progress)
          .returning();
        
        return newProgress;
          
        } catch (error) {
          console.error("Error updating task progress:", error);
          throw new Error("Failed to update task progress");
        }
      }
    