import { useEffect, useState } from "react";
import "./App.css";

function SearchIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
        </svg>
    );
}

function StoreSkeleton() {
    return (
        <div className="skeleton-card">
            <div className="skeleton-line skeleton-line--icon" />
            <div className="skeleton-line skeleton-line--title" />
            <div className="skeleton-line skeleton-line--long" />
            <div className="skeleton-line skeleton-line--medium" />
        </div>
    );
}

function App() {
    const [isRegistering, setIsRegistering] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(
        !!localStorage.getItem("token")
    );

    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem("user");
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const [loginData, setLoginData] = useState({
        email: "",
        password: ""
    });

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

    const [stores, setStores] = useState([]);
    const [filteredStores, setFilteredStores] = useState([]);
    const [search, setSearch] = useState("");
    const [dashboardLoading, setDashboardLoading] = useState(false);
    const [dashboardError, setDashboardError] = useState("");
    const [ratings, setRatings] = useState({});
    const [ratingLoading, setRatingLoading] = useState({});
    const [selectedRating, setSelectedRating] = useState({});
    const [hoverRating, setHoverRating] = useState({});

    const handleLogin = async (e) => {
        e.preventDefault();

        setMessage("");
        setLoading(true);

        try {
            const response = await fetch(
                "http://localhost:5000/api/auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
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
            setLoginData({
                email: "",
                password: ""
            });

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

        const passwordRegex =
            /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}$/;

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
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(registerData)
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Registration failed");
            }

            setMessage(
                "Account created successfully! You can now sign in."
            );

            setRegisterData({
                name: "",
                email: "",
                address: "",
                password: ""
            });

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

    const fetchStores = async () => {
        const token = localStorage.getItem("token");

        if (!token) {
            return;
        }

        setDashboardLoading(true);
        setDashboardError("");

        try {
            const response = await fetch(
                "http://localhost:5000/api/stores",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to load stores"
                );
            }

            setStores(data);
            setFilteredStores(data);

            if (user?.role === "USER") {
                const ratingResults = {};

                for (const store of data) {
                    try {
                        const ratingResponse = await fetch(
                            `http://localhost:5000/api/ratings/my/${store.id}`,
                            {
                                headers: {
                                    Authorization: `Bearer ${token}`
                                }
                            }
                        );

                        if (ratingResponse.ok) {
                            const ratingData =
                                await ratingResponse.json();

                            ratingResults[store.id] =
                                ratingData.rating;
                        }
                    } catch {
                        // Ignore individual rating errors
                    }
                }

                setRatings(ratingResults);
            }

        } catch (error) {
            setDashboardError(error.message);
        } finally {
            setDashboardLoading(false);
        }
    };

    useEffect(() => {
        if (isLoggedIn) {
            fetchStores();
        }
    }, [isLoggedIn]);

    useEffect(() => {
        const searchValue = search.toLowerCase().trim();

        if (!searchValue) {
            setFilteredStores(stores);
            return;
        }

        const results = stores.filter((store) => {
            return (
                store.name?.toLowerCase().includes(searchValue) ||
                store.address?.toLowerCase().includes(searchValue) ||
                store.email?.toLowerCase().includes(searchValue)
            );
        });

        setFilteredStores(results);
    }, [search, stores]);

    const handleRating = async (storeId) => {
        const rating = selectedRating[storeId];

        if (!rating) {
            return;
        }

        const token = localStorage.getItem("token");

        setRatingLoading((prev) => ({
            ...prev,
            [storeId]: true
        }));

        try {
            const existingRating = ratings[storeId];

            const url = existingRating
                ? `http://localhost:5000/api/ratings/${storeId}`
                : "http://localhost:5000/api/ratings";

            const method = existingRating ? "PUT" : "POST";

            const body = existingRating
                ? { rating }
                : {
                      store_id: storeId,
                      rating
                  };

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to submit rating"
                );
            }

            setRatings((prev) => ({
                ...prev,
                [storeId]: rating
            }));

            setSelectedRating((prev) => ({
                ...prev,
                [storeId]: null
            }));

            await fetchStores();

        } catch (error) {
            alert(error.message);
        } finally {
            setRatingLoading((prev) => ({
                ...prev,
                [storeId]: false
            }));
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setUser(null);
        setIsLoggedIn(false);
        setStores([]);
        setFilteredStores([]);
        setRatings({});
        setSearch("");
    };

    const switchToRegister = () => {
        setMessage("");
        setIsRegistering(true);
    };

    const switchToLogin = () => {
        setMessage("");
        setIsRegistering(false);
    };

    if (isLoggedIn && user) {
        const ratedStores = Object.values(ratings).filter(Boolean).length;

        const averageRating =
            stores.length > 0
                ? (
                      stores.reduce(
                          (sum, store) =>
                              sum + Number(store.average_rating || 0),
                          0
                      ) / stores.length
                  ).toFixed(1)
                : "0.0";

        return (
            <div className="dashboard">
                <div className="noise-overlay" aria-hidden="true" />
                <div className="dashboard-glow dashboard-glow--purple" aria-hidden="true" />
                <div className="dashboard-glow dashboard-glow--blue" aria-hidden="true" />

                <nav className="dashboard-nav">
                    <div className="dashboard-brand">
                        <div className="dashboard-brand-icon">★</div>
                        RateNest
                    </div>

                    <div className="dashboard-user">
                        <div className="avatar">
                            {user.name?.charAt(0).toUpperCase()}
                        </div>

                        <div className="user-info">
                            <div className="user-name">{user.name}</div>
                            <div className="user-role">
                                {user.role === "ADMIN"
                                    ? "Administrator"
                                    : "RateNest member"}
                            </div>
                        </div>

                        <button
                            className="logout-button"
                            onClick={handleLogout}
                        >
                            Logout
                        </button>
                    </div>
                </nav>

                <div className="dashboard-container">
                    <section className="dashboard-hero">
                        <div>
                            <div className="dashboard-eyebrow">
                                ✦ Your discovery space
                            </div>

                            <h1 className="dashboard-title">
                                Discover.
                                <br />
                                <span>Rate.</span> Decide.
                            </h1>

                            <p className="dashboard-subtitle">
                                Find stores people trust, explore community
                                ratings, and share your own experience.
                            </p>
                        </div>

                        <div className="stats">
                            <div className="stat">
                                <div className="stat-index">01</div>
                                <div className="stat-number">{stores.length}</div>
                                <div className="stat-label">Stores</div>
                            </div>

                            <div className="stat">
                                <div className="stat-index">02</div>
                                <div className="stat-number">{ratedStores}</div>
                                <div className="stat-label">Your ratings</div>
                            </div>

                            <div className="stat">
                                <div className="stat-index">03</div>
                                <div className="stat-number">{averageRating}</div>
                                <div className="stat-label">Avg. rating</div>
                            </div>
                        </div>
                    </section>

                    <div className="search-box">
                        <span className="search-icon">
                            <SearchIcon />
                        </span>
                        <input
                            type="text"
                            placeholder="Search stores by name, location or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            aria-label="Search stores"
                        />
                    </div>

                    <div className="section-heading">
                        <h2>Explore stores</h2>
                        <span className="result-count">
                            {filteredStores.length} result
                            {filteredStores.length !== 1 ? "s" : ""}
                        </span>
                    </div>

                    {dashboardLoading ? (
                        <div className="skeleton-grid">
                            <StoreSkeleton />
                            <StoreSkeleton />
                            <StoreSkeleton />
                        </div>
                    ) : dashboardError ? (
                        <div className="error-state" role="alert">
                            <span className="error-state-icon">⚠</span>
                            <span>{dashboardError}</span>
                        </div>
                    ) : filteredStores.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">🔍</div>
                            <h3>No places found</h3>
                            <p>
                                Try searching for a different store, location,
                                or email.
                            </p>
                        </div>
                    ) : (
                        <div className="store-grid">
                            {filteredStores.map((store) => {
                                const hasRated = !!ratings[store.id];
                                const pendingSelection =
                                    selectedRating[store.id];
                                const displayRating =
                                    hoverRating[store.id] ||
                                    pendingSelection ||
                                    ratings[store.id] ||
                                    0;

                                return (
                                    <article
                                        className="store-card"
                                        key={store.id}
                                    >
                                        <div className="store-glow" aria-hidden="true" />

                                        <div className="store-top">
                                            <div className="store-icon">🏪</div>
                                            <div className="average">
                                                <span className="average-star">★</span>
                                                {Number(
                                                    store.average_rating || 0
                                                ).toFixed(1)}
                                            </div>
                                        </div>

                                        <h3 className="store-name">
                                            {store.name}
                                        </h3>

                                        <p className="store-address">
                                            <span className="store-address-icon">📍</span>
                                            {store.address}
                                        </p>

                                        <div className="store-divider" />

                                        <div className="rating-area">
                                            {user.role === "USER" ? (
                                                <>
                                                    <div className="your-rating">
                                                        {hasRated
                                                            ? `Your rating · ${ratings[store.id]}/5`
                                                            : "Your rating"}
                                                    </div>

                                                    <div className="stars" role="group" aria-label={`Rate ${store.name}`}>
                                                        {[1, 2, 3, 4, 5].map(
                                                            (star) => (
                                                                <button
                                                                    key={star}
                                                                    type="button"
                                                                    className={`star-button ${
                                                                        displayRating >= star
                                                                            ? "active"
                                                                            : ""
                                                                    } ${
                                                                        pendingSelection === star
                                                                            ? "selected-pending"
                                                                            : ""
                                                                    }`}
                                                                    onClick={() =>
                                                                        setSelectedRating(
                                                                            (prev) => ({
                                                                                ...prev,
                                                                                [store.id]: star
                                                                            })
                                                                        )
                                                                    }
                                                                    onMouseEnter={() =>
                                                                        setHoverRating(
                                                                            (prev) => ({
                                                                                ...prev,
                                                                                [store.id]: star
                                                                            })
                                                                        )
                                                                    }
                                                                    onMouseLeave={() =>
                                                                        setHoverRating(
                                                                            (prev) => ({
                                                                                ...prev,
                                                                                [store.id]: null
                                                                            })
                                                                        )
                                                                    }
                                                                    aria-label={`${star} star${star !== 1 ? "s" : ""}`}
                                                                >
                                                                    ★
                                                                </button>
                                                            )
                                                        )}
                                                    </div>

                                                    {pendingSelection ? (
                                                        <button
                                                            type="button"
                                                            className="rate-button"
                                                            disabled={
                                                                ratingLoading[store.id]
                                                            }
                                                            onClick={() =>
                                                                handleRating(store.id)
                                                            }
                                                        >
                                                            {ratingLoading[store.id]
                                                                ? "Saving..."
                                                                : hasRated
                                                                ? "Update rating"
                                                                : "Submit rating"}
                                                        </button>
                                                    ) : (
                                                        <div className="already-rated">
                                                            {hasRated
                                                                ? "Choose a new rating to update it"
                                                                : "Select stars to rate"}
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="admin-badge">
                                                    👤 Administrator view
                                                </div>
                                            )}
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="app">
            <div className="noise-overlay" aria-hidden="true" />
            <div className="background-glow glow-one" aria-hidden="true" />
            <div className="background-glow glow-two" aria-hidden="true" />

            <main className="login-page">
                <section className="hero-section">
                    <div className="brand">
                        <div className="brand-icon">★</div>
                        <span>RateNest</span>
                    </div>

                    <div className="hero-content">
                        <div className="eyebrow">
                            SMART STORE REVIEWS
                        </div>

                        <h1>
                            {isRegistering ? (
                                <>
                                    Join.
                                    <br />
                                    <span>Rate.</span>
                                    <br />
                                    Discover.
                                </>
                            ) : (
                                <>
                                    Discover.
                                    <br />
                                    <span>Rate.</span>
                                    <br />
                                    Trust.
                                </>
                            )}
                        </h1>

                        <p>
                            {isRegistering
                                ? "Create your account and become part of a community making smarter store choices."
                                : "Find stores people love, share your experience, and make better choices with ratings that matter."}
                        </p>

                        <div className="feature-row">
                            <div className="feature">
                                <div className="feature-icon">★</div>
                                <div>
                                    <strong>Real ratings</strong>
                                    <small>Honest customer experiences</small>
                                </div>
                            </div>

                            <div className="feature">
                                <div className="feature-icon">✓</div>
                                <div>
                                    <strong>Trusted reviews</strong>
                                    <small>Community-driven insights</small>
                                </div>
                            </div>

                            <div className="feature">
                                <div className="feature-icon">→</div>
                                <div>
                                    <strong>Better decisions</strong>
                                    <small>Choose with confidence</small>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="hero-footer">© 2026 RateNest</div>
                </section>

                <section className="form-section">
                    <div className="login-card">
                        <div className="mobile-brand">
                            <div className="brand-icon">★</div>
                            <span>RateNest</span>
                        </div>

                        {!isRegistering ? (
                            <>
                                <div className="form-heading">
                                    <p className="welcome">WELCOME BACK</p>
                                    <h2>Sign in to your account</h2>
                                    <p className="subtitle">
                                        Continue discovering great places.
                                    </p>
                                </div>

                                <form onSubmit={handleLogin}>
                                    <div className="input-group">
                                        <label htmlFor="login-email">
                                            Email address
                                        </label>
                                        <div className="input-wrapper">
                                            <span className="input-icon">✉</span>
                                            <input
                                                id="login-email"
                                                type="email"
                                                placeholder="you@example.com"
                                                value={loginData.email}
                                                onChange={(e) =>
                                                    setLoginData({
                                                        ...loginData,
                                                        email: e.target.value
                                                    })
                                                }
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="input-group">
                                        <div className="label-row">
                                            <label htmlFor="login-password">
                                                Password
                                            </label>
                                            <button
                                                type="button"
                                                className="forgot"
                                                onClick={() =>
                                                    setMessage(
                                                        "Password reset will be available soon."
                                                    )
                                                }
                                            >
                                                Forgot password?
                                            </button>
                                        </div>
                                        <div className="input-wrapper">
                                            <span className="input-icon">●</span>
                                            <input
                                                id="login-password"
                                                type={
                                                    showPassword
                                                        ? "text"
                                                        : "password"
                                                }
                                                placeholder="Enter your password"
                                                value={loginData.password}
                                                onChange={(e) =>
                                                    setLoginData({
                                                        ...loginData,
                                                        password: e.target.value
                                                    })
                                                }
                                                required
                                            />
                                            <button
                                                type="button"
                                                className="password-toggle"
                                                onClick={() =>
                                                    setShowPassword(!showPassword)
                                                }
                                            >
                                                {showPassword ? "Hide" : "Show"}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="login-button"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner" />
                                                Signing in...
                                            </>
                                        ) : (
                                            <>
                                                Sign in
                                                <span>→</span>
                                            </>
                                        )}
                                    </button>
                                </form>

                                {message && (
                                    <div
                                        className={`message ${
                                            message
                                                .toLowerCase()
                                                .includes("welcome")
                                                ? "success"
                                                : "error"
                                        }`}
                                        role="alert"
                                    >
                                        {message}
                                    </div>
                                )}

                                <div className="divider">
                                    <span>NEW TO RATENEST?</span>
                                </div>

                                <button
                                    type="button"
                                    className="signup-button"
                                    onClick={switchToRegister}
                                >
                                    Create an account
                                </button>

                                <p className="terms">
                                    By continuing, you agree to our Terms of
                                    Service and Privacy Policy.
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="form-heading">
                                    <p className="welcome">GET STARTED</p>
                                    <h2>Create your account</h2>
                                    <p className="subtitle">
                                        Join RateNest and start sharing your
                                        experience.
                                    </p>
                                </div>

                                <form onSubmit={handleRegister}>
                                    <div className="input-group">
                                        <label htmlFor="register-name">
                                            Full name
                                            <span className="hint">
                                                {" "}20–60 characters
                                            </span>
                                        </label>
                                        <div className="input-wrapper">
                                            <span className="input-icon">♙</span>
                                            <input
                                                id="register-name"
                                                type="text"
                                                placeholder="Enter your full name"
                                                value={registerData.name}
                                                onChange={(e) =>
                                                    setRegisterData({
                                                        ...registerData,
                                                        name: e.target.value
                                                    })
                                                }
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="input-group">
                                        <label htmlFor="register-email">
                                            Email address
                                        </label>
                                        <div className="input-wrapper">
                                            <span className="input-icon">✉</span>
                                            <input
                                                id="register-email"
                                                type="email"
                                                placeholder="you@example.com"
                                                value={registerData.email}
                                                onChange={(e) =>
                                                    setRegisterData({
                                                        ...registerData,
                                                        email: e.target.value
                                                    })
                                                }
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="input-group">
                                        <label htmlFor="register-address">
                                            Address
                                            <span className="hint">
                                                {" "}up to 400 characters
                                            </span>
                                        </label>
                                        <div className="input-wrapper textarea-wrapper">
                                            <span className="input-icon">⌖</span>
                                            <textarea
                                                id="register-address"
                                                placeholder="Enter your address"
                                                value={registerData.address}
                                                onChange={(e) =>
                                                    setRegisterData({
                                                        ...registerData,
                                                        address: e.target.value
                                                    })
                                                }
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="input-group">
                                        <label htmlFor="register-password">
                                            Password
                                        </label>
                                        <div className="input-wrapper">
                                            <span className="input-icon">●</span>
                                            <input
                                                id="register-password"
                                                type={
                                                    showRegisterPassword
                                                        ? "text"
                                                        : "password"
                                                }
                                                placeholder="Create a strong password"
                                                value={registerData.password}
                                                onChange={(e) =>
                                                    setRegisterData({
                                                        ...registerData,
                                                        password: e.target.value
                                                    })
                                                }
                                                required
                                            />
                                            <button
                                                type="button"
                                                className="password-toggle"
                                                onClick={() =>
                                                    setShowRegisterPassword(
                                                        !showRegisterPassword
                                                    )
                                                }
                                            >
                                                {showRegisterPassword
                                                    ? "Hide"
                                                    : "Show"}
                                            </button>
                                        </div>
                                        <div className="password-hint">
                                            8–16 characters • 1 uppercase • 1
                                            special character
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="login-button"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner" />
                                                Creating account...
                                            </>
                                        ) : (
                                            <>
                                                Create account
                                                <span>→</span>
                                            </>
                                        )}
                                    </button>
                                </form>

                                {message && (
                                    <div
                                        className={`message ${
                                            message
                                                .toLowerCase()
                                                .includes("successfully")
                                                ? "success"
                                                : "error"
                                        }`}
                                        role="alert"
                                    >
                                        {message}
                                    </div>
                                )}

                                <div className="divider">
                                    <span>ALREADY HAVE AN ACCOUNT?</span>
                                </div>

                                <button
                                    type="button"
                                    className="signup-button"
                                    onClick={switchToLogin}
                                >
                                    ← Back to sign in
                                </button>
                            </>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}

export default App;
