
import { db } from '../db';
import { postsTable } from '../db/schema';
import { type CreatePostInput, type Post } from '../schema';

export const createPost = async (input: CreatePostInput): Promise<Post> => {
  try {
    // Insert post record
    const result = await db.insert(postsTable)
      .values({
        content: input.content,
        like_count: 0 // Default value for new posts
      })
      .returning()
      .execute();

    const post = result[0];
    return {
      id: post.id,
      content: post.content,
      like_count: post.like_count,
      created_at: post.created_at
    };
  } catch (error) {
    console.error('Post creation failed:', error);
    throw error;
  }
};
