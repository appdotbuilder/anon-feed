
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { postsTable, commentsTable } from '../db/schema';
import { type CreateCommentInput } from '../schema';
import { createComment } from '../handlers/create_comment';
import { eq } from 'drizzle-orm';

describe('createComment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a comment', async () => {
    // Create a test post first
    const postResult = await db.insert(postsTable)
      .values({
        content: 'Test post for commenting'
      })
      .returning()
      .execute();
    const post = postResult[0];

    const testInput: CreateCommentInput = {
      post_id: post.id,
      content: 'This is a test comment',
      emoji_id: '🐱'
    };

    const result = await createComment(testInput);

    // Basic field validation
    expect(result.post_id).toEqual(post.id);
    expect(result.content).toEqual('This is a test comment');
    expect(result.emoji_id).toEqual('🐱');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save comment to database', async () => {
    // Create a test post first
    const postResult = await db.insert(postsTable)
      .values({
        content: 'Test post for commenting'
      })
      .returning()
      .execute();
    const post = postResult[0];

    const testInput: CreateCommentInput = {
      post_id: post.id,
      content: 'This is a test comment',
      emoji_id: '🐱'
    };

    const result = await createComment(testInput);

    // Query using proper drizzle syntax
    const comments = await db.select()
      .from(commentsTable)
      .where(eq(commentsTable.id, result.id))
      .execute();

    expect(comments).toHaveLength(1);
    expect(comments[0].post_id).toEqual(post.id);
    expect(comments[0].content).toEqual('This is a test comment');
    expect(comments[0].emoji_id).toEqual('🐱');
    expect(comments[0].created_at).toBeInstanceOf(Date);
  });

  it('should allow multiple comments from same emoji_id', async () => {
    // Create a test post first
    const postResult = await db.insert(postsTable)
      .values({
        content: 'Test post for commenting'
      })
      .returning()
      .execute();
    const post = postResult[0];

    const testInput1: CreateCommentInput = {
      post_id: post.id,
      content: 'First comment',
      emoji_id: '🐱'
    };

    const testInput2: CreateCommentInput = {
      post_id: post.id,
      content: 'Second comment',
      emoji_id: '🐱'
    };

    const result1 = await createComment(testInput1);
    const result2 = await createComment(testInput2);

    // Both comments should have the same emoji_id but different IDs
    expect(result1.emoji_id).toEqual('🐱');
    expect(result2.emoji_id).toEqual('🐱');
    expect(result1.id).not.toEqual(result2.id);
  });

  it('should handle different emoji_ids for different anonymous users', async () => {
    // Create a test post first
    const postResult = await db.insert(postsTable)
      .values({
        content: 'Test post for commenting'
      })
      .returning()
      .execute();
    const post = postResult[0];

    const testInput1: CreateCommentInput = {
      post_id: post.id,
      content: 'Comment from cat user',
      emoji_id: '🐱'
    };

    const testInput2: CreateCommentInput = {
      post_id: post.id,
      content: 'Comment from dog user',
      emoji_id: '🐶'
    };

    const result1 = await createComment(testInput1);
    const result2 = await createComment(testInput2);

    // Comments should have different emoji_ids
    expect(result1.emoji_id).toEqual('🐱');
    expect(result2.emoji_id).toEqual('🐶');
    expect(result1.post_id).toEqual(post.id);
    expect(result2.post_id).toEqual(post.id);
  });
});
