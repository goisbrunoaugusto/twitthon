import { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import "../styles/Form.css";

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
                console.log("Access Token:", response.data.access);
                console.log("Refresh Token:", response.data.refresh);

                navigate("/");
            } else {
                const response = await api.post(route!, { username, email, password })
                console.log("Register response:", response.data);
                navigate("/login");
            }
        } catch (error) { alert(error) } finally { setLoading(false) }
    }

    return <form onSubmit={handleSubmit} className="form-container">
        <h1>{name}</h1>
        <input type="text"
            className="form-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username" />
        {method === "register" && (
            <input type="text"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email" />
        )}
        <input type="password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password" />
        <button className="form-button" type="submit">{name}</button>
    </form>
}
export default Form;