
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { postsTable } from '../db/schema';
import { type CreatePostInput } from '../schema';
import { getPosts } from '../handlers/get_posts';

describe('getPosts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no posts exist', async () => {
    const result = await getPosts();
    expect(result).toEqual([]);
  });

  it('should return all posts ordered by newest first', async () => {
    // Create test posts with slight delay to ensure different timestamps
    const firstPost = await db.insert(postsTable)
      .values({
        content: 'First post',
        like_count: 5
      })
      .returning()
      .execute();

    // Add small delay to ensure different created_at timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const secondPost = await db.insert(postsTable)
      .values({
        content: 'Second post',
        like_count: 10
      })
      .returning()
      .execute();

    const result = await getPosts();

    expect(result).toHaveLength(2);
    
    // Verify ordering - newest first
    expect(result[0].content).toEqual('Second post');
    expect(result[1].content).toEqual('First post');

    // Verify all fields are present and correctly typed
    expect(result[0].id).toBeDefined();
    expect(result[0].like_count).toEqual(10);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[1].id).toBeDefined();
    expect(result[1].like_count).toEqual(5);
    expect(result[1].created_at).toBeInstanceOf(Date);

    // Verify timestamp ordering
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });

  it('should handle single post correctly', async () => {
    await db.insert(postsTable)
      .values({
        content: 'Single post content',
        like_count: 3
      })
      .returning()
      .execute();

    const result = await getPosts();

    expect(result).toHaveLength(1);
    expect(result[0].content).toEqual('Single post content');
    expect(result[0].like_count).toEqual(3);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });
});
