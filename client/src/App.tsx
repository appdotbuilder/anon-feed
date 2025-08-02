
import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Heart, MessageCircle, Plus } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Post, CreatePostInput, Comment, CreateCommentInput } from '../../server/src/schema';

// Sample data for demonstration since handlers are stubs
const SAMPLE_POSTS: Post[] = [
  {
    id: 1,
    content: "Just discovered the most amazing coffee shop downtown! ☕ The atmosphere is perfect for reading and the barista makes incredible latte art. Anyone else been there?",
    like_count: 12,
    created_at: new Date('2024-01-15T10:30:00Z')
  },
  {
    id: 2,
    content: "Watching the sunset from my balcony and feeling grateful for these peaceful moments. Sometimes we forget to appreciate the simple beauty around us 🌅",
    like_count: 24,
    created_at: new Date('2024-01-15T09:15:00Z')
  },
  {
    id: 3,
    content: "Does anyone else think that pineapple on pizza is actually delicious? I'm ready to defend this hill! 🍕🍍",
    like_count: 8,
    created_at: new Date('2024-01-15T08:45:00Z')
  }
];

const SAMPLE_COMMENTS: Comment[] = [
  {
    id: 1,
    post_id: 1,
    content: "I think I know which one you mean! Is it the one with the brick walls?",
    emoji_id: "🐱",
    created_at: new Date('2024-01-15T11:00:00Z')
  },
  {
    id: 2,
    post_id: 1,
    content: "Yes! Their croissants are amazing too",
    emoji_id: "🌟",
    created_at: new Date('2024-01-15T11:15:00Z')
  }
];

const EMOJI_POOL = ["🐱", "🌟", "🦋", "🌸", "🎨", "🎭", "🦄", "🌈", "⭐", "🌙", "🍀", "🌺", "🎪", "🎯", "🎲"];

