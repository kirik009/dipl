import { and, assignedTasks, AssingedTask, eq, InsertAssignedTask, tasks, User, users } from "@shared/schema";
import { db } from "server/db";



    export async function getAssignedTasks(userId: number): Promise<(AssingedTask & {taskName: string | null }  & {authorName: string | null })[]> {
    try {
      const elements = await db.select({
        id: assignedTasks.id,
        userId: assignedTasks.userId,
        taskId: assignedTasks.taskId,
        assignedBy: assignedTasks.assignedBy,
        dueDate: assignedTasks.dueDate,
        assignedAt: assignedTasks.assignedAt,
        status: assignedTasks.status,
        taskName: tasks.name,
        authorName: users.fullName
      }).from(assignedTasks)
      .leftJoin(tasks, eq(assignedTasks.taskId, tasks.id))
      .leftJoin(users, eq(assignedTasks.assignedBy, users.id))
      .where(and(eq(assignedTasks.userId, userId),
      eq(assignedTasks.status, "pending"))
    );

      return elements;
    } catch (error) {
      console.error("Error getting assigned tasks:", error);
      return [];
    }
  }

     export async function getAssignedExpiredTasks(userId: number): Promise<(AssingedTask & {taskName: string | null }  & {authorName: string | null })[]> {
    try {
      const elements = await db.select({
        id: assignedTasks.id,
        userId: assignedTasks.userId,
        taskId: assignedTasks.taskId,
        assignedBy: assignedTasks.assignedBy,
        dueDate: assignedTasks.dueDate,
        assignedAt: assignedTasks.assignedAt,
        status: assignedTasks.status,
        taskName: tasks.name,
        authorName: users.fullName
      }).from(assignedTasks)
      .leftJoin(tasks, eq(assignedTasks.taskId, tasks.id))
      .leftJoin(users, eq(assignedTasks.assignedBy, users.id))
      .where(and(eq(assignedTasks.userId, userId),
      eq(assignedTasks.status, "expired"))
    );

      return elements;
    } catch (error) {
      console.error("Error getting assigned expired tasks:", error);
      return [];
    }
  }

       export async function getAssignedSolvedTasks(userId: number): Promise<(AssingedTask & {taskName: string | null }  & {authorName: string | null })[]> {
    try {
      const elements = await db.select({
        id: assignedTasks.id,
        userId: assignedTasks.userId,
        taskId: assignedTasks.taskId,
        assignedBy: assignedTasks.assignedBy,
        dueDate: assignedTasks.dueDate,
        assignedAt: assignedTasks.assignedAt,
        status: assignedTasks.status,
        taskName: tasks.name,
        authorName: users.fullName
      }).from(assignedTasks)
      .leftJoin(tasks, eq(assignedTasks.taskId, tasks.id))
      .leftJoin(users, eq(assignedTasks.assignedBy, users.id))
      .where(and(eq(assignedTasks.userId, userId),
      eq(assignedTasks.status, "solved"))
    );

      return elements;
    } catch (error) {
      console.error("Error getting assigned solved exercises:", error);
      return [];
    }
  }
     export  async function deleteAssignedTask(id: number): Promise<void> {
              try {
                await db.delete(assignedTasks).where(eq(assignedTasks.id, id));
              } catch (error) {
                console.error("Error deleting exercise:", error);
                throw new Error("Failed to delete exercise");
              }
            }


    export async function updateAssignedTask(id: number, exerciseUpdate: Partial<InsertAssignedTask>): Promise<AssingedTask | undefined> {
        try {
          const [updatedExercise] = await db
            .update(assignedTasks)
            .set(exerciseUpdate)
            .where(eq(assignedTasks.id, id))
            .returning();
          
          return updatedExercise;
        } catch (error) {
          console.error("Error updating exercise:", error);
          return undefined;
        }
      }

    export async function solvAssignedTask(taskId: number ): Promise<AssingedTask | undefined> {
        try {
          const [updatedExercise] = await db
            .update(assignedTasks)
            .set({status: "solved"})
            .where(eq(assignedTasks.taskId, taskId))
            .returning();
          
          return updatedExercise;
        } catch (error) {
          console.error("Error updating exercise:", error);
          return undefined;
        }
      }


       export async function createAssignedTask(exercise: InsertAssignedTask): Promise<AssingedTask> {
  try {
    const { dueDate, ...rest } = exercise;

    const parsedExercise = {
      ...rest,
      dueDate: dueDate ? new Date(dueDate) : null, // преобразуем строку в Date, если указана
    };
    
    const [newExercise] = await db
      .insert(assignedTasks)
      .values(parsedExercise)
      .returning();

    return newExercise;
  } catch (error) {
    console.error("Error creating exercise:", error);
    throw new Error("Failed to create exercise");
  }
}