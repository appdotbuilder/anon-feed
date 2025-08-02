
import { db } from '../db';
import { commentsTable } from '../db/schema';
import { type GetCommentsInput, type Comment } from '../schema';
import { eq, asc } from 'drizzle-orm';

export const getComments = async (input: GetCommentsInput): Promise<Comment[]> => {
  try {
    const results = await db.select()
      .from(commentsTable)
      .where(eq(commentsTable.post_id, input.post_id))
      .orderBy(asc(commentsTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get comments:', error);
    throw error;
  }
};
