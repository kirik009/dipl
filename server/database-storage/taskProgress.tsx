import { and, desc, eq, ExerciseProgress, InsertTaskProgress, TaskProgress, taskProgress, tasks } from "@shared/schema";
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
        console.error("Error getting last task progress:", error);
        throw new Error("Failed to get task progress");
      }
    }

    export async function getUserTaskProgress( userId: number, taskId: number): Promise<({exercisesNumber: number | null} & TaskProgress)[]> {
      try {
        const progr = await db
           .select({
            id: taskProgress.id,
            correctAnswers: taskProgress.correctAnswers,
            userId: taskProgress.userId,
            
            taskId: taskProgress.taskId,
            completedAt: taskProgress.completedAt,
            startedAt: taskProgress.startedAt,
            isActive: taskProgress.isActive,
             exercisesNumber: tasks.exercisesNumber,

           })
      .from(taskProgress)
      .leftJoin(tasks, eq(taskProgress.taskId, tasks.id))
      .where(and(
        eq(taskProgress.userId, userId), 
        eq(taskProgress.taskId, taskId)))
      .orderBy(taskProgress.id) 
          return progr
        } catch (error) {
        console.error("Error getting user task progress:", error);
        throw new Error("Failed to get task progress");
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
    