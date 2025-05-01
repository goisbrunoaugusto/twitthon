import { useEffect, useState } from "react";
import api from "../api";
import Header from "./Header";
import Feed from "./Feed";
import Pagination from "./Pagination";
import type { Post } from "../types";

interface FeedResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Post[];
}

interface UserFeedProps {
    username: string;
}

const UserFeed = ({ username }: UserFeedProps) => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [count, setCount] = useState(0);
    const [next, setNext] = useState<string | null>(null);
    const [previous, setPrevious] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    const fetchPosts = (pageNum: number) => {
        setLoading(true);
        api.get(`/posts/${username}/?page=${pageNum}`)
            .then(res => {
                const data: FeedResponse = res.data;
                setPosts(data.results);
                setCount(data.count);
                setNext(data.next);
                setPrevious(data.previous);
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

    // No like handler for user feed (read-only)
    const handleLike = () => { };

    return (
        <div className="min-h-screen bg-base-100 flex flex-col w-full">
            <Header />
            <main className="w-full max-w-xl mx-auto flex-1 flex flex-col gap-4 mt-6">
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
    );
};

export default UserFeed;