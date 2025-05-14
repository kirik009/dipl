import { IStorage } from "./storage";
import connectPg from "connect-pg-simple";
import session from "express-session";
import { pool } from "./db";
import * as assignedExercisesOps from "./database-storage/assignTasks";
import * as usersOps from "./database-storage/users";
import * as exercisesOps from "./database-storage/exercises";
import * as exerciseProgressOps from "./database-storage/exerciseProgress";
import * as taskProgressOps from "./database-storage/taskProgress";
import * as tasksOps from "./database-storage/tasks";
import * as grammarTopicsOps from "./database-storage/grammar-topics";
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({
      pool: pool,  // Type assertion to avoid type errors
      createTableIfMissing: true
    });
  }
  
 
  getAssignedTasks = assignedExercisesOps.getAssignedTasks;
  getAssignedExpiredTasks = assignedExercisesOps.getAssignedExpiredTasks;
  getAssignedSolvedTasks = assignedExercisesOps.getAssignedSolvedTasks;
  updateAssignedTask = assignedExercisesOps.updateAssignedTask;
  createAssignedTask = assignedExercisesOps.createAssignedTask;
  deleteAssignedTask= assignedExercisesOps.deleteAssignedTask;

  
  getUser = usersOps.getUser;

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
getExerciseProgressSummary = exerciseProgressOps.getExerciseProgressSummary;

 createExerciseProgress = exerciseProgressOps.createExerciseProgress;
  
  

getTaskProgress = taskProgressOps.getTaskProgress;
getTaskProgressSummary = taskProgressOps.getTaskProgressSummary; 

  createTaskProgress = taskProgressOps.createTaskProgress;


getLatestTask = tasksOps.getLatestTask;



getGrammarTopics = grammarTopicsOps.getGrammarTopics;

getGrammarTopic = grammarTopicsOps.getGrammarTopic;

createGrammarTopic = grammarTopicsOps.createGrammarTopic;

deleteGrammarTopic = grammarTopicsOps.deleteGrammarTopic;

updateGrammarTopic = grammarTopicsOps.updateGrammarTopic;

}


