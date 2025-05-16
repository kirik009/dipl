import { eq, Exercise, exercises, InsertExercise } from "@shared/schema";
import { isNull, or } from "drizzle-orm";
import { db } from "server/db";

 export async function getExercise(id: number): Promise<Exercise | undefined> {
    try {
      const [exercise] = await db.select().from(exercises).where(eq(exercises.id, id));
      return exercise;
    } catch (error) {
      console.error("Error getting exercise:", error);
      return undefined;
    }
  }

  export async function getExercises(grammarTopic_id?: number): Promise<Exercise[]> {
      try {
        
        if (grammarTopic_id) {
          return await db.select().from(exercises).
            
          orderBy(exercises.id);
        } 
        
        return await db.select().from(exercises);
      } catch (error) {
        console.error("Error getting exercises:", error);
        return [];
      }
    }

    export  async function createExercise(exercise: InsertExercise): Promise<Exercise> {
        try {
          const [newExercise] = await db
            .insert(exercises)
            .values(exercise)
            .returning();
          
          return newExercise;
        } catch (error) {
          console.error("Error creating exercise:", error);
          throw new Error("Failed to create exercise");
        }
      }


      export async function updateExercise(id: number, exerciseUpdate: Partial<InsertExercise>): Promise<Exercise | undefined> {
          try {
            const [updatedExercise] = await db
              .update(exercises)
              .set(exerciseUpdate)
              .where(eq(exercises.id, id))
              .returning();
            
            return updatedExercise;
          } catch (error) {
            console.error("Error updating exercise:", error);
            return undefined;
          }
        }

        export  async function deleteExercise(id: number): Promise<void> {
            try {
              await db.delete(exercises).where(eq(exercises.id, id));
            } catch (error) {
              console.error("Error deleting exercise:", error);
              throw new Error("Failed to delete exercise");
            }
          }

           export async function deleteExercises(): Promise<void> {
              try {
                await db.delete(exercises).where(isNull(exercises.task_id));
              } catch (error) {
                console.error("Error deleting exercise:", error);
                throw new Error("Failed to delete exercise");
              }
            }
          
            export async function getTaskExercise(task_id?: number, seq?: number): Promise<Exercise> {
              try {
                if (task_id) {
                  const exers = await db.select().from(exercises).orderBy(exercises.id).where(
                    eq(exercises.task_id, task_id));
                  return exers[Number(seq)];
                } 
                
                const [exer] = await db.select().from(exercises);
          
                return [exer][0];
              } catch (error) {
                console.error("Error getting exercises:", error);
                throw new Error("Failed to get exercises");
              }
            }

           export async function getTaskExercises(task_id?: number): Promise<(Exercise)[]> {
                try {
                  if (typeof task_id !== "number" || isNaN(task_id)) {
                    throw new Error("Invalid task_id: must be a number");
                  }
                  if (task_id !== undefined) {
                    const query = db
                      .select({
                        id: exercises.id,
                        
                        translation: exercises.translation,
                        correctSentence: exercises.correctSentence,
                        words: exercises.words,                   
                        grammarExplanation: exercises.grammarExplanation,
                        task_id: exercises.task_id,
                        createdAt: exercises.createdAt,
                        createdBy: exercises.createdBy      
                      })
                      .from(exercises)
                      .where(
                        or(
                          eq(exercises.task_id, task_id),
                          isNull(exercises.task_id)
                        )
                      )
                      .orderBy(exercises.id);
                     
                    const exers = await query;
                      return exers;
                    
                  }
              
                  return [];
                } catch (error) {
                  console.error("Error fetching task exercises:", error);
                  throw new Error("Failed to get task exercises");
                }
              }

               export async function getNewTaskExercises(): Promise<Exercise[]> {
                  try {   
                      const exers = await db
                        .select()
                        .from(exercises)
                        .where(   
                            isNull(exercises.task_id)
                        );
                      return exers;
                  
                  } catch (error) {
                    console.error("Error getting exercises:", error);
                    throw new Error("Failed to get exercises");
                  }
                }

                 export async function assignTaskIdToUnassignedExercises(taskId: number): Promise<number> {
                    const result = await db
                      .update(exercises)
                      .set({ task_id: taskId })
                      .where(isNull(exercises.task_id));
                  
                    return result.rowCount ?? 0; 
                  }