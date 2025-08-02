
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { postsTable } from '../db/schema';
import { type ToggleLikeInput } from '../schema';
import { toggleLike } from '../handlers/toggle_like';
import { eq } from 'drizzle-orm';

describe('toggleLike', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test post directly in the database
  const createTestPost = async (content: string = 'Test post for liking') => {
    const result = await db.insert(postsTable)
      .values({ content })
      .returning()
      .execute();
    return result[0];
  };

  it('should increment like count when action is like', async () => {
    // Create a test post directly
    const post = await createTestPost();

    const toggleInput: ToggleLikeInput = {
      post_id: post.id,
      action: 'like'
    };

    const result = await toggleLike(toggleInput);

    expect(result.id).toEqual(post.id);
    expect(result.content).toEqual('Test post for liking');
    expect(result.like_count).toEqual(1);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should decrement like count when action is unlike', async () => {
    // Create a test post with some likes
    const post = await createTestPost();
    
    // First like the post
    await toggleLike({
      post_id: post.id,
      action: 'like'
    });

    // Then unlike it
    const toggleInput: ToggleLikeInput = {
      post_id: post.id,
      action: 'unlike'
    };

    const result = await toggleLike(toggleInput);

    expect(result.id).toEqual(post.id);
    expect(result.like_count).toEqual(0);
  });

  it('should not allow negative like counts', async () => {
    // Create a test post with 0 likes
    const post = await createTestPost();

    const toggleInput: ToggleLikeInput = {
      post_id: post.id,
      action: 'unlike'
    };

    const result = await toggleLike(toggleInput);

    expect(result.like_count).toEqual(0);
  });

  it('should update like count in database', async () => {
    // Create a test post
    const post = await createTestPost();

    const toggleInput: ToggleLikeInput = {
      post_id: post.id,
      action: 'like'
    };

    await toggleLike(toggleInput);

    // Verify the like count was updated in the database
    const updatedPosts = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, post.id))
      .execute();

    expect(updatedPosts).toHaveLength(1);
    expect(updatedPosts[0].like_count).toEqual(1);
  });

  it('should handle multiple likes correctly', async () => {
    // Create a test post
    const post = await createTestPost();

    // Like the post multiple times
    await toggleLike({ post_id: post.id, action: 'like' });
    await toggleLike({ post_id: post.id, action: 'like' });
    const result = await toggleLike({ post_id: post.id, action: 'like' });

    expect(result.like_count).toEqual(3);
  });

  it('should throw error for non-existent post', async () => {
    const toggleInput: ToggleLikeInput = {
      post_id: 99999, // Non-existent post ID
      action: 'like'
    };

    await expect(() => toggleLike(toggleInput)).toThrow(/not found/i);
  });
});
