import { IStorage } from "./storage";
import connectPg from "connect-pg-simple";
import session from "express-session";
import { pool } from "./db";
import * as assignedTasksOps from "./database-storage/assignTasks";
import * as usersOps from "./database-storage/users";
import * as exercisesOps from "./database-storage/exercises";
import * as exerciseProgressOps from "./database-storage/exerciseProgress";
import * as taskProgressOps from "./database-storage/taskProgress";
import * as tasksOps from "./database-storage/tasks";
import * as grammarTopicsOps from "./database-storage/grammar-topics";
import { AssingedTask, TaskProgress } from "@shared/schema";
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({
      pool: pool,  // Type assertion to avoid type errors
      createTableIfMissing: true
    });
  }
  
 getUserTaskProgress = taskProgressOps.getUserTaskProgress;
  getAssignedTasks = assignedTasksOps.getAssignedTasks;
  getAssignedExpiredTasks = assignedTasksOps.getAssignedExpiredTasks;
  getAssignedSolvedTasks = assignedTasksOps.getAssignedSolvedTasks;
  updateAssignedTask = assignedTasksOps.updateAssignedTask;
  createAssignedTask = assignedTasksOps.createAssignedTask;
  deleteAssignedTask= assignedTasksOps.deleteAssignedTask;
  solveAssignedTask = assignedTasksOps.solvAssignedTask
  
  getUser = usersOps.getUser;
  deleteUser = usersOps.deleteUser;
 getUserByUsername = usersOps.getUserByUsername;
 createUser = usersOps.createUser;
  updateUser = usersOps.updateUser;
  
  getAllUsers = usersOps.getAllUsers;
  
  getExercise = exercisesOps.getExercise;

  getExercises = exercisesOps.getExercises;
  createExercise = exercisesOps.createExercise;

  updateExercise = exercisesOps.updateExercise;
 deleteExercise = exercisesOps.deleteExercise;

  deleteExercises = exercisesOps.deleteExercises;
  getTask = tasksOps.getTask;
  getTasks = tasksOps.getTasks;
  getTaskExercise = exercisesOps.getTaskExercise;
  getTaskExercises = exercisesOps.getTaskExercises;
  getNewTaskExercises = exercisesOps.getNewTaskExercises;
  assignTaskIdToUnassignedExercises = exercisesOps.assignTaskIdToUnassignedExercises;
  getTaskExerciseProgs = exerciseProgressOps.getTaskExerciseProgs;
  

  createTask = tasksOps.createTask;
  updateTask = tasksOps.updateTask;

  updateTaskProg = taskProgressOps.updateTaskProg;

  deleteTask = tasksOps.deleteTask;
updateExerciseProgress = exerciseProgressOps.updateExerciseProgress;
getLastTaskProgress = taskProgressOps.getLastTaskProgress;
 getExerciseProgress = exerciseProgressOps.getExerciseProgress;
getLastExerciseProgress = exerciseProgressOps.getLastExerciseProgress;


 createExerciseProgress = exerciseProgressOps.createExerciseProgress;
  
  

getTaskProgress = taskProgressOps.getTaskProgress;

  createTaskProgress = taskProgressOps.createTaskProgress;


getLatestTask = tasksOps.getLatestTask;



getGrammarTopics = grammarTopicsOps.getGrammarTopics;

getGrammarTopic = grammarTopicsOps.getGrammarTopic;

createGrammarTopic = grammarTopicsOps.createGrammarTopic;

deleteGrammarTopic = grammarTopicsOps.deleteGrammarTopic;

updateGrammarTopic = grammarTopicsOps.updateGrammarTopic;

}


