import { useEffect, useRef, useState } from "react";
import api from "../api";
import '../index.css';
import { LIKED_POSTS_KEY } from "../constants";
import Header from "../components/Header";
import Feed from "../components/Feed";
import TweetBox from "../components/TweetBox";
import Pagination from "../components/Pagination";
import Sidebar from "../components/Sidebar";

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
    const [tweetContent, setTweetContent] = useState(""); // New state for tweet content
    const [tweetImage, setTweetImage] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch posts and set liked state from localStorage
    const fetchPosts = (pageNum: number) => {
        setLoading(true);
        api.get(`/users/feed/?page=${pageNum}`)
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
            api.post(`/posts/${post.id}/like/`)
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
            api.delete(`/posts/${post.id}/like/`)
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
    const handleTweet = async () => {
        if (!tweetContent.trim() && !tweetImage) return;
        try {
            const formData = new FormData();
            formData.append("content", tweetContent);
            if (tweetImage) {
                formData.append("image", tweetImage);
            }
            await api.post("/posts/", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            setTweetContent("");
            setTweetImage(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            fetchPosts(1); // Refresh feed to show new post
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen bg-base-100 flex flex-col w-full">
            <Header />

            {/* Main Content */}
            <div className="flex-1 flex flex-row">
                <Sidebar />
                <div className="flex flex-1 justify-center mt-6">
                    <main className="w-full max-w-xl just flex-1 flex flex-col gap-4 mt-6">

                        <TweetBox
                            tweetContent={tweetContent}
                            setTweetContent={setTweetContent}
                            tweetImage={tweetImage}
                            setTweetImage={setTweetImage}
                            onTweet={handleTweet}
                        />

                        <Feed
                            posts={posts}
                            loading={loading}
                            handleLike={handleLike}
                        />

                        <Pagination
                            page={page}
                            totalPages={totalPages}
                            hasPrev={!!previous}
                            hasNext={!!next}
                            onPrevPage={previous ? () => fetchPosts(page - 1) : undefined}
                            onNextPage={next ? () => fetchPosts(page + 1) : undefined}
                        />
                    </main>
                </div>
            </div>
        </div>
    );
}

export default Home;