import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import Header from "../components/Header";
import Feed from "../components/Feed";
import Pagination from "../components/Pagination";
import type { Post, User } from "../types";

const Profile = () => {
    const { username } = useParams<{ username: string }>();
    const [user, setUser] = useState<User | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [count, setCount] = useState(0);
    const [next, setNext] = useState<string | null>(null);
    const [previous, setPrevious] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    // Fetch user info
    useEffect(() => {
        if (!username) return;
        setUser(null);
        api.get(`/user/info/?username=${username}`)
            .then(res => setUser(res.data))
            .catch(() => setUser(null));
    }, [username]);

    // Fetch user posts
    const fetchPosts = (pageNum: number) => {
        if (!username) return;
        setLoading(true);
        api.get(`/posts/list/?username=${username}&page=${pageNum}`)
            .then(res => {
                setPosts(res.data.results);
                setCount(res.data.count);
                setNext(res.data.next);
                setPrevious(res.data.previous);
                setPage(pageNum);
            })
            .catch(() => setPosts([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchPosts(1);
        // eslint-disable-next-line
    }, [username]);

    const pageSize = 10;
    const totalPages = Math.ceil(count / pageSize);

    // No like handler for profile feed (read-only)
    const handleLike = () => { };

    return (
        <div className="min-h-screen bg-base-100 flex flex-col w-full">
            <Header />
            <main className="w-full max-w-xl mx-auto flex-1 flex flex-col gap-4 mt-6">
                {user ? (
                    <div className="bg-base-200 rounded-lg p-4 mb-4">
                        <h2 className="text-xl font-bold">{user.username}</h2>
                        <p className="text-base-content/70">{user.email}</p>
                        <p className="text-xs text-base-content/50">
                            Joined: {new Date(user.date_joined).toLocaleString()}
                        </p>
                    </div>
                ) : (
                    <div className="mb-4">Loading user info...</div>
                )}
                <Feed posts={posts} loading={loading} handleLike={handleLike} />
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
    );
};

export default Profile;