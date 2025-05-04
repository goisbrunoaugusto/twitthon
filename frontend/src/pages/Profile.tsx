import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import Header from "../components/Header";
import Feed from "../components/Feed";
import Pagination from "../components/Pagination";
import type { Post, User } from "../types";
import Sidebar from "../components/Sidebar";
import { jwtDecode } from "jwt-decode";


const ACCESS_TOKEN = "access";

const Profile = () => {
    const { username } = useParams<{ username: string }>();
    const [user, setUser] = useState<User | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [count, setCount] = useState(0);
    const [next, setNext] = useState<string | null>(null);
    const [previous, setPrevious] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [isFollowing, setIsFollowing] = useState(false);


    useEffect(() => {
        console.log("Component state updated:", {
            currentUserId,
            profileUsername: username,
            profileUser: user,
            isFollowing
        });
    }, [currentUserId, username, user, isFollowing]);


    useEffect(() => {
        try {
            console.log("Getting user ID from access token...");
            const token = localStorage.getItem(ACCESS_TOKEN);
            console.log("Token retrieved:", token ? "Found token" : "No token");

            if (token) {

                const decodedToken = jwtDecode<{ user_id: number }>(token);
                console.log("Decoded token:", decodedToken);

                if (decodedToken && decodedToken.user_id) {
                    console.log("Found user_id in token:", decodedToken.user_id);
                    setCurrentUserId(decodedToken.user_id);


                    api.get(`/users/${decodedToken.user_id}/info/`)
                        .then(res => {
                            console.log("Verified user info:", res.data);
                        })
                        .catch(err => {
                            console.error("Error verifying user info:", err);
                        });
                } else {
                    console.error("Token doesn't contain user_id");
                    setCurrentUserId(null);
                }
            } else {
                console.log("No access token found in localStorage");
                setCurrentUserId(null);
            }
        } catch (error) {
            console.error("Failed to decode token", error);
            setCurrentUserId(null);
        }
    }, []);


    useEffect(() => {
        if (!username) return;
        console.log("Fetching profile info for username:", username);
        setUser(null);
        api.get(`/users/${username}/info/`)
            .then(res => {
                console.log("Profile user data:", res.data);
                setUser(res.data);
            })
            .catch((err) => {
                console.error("Error fetching profile:", err);
                setUser(null);
            });
    }, [username]);


    useEffect(() => {
        if (!user || !currentUserId) {
            console.log("Skipping follow check - missing data:", { user, currentUserId });
            return;
        }

        console.log("Checking follow status for profile:", user.username);

        api.get(`/users/${user.username}/following-status/`)
            .then(res => {
                console.log("Follow status response:", res.data);
                setIsFollowing(res.data.is_following);
            })
            .catch(err => {
                console.error("Error checking follow status", err);
                setIsFollowing(false);
            });
    }, [user, currentUserId]);


    const fetchPosts = (pageNum: number) => {
        if (!username) return;
        setLoading(true);
        api.get(`/users/${username}/posts/?page=${pageNum}`)
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

    }, [username]);

    const pageSize = 10;
    const totalPages = Math.ceil(count / pageSize);


    const handleLike = () => { };


    const handleFollowToggle = async () => {
        if (!user) return;

        console.log(`Attempting to ${isFollowing ? 'unfollow' : 'follow'} user:`, user.username);
        try {
            if (isFollowing) {

                const response = await api.delete(`/users/${user.username}/follow/`);
                console.log("Unfollow response:", response.data);
            } else {

                const response = await api.post(`/users/${user.username}/follow/`);
                console.log("Follow response:", response.data);
            }
            setIsFollowing(!isFollowing);
            console.log("Updated follow status to:", !isFollowing);
        } catch (error) {
            console.error("Error toggling follow status", error);
        }
    };

    return (
        <div className="min-h-screen bg-base-100 flex flex-col w-full">
            <Header />
            <div className="flex flex-row">
                <Sidebar />
                <main className="w-full max-w-xl mx-auto flex-1 flex flex-col gap-4 mt-6">
                    {user ? (
                        <div className="bg-base-200 rounded-lg p-4 mb-4">
                            <h2 className="text-xl font-bold">{user.username}</h2>
                            <p className="text-base-content/70">{user.email}</p>
                            <p className="text-xs text-base-content/50">
                                Joined: {new Date(user.date_joined).toLocaleString()}
                            </p>
                            <div className="mt-3">
                                {currentUserId !== null && currentUserId !== user.id && (
                                    <button
                                        className={`btn ${isFollowing ? 'btn-outline' : 'btn-primary'}`}
                                        onClick={handleFollowToggle}
                                    >
                                        {isFollowing ? 'Unfollow' : 'Follow'}
                                    </button>
                                )}
                                {currentUserId === user.id && (
                                    <span className="text-sm text-base-content/70">This is your profile</span>
                                )}
                            </div>
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
        </div>
    );
};

export default Profile;