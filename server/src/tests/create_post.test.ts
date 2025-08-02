
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { postsTable } from '../db/schema';
import { type CreatePostInput } from '../schema';
import { createPost } from '../handlers/create_post';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreatePostInput = {
  content: 'This is a test post for anonymous social media'
};

describe('createPost', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a post', async () => {
    const result = await createPost(testInput);

    // Basic field validation
    expect(result.content).toEqual('This is a test post for anonymous social media');
    expect(result.like_count).toEqual(0);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save post to database', async () => {
    const result = await createPost(testInput);

    // Query using proper drizzle syntax
    const posts = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, result.id))
      .execute();

    expect(posts).toHaveLength(1);
    expect(posts[0].content).toEqual('This is a test post for anonymous social media');
    expect(posts[0].like_count).toEqual(0);
    expect(posts[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle maximum content length', async () => {
    const longContent = 'a'.repeat(500); // Maximum allowed length
    const longInput: CreatePostInput = {
      content: longContent
    };

    const result = await createPost(longInput);

    expect(result.content).toEqual(longContent);
    expect(result.content.length).toEqual(500);
    expect(result.like_count).toEqual(0);
  });

  it('should create multiple posts with different content', async () => {
    const input1: CreatePostInput = { content: 'First post' };
    const input2: CreatePostInput = { content: 'Second post' };

    const result1 = await createPost(input1);
    const result2 = await createPost(input2);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.content).toEqual('First post');
    expect(result2.content).toEqual('Second post');
    expect(result1.like_count).toEqual(0);
    expect(result2.like_count).toEqual(0);

    // Verify both posts exist in database
    const allPosts = await db.select()
      .from(postsTable)
      .execute();

    expect(allPosts).toHaveLength(2);
  });
});
