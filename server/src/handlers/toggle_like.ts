
import { db } from '../db';
import { postsTable } from '../db/schema';
import { type ToggleLikeInput, type Post } from '../schema';
import { eq, sql } from 'drizzle-orm';

export const toggleLike = async (input: ToggleLikeInput): Promise<Post> => {
  try {
    // First, verify the post exists
    const existingPost = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, input.post_id))
      .execute();

    if (existingPost.length === 0) {
      throw new Error(`Post with id ${input.post_id} not found`);
    }

    // Update like count based on action
    const result = await db.update(postsTable)
      .set({
        like_count: input.action === 'like' 
          ? sql`${postsTable.like_count} + 1`
          : sql`GREATEST(${postsTable.like_count} - 1, 0)` // Prevent negative likes
      })
      .where(eq(postsTable.id, input.post_id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Toggle like failed:', error);
    throw error;
  }
};