function App() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [userEmojiIds, setUserEmojiIds] = useState<Record<number, string>>({});
  
  // Form states
  const [newPostContent, setNewPostContent] = useState('');
  const [newCommentContent, setNewCommentContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Touch handling
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchEndRef = useRef<{ x: number; y: number } | null>(null);

  const loadPosts = useCallback(async () => {
    try {
      const result = await trpc.getPosts.query();
      // Using sample data since backend is stub
      setPosts(result.length > 0 ? result : SAMPLE_POSTS);
    } catch (error) {
      console.error('Failed to load posts:', error);
      // Fallback to sample data
      setPosts(SAMPLE_POSTS);
    }
  }, []);

  const loadComments = useCallback(async (postId: number) => {
    try {
      const result = await trpc.getComments.query({ post_id: postId });
      // Using sample data since backend is stub
      setComments(result.length > 0 ? result : SAMPLE_COMMENTS.filter(c => c.post_id === postId));
    } catch (error) {
      console.error('Failed to load comments:', error);
      // Fallback to sample data
      setComments(SAMPLE_COMMENTS.filter(c => c.post_id === postId));
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const getUserEmojiId = (postId: number): string => {
    if (userEmojiIds[postId]) {
      return userEmojiIds[postId];
    }
    
    const existingEmojis = comments
      .filter(c => c.post_id === postId)
      .map(c => c.emoji_id);
    
    const availableEmojis = EMOJI_POOL.filter(emoji => !existingEmojis.includes(emoji));
    const randomEmoji = availableEmojis[Math.floor(Math.random() * availableEmojis.length)] || EMOJI_POOL[0];
    
    setUserEmojiIds(prev => ({ ...prev, [postId]: randomEmoji }));
    return randomEmoji;
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    setIsLoading(true);
    try {
      const postData: CreatePostInput = { content: newPostContent.trim() };
      const newPost = await trpc.createPost.mutate(postData);
      setPosts((prev: Post[]) => [newPost, ...prev]);
      setNewPostContent('');
      setShowCreatePost(false);
    } catch (error) {
      console.error('Failed to create post:', error);
      // Create stub post for demo
      const stubPost: Post = {
        id: Date.now(),
        content: newPostContent.trim(),
        like_count: 0,
        created_at: new Date()
      };
      setPosts((prev: Post[]) => [stubPost, ...prev]);
      setNewPostContent('');
      setShowCreatePost(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentContent.trim() || !posts[currentPostIndex]) return;

    setIsLoading(true);
    try {
      const currentPost = posts[currentPostIndex];
      const emojiId = getUserEmojiId(currentPost.id);
      
      const commentData: CreateCommentInput = {
        post_id: currentPost.id,
        content: newCommentContent.trim(),
        emoji_id: emojiId
      };
      
      const newComment = await trpc.createComment.mutate(commentData);
      setComments((prev: Comment[]) => [...prev, newComment]);
      setNewCommentContent('');
    } catch (error) {
      console.error('Failed to create comment:', error);
      // Create stub comment for demo
      const currentPost = posts[currentPostIndex];
      const emojiId = getUserEmojiId(currentPost.id);
      const stubComment: Comment = {
        id: Date.now(),
        post_id: currentPost.id,
        content: newCommentContent.trim(),
        emoji_id: emojiId,
        created_at: new Date()
      };
      setComments((prev: Comment[]) => [...prev, stubComment]);
      setNewCommentContent('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (postId: number, isCurrentlyLiked: boolean) => {
    try {
      const action = isCurrentlyLiked ? 'unlike' : 'like';
      const updatedPost = await trpc.toggleLike.mutate({ post_id: postId, action });
      
      setPosts((prev: Post[]) => prev.map(post => 
        post.id === postId ? updatedPost : post
      ));
      
      setLikedPosts((prev: Set<number>) => {
        const newSet = new Set(prev);
        if (isCurrentlyLiked) {
          newSet.delete(postId);
        } else {
          newSet.add(postId);
        }
        return newSet;
      });
    } catch (error) {
      console.error('Failed to toggle like:', error);
      // Optimistic update for demo
      setPosts((prev: Post[]) => prev.map(post => 
        post.id === postId 
          ? { ...post, like_count: post.like_count + (isCurrentlyLiked ? -1 : 1) }
          : post
      ));
      
      setLikedPosts((prev: Set<number>) => {
        const newSet = new Set(prev);
        if (isCurrentlyLiked) {
          newSet.delete(postId);
        } else {
          newSet.add(postId);
        }
        return newSet;
      });
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    touchEndRef.current = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    };

    const deltaX = touchEndRef.current.x - touchStartRef.current.x;
    const deltaY = touchEndRef.current.y - touchStartRef.current.y;
    const minSwipeDistance = 50;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > minSwipeDistance && posts[currentPostIndex]) {
        const currentPost = posts[currentPostIndex];
        const isLiked = likedPosts.has(currentPost.id);
        
        if (deltaX > 0) {
          // Swipe right - like
          if (!isLiked) {
            handleLike(currentPost.id, false);
          }
        } else {
          // Swipe left - unlike
          if (isLiked) {
            handleLike(currentPost.id, true);
          }
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > minSwipeDistance) {
        if (deltaY < 0) {
          // Swipe up - next post
          setCurrentPostIndex(prev => Math.min(prev + 1, posts.length - 1));
        } else {
          // Swipe down - comments
          if (posts[currentPostIndex]) {
            setShowComments(true);
            loadComments(posts[currentPostIndex].id);
          }
        }
      }
    }

    touchStartRef.current = null;
    touchEndRef.current = null;
  };

  const currentPost = posts[currentPostIndex];

  if (showComments && currentPost) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
        <div className="container mx-auto max-w-2xl p-4">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowComments(false)}
              className="text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-semibold text-gray-800">Comments</h1>
          </div>

          {/* Original Post */}
          <Card className="p-6 mb-6 border-l-4 border-l-blue-400 bg-white/80 backdrop-blur-sm">
            <p className="text-gray-800 leading-relaxed">{currentPost.content}</p>
            <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                {currentPost.like_count}
              </span>
              <span>{currentPost.created_at.toLocaleDateString()}</span>
            </div>
          </Card>

          {/* Comments */}
          <div className="space-y-4 mb-6">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No comments yet. Be the first to comment!</p>
              </div>
            ) : (
              comments.map((comment: Comment) => (
                <Card key={comment.id} className="p-4 bg-white/60 backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{comment.emoji_id}</span>
                    <div className="flex-1">
                      <p className="text-gray-800">{comment.content}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {comment.created_at.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Comment Form */}
          <Card className="p-4 bg-white/80 backdrop-blur-sm">
            <form onSubmit={handleCreateComment} className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-1">
                  {getUserEmojiId(currentPost.id)}
                </span>
                <Textarea
                  placeholder="Write a comment..."
                  value={newCommentContent}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                    setNewCommentContent(e.target.value)
                  }
                  maxLength={500}
                  className="flex-1 min-h-[80px] border-gray-200 focus:border-blue-400"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  {newCommentContent.length}/500
                </span>
                <Button 
                  type="submit" 
                  disabled={!newCommentContent.trim() || isLoading}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {isLoading ? 'Posting...' : 'Comment'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  if (showCreatePost) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
        <div className="container mx-auto max-w-2xl p-4">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowCreatePost(false)}
              className="text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-semibold text-gray-800">Create Post</h1>
          </div>

          <Card className="p-6 bg-white/80 backdrop-blur-sm">
            <form onSubmit={handleCreatePost} className="space-y-4">
              <Textarea
                placeholder="What's on your mind? Share your thoughts anonymously..."
                value={newPostContent}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                  setNewPostContent(e.target.value)
                }
                maxLength={500}
                className="min-h-[150px] border-gray-200 focus:border-blue-400"
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  {newPostContent.length}/500
                </span>
                <Button 
                  type="submit" 
                  disabled={!newPostContent.trim() || isLoading}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {isLoading ? 'Posting...' : 'Post'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Anonymous Feed</h1>
          <Button 
            onClick={() => setShowCreatePost(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Post
          </Button>
        </div>

        {/* Main Content */}
        {posts.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-500">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No posts yet</p>
              <p className="text-sm">Be the first to share something!</p>
            </div>
          </div>
        ) : currentPost ? (
          <div className="p-4 md:p-20 relative">
            {/* Desktop Navigation Buttons */}
            <div className="hidden md:block">
              {/* Top Arrow - Next Post */}
              <Button
                variant="outline"
                size="lg"
                onClick={() => setCurrentPostIndex(prev => Math.min(prev + 1, posts.length - 1))}
                disabled={currentPostIndex >= posts.length - 1}
                className="absolute -top-16 left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 shadow-lg z-10"
                title="Next post"
              >
                <ArrowUp className="w-5 h-5 text-blue-600" />
              </Button>

              {/* Left Arrow - Unlike */}
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  if (likedPosts.has(currentPost.id)) {
                    handleLike(currentPost.id, true);
                  }
                }}
                disabled={!likedPosts.has(currentPost.id)}
                className="absolute top-1/2 -left-16 transform -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm border-2 border-gray-200 hover:border-red-400 hover:bg-red-50 shadow-lg z-10 disabled:opacity-50"
                title="Unlike post"
              >
                <ArrowLeft className="w-5 h-5 text-red-600" />
              </Button>

              {/* Right Arrow - Like */}
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  if (!likedPosts.has(currentPost.id)) {
                    handleLike(currentPost.id, false);
                  }
                }}
                disabled={likedPosts.has(currentPost.id)}
                className="absolute top-1/2 -right-16 transform -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm border-2 border-gray-200 hover:border-green-400 hover:bg-green-50 shadow-lg z-10 disabled:opacity-50"
                title="Like post"
              >
                <ArrowRight className="w-5 h-5 text-green-600" />
              </Button>

              {/* Bottom Arrow - Comments */}
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  setShowComments(true);
                  loadComments(currentPost.id);
                }}
                className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 shadow-lg z-10"
                title="View comments"
              >
                <ArrowDown className="w-5 h-5 text-purple-600" />
              </Button>
            </div>

            {/* Post Card */}
            <Card 
              className="bg-white/80 backdrop-blur-sm border-0 shadow-lg min-h-[400px] cursor-pointer select-none"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div className="p-8 h-full flex flex-col justify-between">
                <div>
                  <p className="text-lg text-gray-800 leading-relaxed mb-6 whitespace-pre-wrap">
                    {currentPost.content}
                  </p>
                </div>
                
                <div className="space-y-4">
                  {/* Like Button */}
                  <div className="flex justify-center">
                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={() => handleLike(currentPost.id, likedPosts.has(currentPost.id))}
                      className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all ${
                        likedPosts.has(currentPost.id)
                          ? 'bg-red-100 text-red-600 hover:bg-red-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Heart 
                        className={`w-5 h-5 ${
                          likedPosts.has(currentPost.id) ? 'fill-current' : ''
                        }`} 
                      />
                      <span className="font-medium">{currentPost.like_count}</span>
                    </Button>
                  </div>

                  {/* Post Info */}
                  <div className="text-center text-sm text-gray-500 space-y-1">
                    <p>{currentPost.created_at.toLocaleDateString()}</p>
                    <p className="text-xs">
                      Post {currentPostIndex + 1} of {posts.length}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Instructions */}
            <div className="mt-6 text-center text-sm text-gray-500 space-y-1">
              <div className="md:hidden">
                <p>👆 Swipe up for next post</p>
                <p>👇 Swipe down for comments</p>
                <p>👈👉 Swipe left/right to like/unlike</p>
              </div>
              <div className="hidden md:block">
                <p>Use arrow buttons to navigate and interact with posts</p>
                <p>↑ Next post • ↓ Comments • ← Unlike • → Like</p>
              </div>
            </div>

            {/* Navigation Dots */}
            <div className="flex justify-center mt-4 space-x-2">
              {posts.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPostIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentPostIndex 
                      ? 'bg-blue-500 w-6' 
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default App;
