import { useEffect, useRef, useState } from "react";
import api from "../api";
import '../index.css';
import { LIKED_POSTS_KEY, ACCESS_TOKEN } from "../constants";
import Header from "../components/Header";
import { Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Feed from "../components/Feed";
import TweetBox from "../components/TweetBox";
import Pagination from "../components/Pagination";

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
    const [tweetContent, setTweetContent] = useState(""); // New state for tweet content
    const [tweetImage, setTweetImage] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
                {/* Sidebar */}
                <aside className="hidden md:flex flex-col gap-4 px-6 py-8 w-64 min-h-screen border-r border-base-300 sticky top-0">
                    <nav className="flex flex-col gap-2">
                        {/* TODO NavLink*/}
                        <button className="btn btn-ghost justify-start text-lg">
                            Home
                        </button>
                        <button className="btn btn-ghost justify-start text-lg">
                            Profile
                        </button>
                        <button className="btn btn-ghost justify-start text-lg">
                            Settings
                        </button>
                    </nav>
                </aside>
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