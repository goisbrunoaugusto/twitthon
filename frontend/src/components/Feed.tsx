import type { Post as PostType } from "../types.ts";
import Post from "./Post.tsx";

interface FeedProps {
    posts: PostType[];
    loading: boolean;
    handleLike: (post: PostType) => void;
    jwtDecodedName?: string;
}

function Feed({
    posts,
    loading,
    handleLike,
}: FeedProps) {
    return (
        <div className="flex flex-col gap-4">
            {loading ? (
                <div>Loading...</div>
            ) : posts.length === 0 ? (
                <div>No posts yet.</div>
            ) : (
                posts.map(post => (<Post
                    key={post.id}
                    post={post}
                    handleLike={handleLike}
                />))
            )}

        </div>
    );
}

export default Feed;