import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { User } from "@shared/schema";
import { taskRoutes } from "./routes/taskRoutes";
import { exerciseRoutes } from "./routes/exerciseRoutes";

import { assignTasksRoutes } from "./routes/assignTasksRoutes";
import * as crypto from "crypto";
export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  taskRoutes(app);
  exerciseRoutes(app);
  assignTasksRoutes(app);
  function hashPassword(password: string) {
    return crypto.createHash("sha256").update(password).digest("hex");
  }
  function comparePasswords(supplied: string, stored: string) {
    try {
      const suppliedHash = hashPassword(supplied);

      return suppliedHash.trim() === stored.trim();
    } catch (error) {
      console.error("Error comparing passwords:", error);
      return false;
    }
  }
  // Admin user management routes
  app.get("/api/admin/users", async (req, res, next) => {
    try {
      if (
        !req.isAuthenticated() ||
        !["admin", "teacher"].includes(req.user.role)
      ) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const users = await storage.getAllUsers();
      // Remove passwords from response
      const usersWithoutPasswords = users.map((user) => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      res.json(usersWithoutPasswords);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/admin/users/:id", async (req, res, next) => {
    try {
      // Проверка авторизации и роли
      if (!req.isAuthenticated() || req.user.role !== "admin") {
        return res.status(403).json({ message: "Not authorized" });
      }

      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const { fullName, username, role, password } = req.body;

      // Формируем объект обновления
      const userUpdate: Partial<User> = {};
      if (fullName !== undefined) userUpdate.fullName = fullName;
      if (username !== undefined) userUpdate.username = username;
      if (role !== undefined) userUpdate.role = role;
      if (password !== undefined) userUpdate.password = password; // Внутри storage будет захеширован

      const updatedUser = await storage.updateUser(id, userUpdate);

      if (!updatedUser) {
        return res
          .status(404)
          .json({ message: "User not found or update failed" });
      }

      // Убираем пароль перед отправкой
      const { password: _, ...userWithoutPassword } = updatedUser;

      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/user/:id", async (req, res, next) => {
    try {
      // Проверка авторизации
      if (!req.isAuthenticated()) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      const { currentPassword, fullName, username, role, newPassword } =
        req.body;
      const use = await storage.getUser(id);
      if (currentPassword === "") {
        const userUpdate: Partial<User> = {};
        if (fullName !== undefined) userUpdate.fullName = fullName;
        if (username !== undefined) userUpdate.username = username;
        if (role !== undefined) userUpdate.role = role;

        const updatedUser = await storage.updateUser(id, userUpdate);

        if (!updatedUser) {
          return res
            .status(404)
            .json({ message: "User not found or update failed" });
        }

        // Убираем пароль перед отправкой
        const { password: _, ...userWithoutPassword } = updatedUser;

        res.json(userWithoutPassword);
      } else {
        if (!comparePasswords(currentPassword, use?.password!)) {
          return res
            .status(400)
            .json({ message: "Настоящий пароль введен неверно" });
        }
        const userUpdate: Partial<User> = {};
        if (fullName !== undefined) userUpdate.fullName = fullName;
        if (username !== undefined) userUpdate.username = username;
        if (role !== undefined) userUpdate.role = role;
        if (newPassword !== undefined) userUpdate.password = newPassword; // Внутри storage будет захеширован

        const updatedUser = await storage.updateUser(id, userUpdate);

        if (!updatedUser) {
          return res
            .status(404)
            .json({ message: "User not found or update failed" });
        }

        // Убираем пароль перед отправкой
        const { password: _, ...userWithoutPassword } = updatedUser;

        res.json(userWithoutPassword);
      }
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/admin/users/:id", async (req, res, next) => {
    try {
      // Проверка авторизации и роли
      if (!req.isAuthenticated() || req.user.role !== "admin") {
        return res.status(403).json({ message: "Not authorized" });
      }

      const userId = Number(req.params.id);

      await storage.deleteUser(userId);

      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  return createServer(app);
}
