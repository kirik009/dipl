import {type User, type InsertUser, 
  type Exercise, type InsertExercise, 
  type ExerciseProgress, type InsertExerciseProgress, 
  Task,
  InsertTask,
  InsertTaskProgress,
  TaskProgress,
  InsertAssignedTask,
  AssingedTask
} from "@shared/schema";
import session from "express-session";

// Interfaces for storage methods

import { DatabaseStorage } from "./database-storage";

export const storage = new DatabaseStorage() 
