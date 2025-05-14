import { desc, eq, InsertTask, Task, tasks, users } from "@shared/schema";
import { db } from "server/db";

 export async function getTask(id: number): Promise<Task | undefined> {
    try {
      const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
      return task;
    } catch (error) {
      console.error("Error getting task:", error);
      return undefined;
    }
  }

  export async function getTasks(): Promise<(Task & { creatorFullName: string | null })[]> {
      try {
        const rows = await db
          .select({
            id: tasks.id,
            name: tasks.name,
            createdAt: tasks.createdAt,
            createdBy: tasks.createdBy,
            triesNumber: tasks.triesNumber,
            exercisesNumber: tasks.exercisesNumber,
            timeConstraint: tasks.timeConstraint,
            creatorFullName: users.fullName,
          })
          .from(tasks)
          .leftJoin(users, eq(tasks.createdBy, users.id));
    
        return rows;
      } catch (error) {
        console.error("Error getting tasks:", error);
        return [];
      }
    }

export async function createTask(task: InsertTask): Promise<Task> {
    try {
      const [newTask] = await db
        .insert(tasks)
        .values(task)
        .returning();
      
      return newTask;
    } catch (error) {
      console.error("Error creating exercise:", error);
      throw new Error("Failed to create exercise");
    }
  }

export async function updateTask(id: number, taskUpdate: Partial<InsertTask>): Promise<Task | undefined> {
    try {
      const [updatedTask] = await db
        .update(tasks)
        .set(taskUpdate)
        .where(eq(tasks.id, id))
        .returning();
      
      return updatedTask;
    } catch (error) {
      console.error("Error updating task:", error);
      return undefined;
    }
  }

   export async function deleteTask(id: number): Promise<void> {
      try {
        await db.delete(tasks).where(eq(tasks.id, id));
      } catch (error) {
        console.error("Error deleting task:", error);
        throw new Error("Failed to delete task");
      }
    }

   export async function getLatestTask(userId: number): Promise<Task | undefined> {
      const [task] = await db
        .select()
        .from(tasks)
        .orderBy(desc(tasks.id))
        .where(eq(tasks.createdBy, userId))
        .limit(1);
        
      return task;
    }