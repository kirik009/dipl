import { desc, eq, ExerciseProgress, exerciseProgress, exercises, InsertExerciseProgress, UpdateExerciseProgress } from "@shared/schema";
import { db } from "server/db";

export async function getTaskExerciseProgs(taskProgId?: number): Promise<({correctSentence: string | null} & ExerciseProgress)[]> {
    try {
      
      if (taskProgId) {
        const exers = await db.select({
          id: exerciseProgress.id,
          userId: exerciseProgress.userId,
          exerciseId: exerciseProgress.exerciseId,
          isCorrect: exerciseProgress.isCorrect,
          userAnswer: exerciseProgress.userAnswer,
          completedAt: exerciseProgress.completedAt,
          taskProgressId: exerciseProgress.taskProgressId,
          correctSentence: exercises.correctSentence
        }).from(exerciseProgress).where(
          eq(exerciseProgress.taskProgressId, taskProgId)).orderBy(exerciseProgress.id)
          .leftJoin(exercises, eq(exerciseProgress.exerciseId, exercises.id));
        return exers;

      } 
      
      return [];
    } catch (error) {
      console.error("Error getting task exercise progs:", error);
      throw new Error("Failed to get exercise progs");
    }
  }

   export async function getExerciseProgress(userId: number): Promise<ExerciseProgress[]> {
      try {
        return await db
          .select()
          .from(exerciseProgress)
          .where(eq(exerciseProgress.userId, userId))
          .orderBy(desc(exerciseProgress.completedAt));
      } catch (error) {
        console.error("Error getting exercise progress:", error);
        return [];
      }
    }
     export async function getLastExerciseProgress( userId: number, seq: number): Promise<ExerciseProgress> {
      try {
        
        const progr = await db
           .select()
      .from(exerciseProgress)
      .where(eq(exerciseProgress.userId, userId))
      .orderBy(desc(exerciseProgress.id)) // или desc(taskProgress.createdAt), если есть createdAt;
          return progr[seq]
        } catch (error) {
        console.error("Error getting last exercise progress of this user:", error);
        throw new Error("Failed to get task progress");
      }
    }


      export  async function createExerciseProgress(progress: InsertExerciseProgress): Promise<ExerciseProgress> {
          try {
            
            const [newProgress] = await db
              .insert(exerciseProgress)
              .values(
              progress
              )
              .returning();
            return newProgress;
          } catch (error) {
            console.error("Error creating user progress:", error);
            throw new Error("Failed to create user progress");
          }
        }

   export async function updateExerciseProgress(id: number, progUpdate: Partial<UpdateExerciseProgress>): Promise<ExerciseProgress | undefined> {
       try {
         const { completedAt, ...rest } = progUpdate;

    const parsedProgUpdate = {
      ...rest,
      completedAt: completedAt ? new Date(completedAt) : null, // преобразуем строку в Date, если указана
    };
         const [updatedTask] = await db
           .update(exerciseProgress)
           .set(parsedProgUpdate)
           .where(eq(exerciseProgress.id, id))
           .returning();
         
         return updatedTask;
       } catch (error) {
         console.error("Error updating exercise progress:", error);
         return undefined;
       }
     }