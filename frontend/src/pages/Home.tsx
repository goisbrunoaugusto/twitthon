import { useEffect, useState } from "react";
import api from "../api";
import '../index.css';
import { LIKED_POSTS_KEY } from "../constants";
type Post = {
    id: number;
    author: string;
    content: string;
    created_at: string;
    likes: number;
    image?: string | null;
    liked?: boolean;
};

type FeedResponse = {
    count: number;
    next: string | null;
    previous: string | null;
    results: Post[];
};


function getPageFromUrl(url: string | null): number | null {
    if (!url) return null;
    const match = url.match(/page=(\d+)/);
    return match ? parseInt(match[1]) : null;
}

function getLikedPostsFromStorage(): number[] {
    try {
        const data = localStorage.getItem(LIKED_POSTS_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

function setLikedPostsToStorage(ids: number[]) {
    localStorage.setItem(LIKED_POSTS_KEY, JSON.stringify(ids));
}

function Home() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [count, setCount] = useState(0);
    const [next, setNext] = useState<string | null>(null);
    const [previous, setPrevious] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    // Fetch posts and set liked state from localStorage
    const fetchPosts = (pageNum: number) => {
        setLoading(true);
        api.get(`/user/feed/?page=${pageNum}`)
            .then(res => {
                const data: FeedResponse = res.data;
                const likedIds = getLikedPostsFromStorage();
                const postsWithLiked = data.results.map(post => ({
                    ...post,
                    liked: likedIds.includes(post.id),
                }));
                setPosts(postsWithLiked);
                setCount(data.count);
                setNext(data.next);
                setPrevious(data.previous);
                setPage(pageNum);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchPosts(1);
    }, []);

    const pageSize = 10;
    const totalPages = Math.ceil(count / pageSize);

    // Like/unlike logic with localStorage
    const handleLike = (post: Post) => {
        const likedIds = getLikedPostsFromStorage();
        if (!post.liked) {
            api.post(`/posts/like/${post.id}/`)
                .then(() => {
                    setPosts(posts =>
                        posts.map(p =>
                            p.id === post.id
                                ? { ...p, likes: p.likes + 1, liked: true }
                                : p
                        )
                    );
                    setLikedPostsToStorage([...likedIds, post.id]);
                })
                .catch(err => console.error(err));
        } else {
            api.delete(`/posts/unlike/${post.id}/`)
                .then(() => {
                    setPosts(posts =>
                        posts.map(p =>
                            p.id === post.id
                                ? { ...p, likes: Math.max(0, p.likes - 1), liked: false }
                                : p
                        )
                    );
                    setLikedPostsToStorage(likedIds.filter(id => id !== post.id));
                })
                .catch(err => console.error(err));
        }
    };

    return (
        <div className="min-h-screen bg-base-100 flex flex-col items-center">
            {/* Header */}
            <header className="w-full border-b border-base-300 py-4 px-6 flex items-center justify-between bg-base-100 sticky top-0 z-10">
                <h1 className="text-2xl font-bold text-primary">Twitthon</h1>
                <button className="btn btn-primary">Tweet</button>
            </header>

            {/* Main Content */}
            <main className="w-full max-w-xl flex-1 flex flex-col gap-4 mt-6">
                {/* Tweet Box */}
                <div className="bg-base-200 rounded-lg p-4 flex gap-3 items-start">
                    <div className="avatar">
                        <div className="w-12 rounded-full bg-neutral"></div>
                    </div>
                    <textarea
                        className="textarea textarea-bordered w-full resize-none"
                        placeholder="What's happening?"
                        rows={3}
                    />
                </div>

                {/* Feed */}
                <div className="flex flex-col gap-4">
                    {loading ? (
                        <div>Loading...</div>
                    ) : (
                        posts.map(post => (
                            <div key={post.id} className="bg-base-200 rounded-lg p-4 flex gap-3">
                                <div className="avatar">
                                    <div className="w-10 rounded-full bg-neutral"></div>
                                </div>
                                <div>
                                    <div className="font-semibold">
                                        {post.author} <span className="text-xs text-base-content/50">{new Date(post.created_at).toLocaleString()}</span>
                                    </div>
                                    <div className="mb-2">
                                        {post.content}
                                        {post.image && (
                                            <img
                                                src={post.image}
                                                alt="Image"
                                                className="rounded-lg max-h-64 mt-2"
                                                style={{ maxWidth: "100%" }}
                                            />
                                        )}
                                    </div>

                                    <div className="flex gap-4 text-base-content/60 text-sm items-center">
                                        <button
                                            className="hover:text-primary"
                                            onClick={() => handleLike(post)}
                                            aria-label={post.liked ? "Unlike" : "Like"}
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill={post.liked ? "red" : "none"}
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                                className="w-5 h-5 inline"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 21.364l-7.682-7.682a4.5 4.5 0 010-6.364z"
                                                />
                                            </svg>
                                            <span className="ml-1">{post.likes}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                <div className="flex justify-center items-center gap-2 mt-4">
                    <button
                        className="btn btn-sm"
                        disabled={!previous}
                        onClick={() => fetchPosts(page - 1)}
                    >
                        Previous
                    </button>
                    <span className="mx-2">
                        Page {page} of {totalPages || 1}
                    </span>
                    <button
                        className="btn btn-sm"
                        disabled={!next}
                        onClick={() => fetchPosts(page + 1)}
                    >
                        Next
                    </button>
                </div>
            </main>
        </div>
    );
}

export default Home;