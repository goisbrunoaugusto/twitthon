import Form from "../components/Form";

function Login() {
    return Form({ route: "/user/login/", method: "login" });
}
export default Login;