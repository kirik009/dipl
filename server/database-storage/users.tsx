import { eq, InsertUser, User, users } from "@shared/schema";
import { db } from "server/db";
import * as crypto from "crypto";
 function hashPassword(password: string) {
    
    return crypto.createHash("sha256").update(password).digest("hex");
  }
  export async function getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error("Error getting user:", error);
      return undefined;
    }
  }

   export async function getUserByUsername(username: string): Promise<User | undefined> {
      try {
        const [user] = await db.select().from(users).where(eq(users.username, username));
        return user;
      } catch (error) {
        console.error("Error getting user by username:", error);
        return undefined;
      }
    }

    export  async function createUser(user: InsertUser): Promise<User> {
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
  
      export async function updateUser(id: number, userUpdate: Partial<InsertUser>): Promise<User | undefined> {
          try {
            // Hash password if it's included in the update
            if (userUpdate.password) {
              userUpdate.password = hashPassword(userUpdate.password);
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

        export  async function getAllUsers(): Promise<User[]> {
            try {
              return await db.select().from(users);
            } catch (error) {
              console.error("Error getting all users:", error);
              return [];
            }
          }