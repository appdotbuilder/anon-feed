
import { z } from 'zod';

// Post schema
export const postSchema = z.object({
  id: z.number(),
  content: z.string(),
  like_count: z.number().int(),
  created_at: z.coerce.date()
});

export type Post = z.infer<typeof postSchema>;

// Input schema for creating posts
export const createPostInputSchema = z.object({
  content: z.string().min(1).max(500) // Enforce 500 character limit
});

export type CreatePostInput = z.infer<typeof createPostInputSchema>;

// Input schema for liking/unliking posts
export const toggleLikeInputSchema = z.object({
  post_id: z.number(),
  action: z.enum(['like', 'unlike'])
});

export type ToggleLikeInput = z.infer<typeof toggleLikeInputSchema>;

// Comment schema
export const commentSchema = z.object({
  id: z.number(),
  post_id: z.number(),
  content: z.string(),
  emoji_id: z.string(), // Consistent emoji identifier for anonymous user within a post
  created_at: z.coerce.date()
});

export type Comment = z.infer<typeof commentSchema>;

// Input schema for creating comments
export const createCommentInputSchema = z.object({
  post_id: z.number(),
  content: z.string().min(1).max(500),
  emoji_id: z.string() // Client generates consistent emoji ID for anonymous user
});

export type CreateCommentInput = z.infer<typeof createCommentInputSchema>;

// Schema for getting comments by post
export const getCommentsInputSchema = z.object({
  post_id: z.number()
});

export type GetCommentsInput = z.infer<typeof getCommentsInputSchema>;

// Schema for getting a single post
export const getPostInputSchema = z.object({
  id: z.number()
});

export type GetPostInput = z.infer<typeof getPostInputSchema>;
