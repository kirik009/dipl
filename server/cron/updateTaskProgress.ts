import { db } from "../db"; // путь к твоей drizzle-инстанции
import { taskProgress, tasks } from "../../shared/schema"; // таблица assignedTasks
import { eq, and } from "drizzle-orm";
import cron from "node-cron";
// Парсинг строки "HH:mm:ss" в миллисекунды
function parseTimeStringToMs(timeString: string): number {
  const [hours, minutes, seconds] = timeString.split(":").map(Number);
  return ((hours * 60 + minutes) * 60 + seconds) * 1000;
}
cron.schedule("* * * * *", async () => {

  const now = Date.now();

  // Шаг 1: Получить все активные task_progress
  const activeProgresses = await db
    .select()
    .from(taskProgress)
    .where(eq(taskProgress.isActive, true));

  for (const progress of activeProgresses) {
    // Шаг 2: Получить связанный task по taskId
    const [task] = await db.select().from(tasks).where(eq(tasks.id, Number(progress.taskId)));
    
    if (!task) continue;
    if (task.timeConstraint === "00:00:00") continue;
    const startedAt = new Date(progress.startedAt).getTime() - (3 * 60 * 60 * 1000);
    const durationMs = parseTimeStringToMs(task.timeConstraint);
    const endTime = startedAt + durationMs;
    
    if (now >= endTime) {
      console.log(
        `TaskProgress ${progress.id} истёк. Обновляем is_active = false`
      );
      // Шаг 4: Обновить is_active = false
      await db
        .update(taskProgress)
        .set({ completedAt: new Date(), isActive: false })
        .where(eq(taskProgress.id, progress.id));
    }
  }

  console.log("Cron завершён.");
}


);