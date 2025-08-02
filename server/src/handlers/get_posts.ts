
import { db } from '../db';
import { postsTable } from '../db/schema';
import { type Post } from '../schema';
import { desc } from 'drizzle-orm';

export const getPosts = async (): Promise<Post[]> => {
  try {
    const results = await db.select()
      .from(postsTable)
      .orderBy(desc(postsTable.created_at))
      .execute();

    // Return posts with proper type structure
    return results;
  } catch (error) {
    console.error('Get posts failed:', error);
    throw error;
  }
};
