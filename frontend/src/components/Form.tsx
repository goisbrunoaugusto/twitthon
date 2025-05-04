import { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";

function Form({ route, method }: { route?: string; method?: string }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const name = method === "login" ? "Login" : "Register"

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        setLoading(true);
        e.preventDefault();

        try {
            if (method === "login") {
                const response = await api.post(route!, { username, password })
                localStorage.setItem(ACCESS_TOKEN, response.data.access);
                localStorage.setItem(REFRESH_TOKEN, response.data.refresh);

                navigate("/");
            } else {
                const response = await api.post(route!, { username, email, password })
                navigate("/login");
            }
        } catch (error) { alert(error) } finally { setLoading(false) }
    }

    return <form onSubmit={handleSubmit} className="flex flex-col items-center justify-center my-12 mx-auto p-5 rounded-lg shadow-md max-w-md">
        <h1 className="text-2xl font-bold mb-4">{name}</h1>
        <input type="text"
            className="w-[90%] p-2.5 my-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username" />
        {method === "register" && (
            <input type="text"
                className="w-[90%] p-2.5 my-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email" />
        )}
        <input type="password"
            className="w-[90%] p-2.5 my-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password" />
        <button className="w-[95%] p-2.5 my-5 bg-blue-500 hover:bg-blue-700 text-white font-semibold border-none rounded cursor-pointer transition-colors duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed" type="submit">{name}</button>
    </form>
}
export default Form;