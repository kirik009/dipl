import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import './cron/updateAssignedStatus';
import './cron/updateTaskProgress';

import { storage } from "./storage";
import * as crypto from "crypto";

// Функция для создания администратора по умолчанию
async function ensureAdminExists() {
  try {
    const allUsers = await storage.getAllUsers();
    const adminExists = allUsers.some(user => user.role === "admin");
    
    if (!adminExists) {
      log("Администратор не найден. Создаю администратора по умолчанию...");
      
      const defaultAdmin = {
        username: "admin",
        password: crypto.createHash("sha256").update("admin123").digest("hex"),
        fullName: "Администратор",
        role: "admin"
      };
      
      await storage.createUser(defaultAdmin);
      log("Администратор по умолчанию создан! Логин: admin, Пароль: admin123");
    }
  } catch (error) {
    console.error("Ошибка при проверке/создании администратора:", error);
  }
}
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await ensureAdminExists();
  const server = await registerRoutes(app);
  
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = process.env.PORT || 5000;
  // Для совместимости с Windows не используем опцию reusePort
  server.listen(port, () => {
    log(`serving on port ${port}`);
  });
})();
