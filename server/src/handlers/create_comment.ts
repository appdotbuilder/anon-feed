
import { db } from '../db';
import { commentsTable } from '../db/schema';
import { type CreateCommentInput, type Comment } from '../schema';

export const createComment = async (input: CreateCommentInput): Promise<Comment> => {
  try {
    // Insert comment record
    const result = await db.insert(commentsTable)
      .values({
        post_id: input.post_id,
        content: input.content,
        emoji_id: input.emoji_id
      })
      .returning()
      .execute();

    const comment = result[0];
    return comment;
  } catch (error) {
    console.error('Comment creation failed:', error);
    throw error;
  }
};
