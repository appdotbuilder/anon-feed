
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

import { 
  createPostInputSchema, 
  toggleLikeInputSchema, 
  createCommentInputSchema,
  getCommentsInputSchema,
  getPostInputSchema
} from './schema';
import { createPost } from './handlers/create_post';
import { getPosts } from './handlers/get_posts';
import { getPost } from './handlers/get_post';
import { toggleLike } from './handlers/toggle_like';
import { createComment } from './handlers/create_comment';
import { getComments } from './handlers/get_comments';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Post operations
  createPost: publicProcedure
    .input(createPostInputSchema)
    .mutation(({ input }) => createPost(input)),
  
  getPosts: publicProcedure
    .query(() => getPosts()),
  
  getPost: publicProcedure
    .input(getPostInputSchema)
    .query(({ input }) => getPost(input)),
  
  toggleLike: publicProcedure
    .input(toggleLikeInputSchema)
    .mutation(({ input }) => toggleLike(input)),
  
  // Comment operations
  createComment: publicProcedure
    .input(createCommentInputSchema)
    .mutation(({ input }) => createComment(input)),
  
  getComments: publicProcedure
    .input(getCommentsInputSchema)
    .query(({ input }) => getComments(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
