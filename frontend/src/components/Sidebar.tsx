import { FunctionComponent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ACCESS_TOKEN } from '../constants'; // Import the ACCESS_TOKEN constant
import api from "../api";
import { jwtDecode } from "jwt-decode";


interface DecodedToken {
    user_id: number;
    // Add other properties as needed from your JWT payload
}

const Sidebar: FunctionComponent = () => {
    const [username, setUsername] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem(ACCESS_TOKEN);
                if (!token) {
                    throw new Error('Access token not found in local storage.');
                }

                // Use jwt-decode
                const decodedToken: DecodedToken = jwtDecode(token);

                const userId = decodedToken.user_id;

                const response = await api.get(`/users/${userId}/info/`);
                const userData = response.data;
                if (userData && userData.username) {
                    setUsername(userData.username);
                } else {
                    setError("User data or username is missing.");
                }
            } catch (err: any) {
                setError(err.message || "Failed to fetch user data.");
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    return (<aside className="hidden md:flex flex-col gap-4 px-6 py-8 w-64 min-h-screen border-r border-base-300 sticky top-0">
        <nav className="flex flex-col gap-2">
            <Link to={`/`} className="btn btn-ghost hover:text-primary justify-start text-lg">
                Home
            </Link>
            {/* <Link to={`/users/${}`} className="btn btn-ghost hover:text-primary justify-start text-lg">
                Profile
            </Link> */}
        </nav>
    </aside>);
}

export default Sidebar;