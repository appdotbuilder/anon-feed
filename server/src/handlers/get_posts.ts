
import { db } from '../db';
import { postsTable } from '../db/schema';
import { type Post } from '../schema';
import { desc } from 'drizzle-orm';

export const getPosts = async (): Promise<Post[]> => {
  try {
    const results = await db.select()
      .from(postsTable)
      .orderBy(desc(postsTable.like_count), desc(postsTable.created_at)) // Sort by like_count DESC, then created_at DESC
      .execute();

    // Return posts with proper type structure
    return results;
  } catch (error) {
    console.error('Get posts failed:', error);
    throw error;
  }
};
