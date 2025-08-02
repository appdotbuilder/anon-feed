
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { postsTable, commentsTable } from '../db/schema';
import { type GetCommentsInput, type CreatePostInput, type CreateCommentInput } from '../schema';
import { getComments } from '../handlers/get_comments';

// Test data
const testPost: CreatePostInput = {
  content: 'Test post for comments'
};

const testComment1: Omit<CreateCommentInput, 'post_id'> = {
  content: 'First comment',
  emoji_id: '😀'
};

const testComment2: Omit<CreateCommentInput, 'post_id'> = {
  content: 'Second comment',
  emoji_id: '😎'
};

describe('getComments', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when post has no comments', async () => {
    // Create a post
    const postResult = await db.insert(postsTable)
      .values(testPost)
      .returning()
      .execute();

    const input: GetCommentsInput = {
      post_id: postResult[0].id
    };

    const result = await getComments(input);

    expect(result).toEqual([]);
  });

  it('should return comments for a specific post', async () => {
    // Create a post
    const postResult = await db.insert(postsTable)
      .values(testPost)
      .returning()
      .execute();

    const postId = postResult[0].id;

    // Create comments for the post
    await db.insert(commentsTable)
      .values([
        {
          post_id: postId,
          content: testComment1.content,
          emoji_id: testComment1.emoji_id
        },
        {
          post_id: postId,
          content: testComment2.content,
          emoji_id: testComment2.emoji_id
        }
      ])
      .execute();

    const input: GetCommentsInput = {
      post_id: postId
    };

    const result = await getComments(input);

    expect(result).toHaveLength(2);
    expect(result[0].content).toEqual('First comment');
    expect(result[0].emoji_id).toEqual('😀');
    expect(result[0].post_id).toEqual(postId);
    expect(result[0].created_at).toBeInstanceOf(Date);
    
    expect(result[1].content).toEqual('Second comment');
    expect(result[1].emoji_id).toEqual('😎');
    expect(result[1].post_id).toEqual(postId);
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should return comments ordered by creation date (oldest first)', async () => {
    // Create a post
    const postResult = await db.insert(postsTable)
      .values(testPost)
      .returning()
      .execute();

    const postId = postResult[0].id;

    // Create first comment
    const firstComment = await db.insert(commentsTable)
      .values({
        post_id: postId,
        content: 'First comment',
        emoji_id: '😀'
      })
      .returning()
      .execute();

    // Wait a moment to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Create second comment
    const secondComment = await db.insert(commentsTable)
      .values({
        post_id: postId,
        content: 'Second comment',
        emoji_id: '😎'
      })
      .returning()
      .execute();

    const input: GetCommentsInput = {
      post_id: postId
    };

    const result = await getComments(input);

    expect(result).toHaveLength(2);
    // Verify chronological order (oldest first)
    expect(result[0].created_at.getTime()).toBeLessThanOrEqual(result[1].created_at.getTime());
    expect(result[0].content).toEqual('First comment');
    expect(result[1].content).toEqual('Second comment');
  });

  it('should only return comments for the specified post', async () => {
    // Create two posts
    const post1Result = await db.insert(postsTable)
      .values({ content: 'Post 1' })
      .returning()
      .execute();

    const post2Result = await db.insert(postsTable)
      .values({ content: 'Post 2' })
      .returning()
      .execute();

    const post1Id = post1Result[0].id;
    const post2Id = post2Result[0].id;

    // Create comments for both posts
    await db.insert(commentsTable)
      .values([
        {
          post_id: post1Id,
          content: 'Comment on post 1',
          emoji_id: '😀'
        },
        {
          post_id: post2Id,
          content: 'Comment on post 2',
          emoji_id: '😎'
        }
      ])
      .execute();

    const input: GetCommentsInput = {
      post_id: post1Id
    };

    const result = await getComments(input);

    expect(result).toHaveLength(1);
    expect(result[0].content).toEqual('Comment on post 1');
    expect(result[0].post_id).toEqual(post1Id);
  });
});
