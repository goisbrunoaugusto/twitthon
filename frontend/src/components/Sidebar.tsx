import { FunctionComponent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ACCESS_TOKEN } from '../constants';
import api from "../api";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
    user_id: number;
}

const Sidebar: FunctionComponent = () => {
    const [username, setUsername] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                console.log("Fetching user data for sidebar...");
                const token = localStorage.getItem(ACCESS_TOKEN);
                if (!token) {
                    throw new Error('Access token not found in local storage.');
                }


                const decodedToken: DecodedToken = jwtDecode(token);
                const userId = decodedToken.user_id;
                console.log("Decoded user ID:", userId);


                const response = await api.get(`/users/${userId}/info/`);
                const userData = response.data;
                console.log("User data fetched:", userData);

                if (userData && userData.username) {
                    setUsername(userData.username);
                    console.log("Username set:", userData.username);
                } else {
                    setError("User data or username is missing.");
                    console.error("User data missing username property");
                }
            } catch (err: any) {
                console.error("Error fetching user data:", err);
                setError(err.message || "Failed to fetch user data.");
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    return (
        <aside className="hidden md:flex flex-col gap-4 px-6 py-8 w-64 min-h-screen border-r border-base-300 sticky top-0">
            <nav className="flex flex-col gap-2">
                <Link to={`/`} className="btn btn-ghost hover:text-primary justify-start text-lg">
                    Home
                </Link>

                {loading ? (
                    <div className="btn btn-ghost opacity-50 justify-start text-lg">
                        Loading...
                    </div>
                ) : error ? (
                    <div className="text-error text-sm px-4">
                        {error}
                    </div>
                ) : username ? (
                    <Link to={`/users/${username}`} className="btn btn-ghost hover:text-primary justify-start text-lg">
                        Profile
                    </Link>
                ) : null}

            </nav>

            {username && (
                <div className="mt-auto pt-4 border-t border-base-300">
                    <div className="flex items-center gap-3">
                        <div className="avatar placeholder">
                            <div className="bg-neutral text-neutral-content rounded-full w-10">
                                <span>{username.charAt(0).toUpperCase()}</span>
                            </div>
                        </div>
                        <div>
                            <p className="font-medium">{username}</p>
                            <Link to="/logout" className="text-xs text-base-content/70 hover:text-primary">
                                Log out
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
}

export default Sidebar;