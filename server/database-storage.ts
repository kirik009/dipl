import { IStorage } from "./storage";
import connectPg from "connect-pg-simple";
import session from "express-session";
import { pool } from "./db";
import {db} from "./db";
import * as crypto from "crypto";
import {
  users,
  exercises,
  exerciseProgress,
  grammarTopics,
  tasks,
  User,
  InsertUser,
  Exercise,
  Task,
  InsertExercise,
  ExerciseProgress,
  InsertExerciseProgress,
  GrammarTopic,
  InsertGrammarTopic,
  eq,
  and,
  desc,
  InsertTask,
  TaskProgress,
  InsertTaskProgress,
  taskProgress
} from "@shared/schema";
import { isNull, or } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({
      pool: pool,  // Type assertion to avoid type errors
      createTableIfMissing: true
    });
  }

  private hashPassword(password: string) {
    
    return crypto.createHash("sha256").update(password).digest("hex");
  }

  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error("Error getting user:", error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error("Error getting user by username:", error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const [newUser] = await db
        .insert(users)
        .values({ ...user })
        .returning();
      
      return newUser;
    } catch (error) {
      console.error("Error creating user:", error);
      throw new Error("Failed to create user");
    }
  }

  async updateUser(id: number, userUpdate: Partial<InsertUser>): Promise<User | undefined> {
    try {
      // Hash password if it's included in the update
      if (userUpdate.password) {
        userUpdate.password = this.hashPassword(userUpdate.password);
      }

      const [updatedUser] = await db
        .update(users)
        .set(userUpdate)
        .where(eq(users.id, id))
        .returning();
      
      return updatedUser;
    } catch (error) {
      console.error("Error updating user:", error);
      return undefined;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      return await db.select().from(users);
    } catch (error) {
      console.error("Error getting all users:", error);
      return [];
    }
  }

  async getExercise(id: number): Promise<Exercise | undefined> {
    try {
      const [exercise] = await db.select().from(exercises).where(eq(exercises.id, id));
      return exercise;
    } catch (error) {
      console.error("Error getting exercise:", error);
      return undefined;
    }
  }

  async getExercises(grammarTopic_id?: number): Promise<Exercise[]> {
    try {
      let query = db.select().from(exercises);
      
      if (grammarTopic_id) {
        return await db.select().from(exercises).where(
            eq(exercises.grammarTopic_id, grammarTopic_id)
          
        ).orderBy(exercises.id);
      } 
      
      return await db.select().from(exercises);
    } catch (error) {
      console.error("Error getting exercises:", error);
      return [];
    }
  }

  async createExercise(exercise: InsertExercise): Promise<Exercise> {
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

  async updateExercise(id: number, exerciseUpdate: Partial<InsertExercise>): Promise<Exercise | undefined> {
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

  async deleteExercise(id: number): Promise<void> {
    try {
      await db.delete(exercises).where(eq(exercises.id, id));
    } catch (error) {
      console.error("Error deleting exercise:", error);
      throw new Error("Failed to delete exercise");
    }
  }

  async deleteExercises(): Promise<void> {
    try {
      await db.delete(exercises).where(isNull(exercises.task_id));
    } catch (error) {
      console.error("Error deleting exercise:", error);
      throw new Error("Failed to delete exercise");
    }
  }

  async getTask(id: number): Promise<Task | undefined> {
    try {
      const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
      return task;
    } catch (error) {
      console.error("Error getting task:", error);
      return undefined;
    }
  }

  async getTasks(): Promise<(Task & { creatorFullName: string | null })[]> {
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
  
  async getTaskExercise(task_id?: number, seq?: number): Promise<Exercise> {
    try {
      
      if (task_id) {
        
        const [exers] = await db.select().from(exercises).where(
          eq(exercises.task_id, task_id));
        
        return [exers][Number(seq)];
      } 
      
      const [exer] = await db.select().from(exercises);

      return [exer][0];
    } catch (error) {
      console.error("Error getting exercises:", error);
      throw new Error("Failed to get exercises");
    }
  }

  async getTaskExercises(task_id?: number): Promise<(Exercise & { topicName: string | null })[]> {
    try {
      if (typeof task_id !== "number" || isNaN(task_id)) {
        throw new Error("Invalid task_id: must be a number");
      }
      if (task_id !== undefined) {
        const query = db
          .select({
            id: exercises.id,
            grammarTopic_id: exercises.grammarTopic_id,
            translation: exercises.translation,
            correctSentence: exercises.correctSentence,
            words: exercises.words,                   
            grammarExplanation: exercises.grammarExplanation,
            task_id: exercises.task_id,
            createdAt: exercises.createdAt,
            createdBy: exercises.createdBy,
            topicName: grammarTopics.name       
          })
          .from(exercises)
          .leftJoin(grammarTopics, eq(exercises.grammarTopic_id, grammarTopics.id))
          .where(
            or(
              eq(exercises.task_id, task_id),
              isNull(exercises.task_id)
            )
          );
          console.log(query.toSQL()); 
        const exers = await query;
          return exers;
        
      }
  
      return [];
    } catch (error) {
      console.error("Error fetching task exercises:", error);
      throw new Error("Failed to get task exercises");
    }
  }


  async getNewTaskExercises(): Promise<Exercise[]> {
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


  async assignTaskIdToUnassignedExercises(taskId: number): Promise<number> {
    const result = await db
      .update(exercises)
      .set({ task_id: taskId })
      .where(isNull(exercises.task_id));
  
    return result.rowCount ?? 0; // зависит от используемого драйвера
  }

  async getTaskExerciseProgs(taskProgId?: number): Promise<ExerciseProgress[]> {
    try {
      
      if (taskProgId) {
        const [exers] = await db.select().from(exerciseProgress).where(
          eq(exerciseProgress.taskProgressId, taskProgId));
        return [exers];
      } 
      
      const [exer] = await db.select().from(exerciseProgress);

      return [exer];
    } catch (error) {
      console.error("Error getting exercise progs:", error);
      throw new Error("Failed to get exercise progs");
    }
  }


  async createTask(task: InsertTask): Promise<Task> {
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

  async updateTask(id: number, taskUpdate: Partial<InsertTask>): Promise<Task | undefined> {
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
  async updateTaskProg(id: number): Promise<TaskProgress | undefined> {
    try {
      const [updatedTask] = await db
        .update(taskProgress)
        .set({ completedAt: new Date() })
        .where(eq(taskProgress.id, id))
        .returning();
      
      return updatedTask;
    } catch (error) {
      console.error("Error updating task:", error);
      return undefined;
    }
  }

  async deleteTask(id: number): Promise<void> {
    try {
      await db.delete(tasks).where(eq(tasks.id, id));
    } catch (error) {
      console.error("Error deleting task:", error);
      throw new Error("Failed to delete task");
    }
  }


  async getExerciseProgress(userId: number): Promise<ExerciseProgress[]> {
    try {
      return await db
        .select()
        .from(exerciseProgress)
        .where(eq(exerciseProgress.userId, userId))
        .orderBy(desc(exerciseProgress.completedAt));
    } catch (error) {
      console.error("Error getting user progress:", error);
      return [];
    }
  }

  async getExerciseProgressSummary(userId: number): Promise<{
    totalExercises: number;
    correctExercises: number;
    incorrectExercises: number;
    accuracy: number;
    recentResults: ExerciseProgress[];
  }> {
    try {
      // Get all user progress entries for the user
      const progressEntries = await this.getExerciseProgress(userId);
      
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

  async createExerciseProgress(progress: InsertExerciseProgress): Promise<ExerciseProgress> {
    try {
      const [newProgress] = await db
        .insert(exerciseProgress)
        .values(progress)
        .returning();
      
      return newProgress;
    } catch (error) {
      console.error("Error creating user progress:", error);
      throw new Error("Failed to create user progress");
    }
  }


  

  async getTaskProgressSummary(userId: number): Promise<{
    totalExercises: number;
    correctExercises: number;
    incorrectExercises: number;
    accuracy: number;
    recentResults: ExerciseProgress[];
  }> {
    try {
      // Get all user progress entries for the user
      const progressEntries = await this.getExerciseProgress(userId);
      
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

  async getTaskProgress( taskProgressId: number): Promise<TaskProgress> {
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
  
  async CreateTaskProgress(progress: InsertTaskProgress): Promise<TaskProgress> {
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



async getLatestTask(): Promise<Task | undefined> {
  const [task] = await db
    .select()
    .from(tasks)
    .orderBy(desc(tasks.id))
    .limit(1);
    
  return task;
}



async getGrammarTopics(): Promise<GrammarTopic[]> {
  try {
    return await db.select().from(grammarTopics).orderBy(grammarTopics.id);
  } catch (error) {
    console.error("Error getting grammar topics:", error);
    return [];
  }
}

async getGrammarTopic(id: number): Promise<GrammarTopic | undefined> {
  try {
    const [topic] = await db.select().from(grammarTopics).where(eq(grammarTopics.id, id));
    return topic;
  } catch (error) {
    console.error("Error getting grammar topic:", error);
    return undefined;
  }
}

async createGrammarTopic(): Promise<GrammarTopic> {
  try {
    const [newTopic] = await db
      .insert(grammarTopics)
      .values({})
      .returning();
    
    return newTopic;
  } catch (error) {
    console.error("Error creating grammar topic:", error);
    throw new Error("Failed to create grammar topic");
  }
}


async deleteGrammarTopic(id: number): Promise<void> {
  try {
    await db.delete(grammarTopics).where(eq(grammarTopics.id, id));
  } catch (error) {
    console.error("Error deleting grammar topic:", error);
    throw new Error("Failed to delete grammar topic");
  }
}

async updateGrammarTopic(id: number, topicUpdate: Partial<InsertGrammarTopic>): Promise<GrammarTopic | undefined> {
  try {
    const [updatedTopic] = await db
      .update(grammarTopics)
      .set(topicUpdate)
      .where(eq(grammarTopics.id, id))
      .returning();
    
    return updatedTopic;
  } catch (error) {
    console.error("Error updating exercise:", error);
    return undefined;
  }
}
}


