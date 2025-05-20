 import type { Express } from "express";
 
 import { storage } from "../storage";
 import { insertExerciseSchema,  submitExerciseSchema, insertTaskSchema, insertTaskProgressSchema } from "@shared/schema";
 import { z } from "zod";
 
 export async function taskRoutes(app: Express) { 

 app.get("/api/tasks", async (req, res, next) => {
      try {
        const tasks = await storage.getTasks();
        res.json(tasks);
      } catch (error) {
        next(error);
      }
    });

    
    app.get("/api/newTask/:userId", async (req, res, next) => {
      try {
        const userId = parseInt(req.params.userId);
        const task = await storage.getLatestTask(userId);
        res.json(task);
      } catch (error) {
        next(error);
      }
    });


     app.post("/api/tasks", async (req, res, next) => {
              try {
                if (!req.isAuthenticated() || !['admin', 'teacher'].includes(req.user.role)) {
                  return res.status(403).json({ message: "Not authorized" });
                }
                
                const validatedData = insertTaskSchema.parse(req.body);
                const task = await storage.createTask({
                  ...validatedData,
                  createdBy: req.user.id,
                });
                
                res.status(201).json(task);
              } catch (error) {
                if (error instanceof z.ZodError) {
                  return res.status(400).json({ 
                    message: "Validation error", 
                    errors: error.errors 
                  });
                }
                next(error);
              }
            });


    app.get("/api/tasks/:id", async (req, res, next) => {
      try {
        const taskId = parseInt(req.params.id);
        const task = await storage.getTask(taskId);
        
        if (!task) {
          return res.status(404).json({ message: "Task not found" });
        }
        
        res.json(task);
      } catch (error) {
        next(error);
      }
    });

    app.get("/api/task_prog/:id", async (req, res, next) => {
      try {
        const id = parseInt(req.params.id);
        
        const taskProgress = await storage.getTaskProgress(id);
        
        if (!taskProgress) {
          return res.status(404).json({ message: "Task progress not found" });
        }
        
        res.json(taskProgress);
      } catch (error) {
        next(error);
      }
    });

        app.get("/api/task_prog/:taskId/:userId", async (req, res, next) => {
      try {
        const taskId = parseInt(req.params.taskId);
        const userId = parseInt(req.params.userId);
        const taskProgress = await storage.getUserTaskProgress(userId, taskId);
        
        if (!taskProgress) {
          return res.status(404).json({ message: "Task progress not found" });
        }
        
        res.json(taskProgress);
      } catch (error) {
        next(error);
      }
    });

     app.get("/api/last_task_prog/:id", async (req, res, next) => {
      try {
        const id = parseInt(req.params.id);
        const taskProgress = await storage.getLastTaskProgress(id);
        
        if (!taskProgress) {
          return res.status(404).json({ message: "Task progress not found" });
        }
        
        res.json(taskProgress);
      } catch (error) {
        next(error);
      }
    });

    app.post("/api/tasks/prog", async (req, res, next) => {
        try {
          if (!req.isAuthenticated()) {
            return res.status(403).json({ message: "Not authorized" });
          }
          
          const validatedData = insertTaskProgressSchema.parse(req.body);
          const taskProgress = await storage.createTaskProgress({
            ...validatedData,
          });
          
          res.status(201).json(taskProgress);
        } catch (error) {
          if (error instanceof z.ZodError) {
            return res.status(400).json({ 
              message: "Validation error", 
              errors: error.errors 
            });
          }
          next(error);
        }
      });

      app.put("/api/tasks/:id", async (req, res, next) => {
          try {
            if (!req.isAuthenticated() || !['admin', 'teacher'].includes(req.user.role)) {
              return res.status(403).json({ message: "Not authorized" });
            }
            
            const taskId = parseInt(req.params.id);
            const validatedData = insertTaskSchema.parse(req.body);
            
            const updatedTask = await storage.updateTask(taskId, validatedData);
            
            if (!updatedTask) {
              return res.status(404).json({ message: "Exercise not found" });
            }
            
            res.json(updatedTask);
          } catch (error) {
            if (error instanceof z.ZodError) {
              return res.status(400).json({ 
                message: "Validation error", 
                errors: error.errors 
              });
            }
            next(error);
          }
        });


        app.patch("/api/task_prog/:id", async (req, res, next) => {
          try {
            if (!req.isAuthenticated()) {
              return res.status(403).json({ message: "Not authorized" });
            }
            
            const taskProgId = parseInt(req.params.id);
          
            const  num = req.body.correctAnswers
            const isActive = req.body.isActive
            const updatedTask = await storage.updateTaskProg(taskProgId, num, isActive);
            
            if (!updatedTask) {
              return res.status(404).json({ message: "Exercise not found" });
            }
            res.json(updatedTask);
          } catch (error) {
            if (error instanceof z.ZodError) {
              return res.status(400).json({ 
                message: "Validation error", 
                errors: error.errors 
              });
            }
            next(error);
          }
        });


        app.delete("/api/tasks/:id", async (req, res, next) => {
            try {
              if (!req.isAuthenticated() || !['admin', 'teacher'].includes(req.user.role)) {
                return res.status(403).json({ message: "Not authorized" });
              }
              
              const taskId = parseInt(req.params.id);
              await storage.deleteTask(taskId);
              
              res.sendStatus(204);
            } catch (error) {
              next(error);
            }
          });

              app.get("/api/task_prog_task_/:id", async (req, res, next) => {
      try {
        const id = parseInt(req.params.id);
        
        const taskProgress = await storage.getTaskProgress(id);
        
        if (!taskProgress) {
          return res.status(404).json({ message: "Task progress not found" });
        }
        
        res.json(taskProgress);
      } catch (error) {
        next(error);
      }
    });

}