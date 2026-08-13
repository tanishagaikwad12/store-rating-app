import { useState } from "react";
import "./App.css";
import AuthPage from "./components/AuthPage";
import UserDashboard from "./components/UserDashboard";
import AdminDashboard from "./components/AdminDashboard";
import OwnerDashboard from "./components/OwnerDashboard";

function App() {
    const [isRegistering, setIsRegistering] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(
        !!localStorage.getItem("token")
    );

    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem("user");
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const [loginData, setLoginData] = useState({ email: "", password: "" });
    const [registerData, setRegisterData] = useState({
        name: "",
        email: "",
        address: "",
        password: ""
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showRegisterPassword, setShowRegisterPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage("");
        setLoading(true);

        try {
            const response = await fetch(
                "http://localhost:5000/api/auth/login",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(loginData)
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Login failed");
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            setUser(data.user);
            setIsLoggedIn(true);
            setMessage("");
            setLoginData({ email: "", password: "" });
        } catch (error) {
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setMessage("");

        if (registerData.name.length < 20) {
            setMessage("Name must be between 20 and 60 characters.");
            return;
        }

        if (registerData.name.length > 60) {
            setMessage("Name must be between 20 and 60 characters.");
            return;
        }

        if (registerData.address.length > 400) {
            setMessage("Address cannot exceed 400 characters.");
            return;
        }

        const passwordRegex = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}$/;

        if (!passwordRegex.test(registerData.password)) {
            setMessage(
                "Password must be 8-16 characters with at least one uppercase letter and one special character."
            );
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                "http://localhost:5000/api/auth/register",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(registerData)
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Registration failed");
            }

            setMessage("Account created successfully! You can now sign in.");
            setRegisterData({ name: "", email: "", address: "", password: "" });

            setTimeout(() => {
                setIsRegistering(false);
                setMessage("");
            }, 1800);
        } catch (error) {
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        setIsLoggedIn(false);
    };

    if (isLoggedIn && user) {
        if (user.role === "ADMIN") {
            return <AdminDashboard user={user} onLogout={handleLogout} />;
        }

        if (user.role === "OWNER") {
            return <OwnerDashboard user={user} onLogout={handleLogout} />;
        }

        if (user.role === "USER") {
            return <UserDashboard user={user} onLogout={handleLogout} />;
        }

        return (
            <div className="dashboard">
                <div className="dashboard-container">
                    <div className="error-state" role="alert">
                        Your account has an unsupported role. Please contact an administrator.
                    </div>
                    <button type="button" className="logout-button" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </div>
        );
    }

    return (
        <AuthPage
            isRegistering={isRegistering}
            loginData={loginData}
            registerData={registerData}
            showPassword={showPassword}
            showRegisterPassword={showRegisterPassword}
            loading={loading}
            message={message}
            onLogin={handleLogin}
            onRegister={handleRegister}
            onLoginChange={setLoginData}
            onRegisterChange={setRegisterData}
            onTogglePassword={() => setShowPassword(!showPassword)}
            onToggleRegisterPassword={() =>
                setShowRegisterPassword(!showRegisterPassword)
            }
            onSwitchToRegister={() => {
                setMessage("");
                setIsRegistering(true);
            }}
            onSwitchToLogin={() => {
                setMessage("");
                setIsRegistering(false);
            }}
            onForgotPassword={() =>
                setMessage("Password reset will be available soon.")
            }
        />
    );
}

export default App;
