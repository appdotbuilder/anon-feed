
import { serial, text, pgTable, timestamp, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const postsTable = pgTable('posts', {
  id: serial('id').primaryKey(),
  content: text('content').notNull(),
  like_count: integer('like_count').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const commentsTable = pgTable('comments', {
  id: serial('id').primaryKey(),
  post_id: integer('post_id').notNull(),
  content: text('content').notNull(),
  emoji_id: text('emoji_id').notNull(), // Consistent emoji identifier for anonymous user within a post
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Define relations between posts and comments
export const postsRelations = relations(postsTable, ({ many }) => ({
  comments: many(commentsTable),
}));

export const commentsRelations = relations(commentsTable, ({ one }) => ({
  post: one(postsTable, {
    fields: [commentsTable.post_id],
    references: [postsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Post = typeof postsTable.$inferSelect;
export type NewPost = typeof postsTable.$inferInsert;
export type Comment = typeof commentsTable.$inferSelect;
export type NewComment = typeof commentsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  posts: postsTable, 
  comments: commentsTable 
};
