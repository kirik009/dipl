import cron from "node-cron";
import { db } from "../db"; // путь к твоей drizzle-инстанции
import { assignedTasks } from "../../shared/schema"; // таблица assignedTasks
import { eq, and, lt } from "drizzle-orm";
import { query } from "express";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";


// Запуск каждый час
// cron.schedule("0 * * * *", async () => {
// Запуск каждую минуту
  cron.schedule("* * * * *", async () => {
  const now = new Date();

  await db
    .update(assignedTasks)
    .set({ status: "expired" }) // или другой статус
    .where(
      and(
        lt(assignedTasks.dueDate, now),
        eq(assignedTasks.status, "pending") // только те, что ещё активны
      )
    );

});