
import { db } from '../db';
import { postsTable } from '../db/schema';
import { type GetPostInput, type Post } from '../schema';
import { eq } from 'drizzle-orm';

export const getPost = async (input: GetPostInput): Promise<Post | null> => {
  try {
    const result = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, input.id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    const post = result[0];
    return {
      id: post.id,
      content: post.content,
      like_count: post.like_count,
      created_at: post.created_at
    };
  } catch (error) {
    console.error('Get post failed:', error);
    throw error;
  }
};
