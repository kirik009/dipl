import { eq, GrammarTopic, grammarTopics, InsertGrammarTopic } from "@shared/schema";
import { db } from "server/db";

export async function getGrammarTopics(): Promise<GrammarTopic[]> {
  try {
    return await db.select().from(grammarTopics).orderBy(grammarTopics.id);
  } catch (error) {
    console.error("Error getting grammar topics:", error);
    return [];
  }
}

export async function getGrammarTopic(id: number): Promise<GrammarTopic | undefined> {
    try {
      const [topic] = await db.select().from(grammarTopics).where(eq(grammarTopics.id, id));
      return topic;
    } catch (error) {
      console.error("Error getting grammar topic:", error);
      return undefined;
    }
  }

 export async function createGrammarTopic(): Promise<GrammarTopic> {
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
  
 export async function deleteGrammarTopic(id: number): Promise<void> {
    try {
      await db.delete(grammarTopics).where(eq(grammarTopics.id, id));
    } catch (error) {
      console.error("Error deleting grammar topic:", error);
      throw new Error("Failed to delete grammar topic");
    }
  }
  export async function updateGrammarTopic(id: number, topicUpdate: Partial<InsertGrammarTopic>): Promise<GrammarTopic | undefined> {
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