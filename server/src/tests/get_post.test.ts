
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { postsTable } from '../db/schema';
import { type GetPostInput } from '../schema';
import { getPost } from '../handlers/get_post';

describe('getPost', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a post when it exists', async () => {
    // Create a test post
    const insertResult = await db.insert(postsTable)
      .values({
        content: 'Test post content',
        like_count: 5
      })
      .returning()
      .execute();

    const createdPost = insertResult[0];

    // Test getting the post
    const input: GetPostInput = {
      id: createdPost.id
    };

    const result = await getPost(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdPost.id);
    expect(result!.content).toEqual('Test post content');
    expect(result!.like_count).toEqual(5);
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null when post does not exist', async () => {
    const input: GetPostInput = {
      id: 999 // Non-existent ID
    };

    const result = await getPost(input);

    expect(result).toBeNull();
  });

  it('should return correct post data types', async () => {
    // Create a test post
    const insertResult = await db.insert(postsTable)
      .values({
        content: 'Another test post',
        like_count: 10
      })
      .returning()
      .execute();

    const createdPost = insertResult[0];

    const input: GetPostInput = {
      id: createdPost.id
    };

    const result = await getPost(input);

    expect(result).not.toBeNull();
    expect(typeof result!.id).toBe('number');
    expect(typeof result!.content).toBe('string');
    expect(typeof result!.like_count).toBe('number');
    expect(result!.created_at).toBeInstanceOf(Date);
  });
});
