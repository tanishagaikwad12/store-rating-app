import { useEffect, useState } from "react";
import "./App.css";

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

    // Dashboard states
    const [stores, setStores] = useState([]);
    const [filteredStores, setFilteredStores] = useState([]);
    const [search, setSearch] = useState("");
    const [dashboardLoading, setDashboardLoading] = useState(false);
    const [dashboardError, setDashboardError] = useState("");
    const [ratings, setRatings] = useState({});
    const [ratingLoading, setRatingLoading] = useState({});
    const [selectedRating, setSelectedRating] = useState({});

    // =========================
    // LOGIN
    // =========================

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

    // =========================
    // REGISTER
    // =========================

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

    // =========================
    // FETCH STORES
    // =========================

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

            // Get user's rating for every store
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

    // Fetch stores when dashboard opens
    useEffect(() => {
        if (isLoggedIn) {
            fetchStores();
        }
    }, [isLoggedIn]);

    // =========================
    // SEARCH
    // =========================

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

    // =========================
    // SUBMIT / UPDATE RATING
    // =========================

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

            // Refresh store averages
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

    // =========================
    // LOGOUT
    // =========================

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

    // =========================
    // SWITCH AUTH SCREENS
    // =========================

    const switchToRegister = () => {
        setMessage("");
        setIsRegistering(true);
    };

    const switchToLogin = () => {
        setMessage("");
        setIsRegistering(false);
    };

    // =========================
    // DASHBOARD
    // =========================

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
            <>
                <style>{`
                    .dashboard {
                        min-height: 100vh;
                        background:
                            radial-gradient(circle at 15% 10%, rgba(112, 55, 255, .18), transparent 28%),
                            radial-gradient(circle at 90% 80%, rgba(62, 125, 255, .13), transparent 30%),
                            #070812;
                        color: #f7f7fb;
                        font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                        padding-bottom: 70px;
                    }

                    .dashboard-nav {
                        height: 76px;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding: 0 7%;
                        border-bottom: 1px solid rgba(255,255,255,.07);
                        background: rgba(7,8,18,.72);
                        backdrop-filter: blur(18px);
                        position: sticky;
                        top: 0;
                        z-index: 20;
                    }

                    .dashboard-brand {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        font-size: 21px;
                        font-weight: 800;
                    }

                    .dashboard-brand-icon {
                        width: 38px;
                        height: 38px;
                        display: grid;
                        place-items: center;
                        border-radius: 12px;
                        background: linear-gradient(135deg,#7c3aed,#4f46e5);
                        box-shadow: 0 10px 30px rgba(124,58,237,.4);
                    }

                    .dashboard-user {
                        display: flex;
                        align-items: center;
                        gap: 13px;
                    }

                    .avatar {
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        display: grid;
                        place-items: center;
                        font-weight: 800;
                        background: linear-gradient(135deg,#8b5cf6,#3b82f6);
                    }

                    .user-name {
                        font-size: 14px;
                        font-weight: 700;
                    }

                    .user-role {
                        font-size: 11px;
                        color: #8f92a8;
                        margin-top: 2px;
                    }

                    .logout-button {
                        border: 1px solid rgba(255,255,255,.1);
                        background: rgba(255,255,255,.04);
                        color: #c5c7d8;
                        padding: 9px 15px;
                        border-radius: 10px;
                        cursor: pointer;
                        transition: .2s;
                    }

                    .logout-button:hover {
                        background: rgba(255,255,255,.09);
                        color: white;
                    }

                    .dashboard-container {
                        width: min(1180px, 86%);
                        margin: auto;
                    }

                    .dashboard-hero {
                        padding: 65px 0 35px;
                        display: grid;
                        grid-template-columns: 1.5fr .8fr;
                        gap: 30px;
                        align-items: end;
                    }

                    .dashboard-eyebrow {
                        color: #9b7cff;
                        font-size: 12px;
                        font-weight: 800;
                        letter-spacing: 2px;
                        text-transform: uppercase;
                        margin-bottom: 15px;
                    }

                    .dashboard-title {
                        font-size: clamp(38px, 5vw, 62px);
                        line-height: .98;
                        letter-spacing: -2.5px;
                        margin: 0;
                    }

                    .dashboard-title span {
                        background: linear-gradient(90deg,#a78bfa,#60a5fa);
                        -webkit-background-clip: text;
                        color: transparent;
                    }

                    .dashboard-subtitle {
                        color: #9296ae;
                        font-size: 16px;
                        line-height: 1.7;
                        max-width: 650px;
                        margin-top: 20px;
                    }

                    .stats {
                        display: grid;
                        grid-template-columns: repeat(3,1fr);
                        gap: 12px;
                    }

                    .stat {
                        padding: 20px;
                        border: 1px solid rgba(255,255,255,.08);
                        background: rgba(255,255,255,.035);
                        border-radius: 18px;
                    }

                    .stat-number {
                        font-size: 25px;
                        font-weight: 800;
                    }

                    .stat-label {
                        color: #81859c;
                        font-size: 11px;
                        margin-top: 5px;
                    }

                    .search-box {
                        position: relative;
                        margin: 25px 0 35px;
                    }

                    .search-box input {
                        width: 100%;
                        box-sizing: border-box;
                        padding: 19px 22px 19px 52px;
                        border-radius: 16px;
                        border: 1px solid rgba(255,255,255,.09);
                        background: rgba(255,255,255,.045);
                        color: white;
                        font-size: 15px;
                        outline: none;
                        transition: .25s;
                    }

                    .search-box input:focus {
                        border-color: rgba(139,92,246,.7);
                        box-shadow: 0 0 0 4px rgba(139,92,246,.08);
                    }

                    .search-icon {
                        position: absolute;
                        left: 20px;
                        top: 50%;
                        transform: translateY(-50%);
                        color: #777b94;
                    }

                    .section-heading {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 18px;
                    }

                    .section-heading h2 {
                        font-size: 22px;
                        margin: 0;
                    }

                    .result-count {
                        color: #777b94;
                        font-size: 13px;
                    }

                    .store-grid {
                        display: grid;
                        grid-template-columns: repeat(3,1fr);
                        gap: 18px;
                    }

                    .store-card {
                        position: relative;
                        overflow: hidden;
                        border: 1px solid rgba(255,255,255,.08);
                        border-radius: 22px;
                        padding: 23px;
                        background: linear-gradient(145deg,rgba(255,255,255,.055),rgba(255,255,255,.018));
                        transition: transform .25s, border-color .25s, box-shadow .25s;
                    }

                    .store-card:hover {
                        transform: translateY(-5px);
                        border-color: rgba(139,92,246,.35);
                        box-shadow: 0 20px 55px rgba(0,0,0,.28);
                    }

                    .store-glow {
                        position: absolute;
                        width: 120px;
                        height: 120px;
                        background: rgba(124,58,237,.15);
                        filter: blur(50px);
                        top: -50px;
                        right: -30px;
                    }

                    .store-top {
                        display: flex;
                        justify-content: space-between;
                        gap: 12px;
                        position: relative;
                    }

                    .store-icon {
                        width: 48px;
                        height: 48px;
                        display: grid;
                        place-items: center;
                        border-radius: 14px;
                        background: linear-gradient(135deg,rgba(124,58,237,.3),rgba(59,130,246,.18));
                        font-size: 20px;
                    }

                    .average {
                        display: flex;
                        align-items: center;
                        gap: 5px;
                        color: #fbbf24;
                        font-weight: 800;
                        font-size: 14px;
                    }

                    .store-name {
                        font-size: 18px;
                        margin: 20px 0 8px;
                    }

                    .store-address {
                        color: #85899f;
                        font-size: 13px;
                        line-height: 1.6;
                        min-height: 42px;
                    }

                    .rating-area {
                        margin-top: 22px;
                        padding-top: 18px;
                        border-top: 1px solid rgba(255,255,255,.07);
                    }

                    .your-rating {
                        font-size: 11px;
                        color: #81859c;
                        margin-bottom: 10px;
                    }

                    .stars {
                        display: flex;
                        gap: 5px;
                    }

                    .star-button {
                        width: 31px;
                        height: 31px;
                        border-radius: 9px;
                        border: 1px solid rgba(255,255,255,.08);
                        background: rgba(255,255,255,.04);
                        color: #62667c;
                        cursor: pointer;
                        transition: .15s;
                    }

                    .star-button:hover,
                    .star-button.active {
                        color: #fbbf24;
                        background: rgba(251,191,36,.09);
                        border-color: rgba(251,191,36,.25);
                    }

                    .rate-button {
                        width: 100%;
                        margin-top: 12px;
                        padding: 11px;
                        border: 0;
                        border-radius: 10px;
                        background: linear-gradient(90deg,#7c3aed,#4f46e5);
                        color: white;
                        font-weight: 700;
                        cursor: pointer;
                        transition: .2s;
                    }

                    .rate-button:hover {
                        transform: translateY(-1px);
                        box-shadow: 0 8px 25px rgba(99,60,220,.3);
                    }

                    .rate-button:disabled {
                        opacity: .5;
                        cursor: not-allowed;
                    }

                    .already-rated {
                        color: #8f92a8;
                        font-size: 12px;
                    }

                    .empty-state {
                        text-align: center;
                        padding: 70px 20px;
                        border: 1px dashed rgba(255,255,255,.1);
                        border-radius: 20px;
                        color: #85899f;
                    }

                    .error-state {
                        padding: 18px;
                        border-radius: 14px;
                        background: rgba(239,68,68,.08);
                        border: 1px solid rgba(239,68,68,.2);
                        color: #fca5a5;
                    }

                    @media(max-width:900px) {
                        .dashboard-hero {
                            grid-template-columns: 1fr;
                        }

                        .store-grid {
                            grid-template-columns: repeat(2,1fr);
                        }
                    }

                    @media(max-width:650px) {
                        .dashboard-nav {
                            padding: 0 5%;
                        }

                        .dashboard-container {
                            width: 90%;
                        }

                        .dashboard-user > div:not(.avatar) {
                            display: none;
                        }

                        .stats {
                            grid-template-columns: 1fr;
                        }

                        .store-grid {
                            grid-template-columns: 1fr;
                        }

                        .dashboard-title {
                            font-size: 43px;
                        }
                    }
                `}</style>

                <div className="dashboard">

                    {/* NAVBAR */}
                    <nav className="dashboard-nav">

                        <div className="dashboard-brand">
                            <div className="dashboard-brand-icon">
                                ★
                            </div>
                            RateNest
                        </div>

                        <div className="dashboard-user">

                            <div className="avatar">
                                {user.name?.charAt(0).toUpperCase()}
                            </div>

                            <div>
                                <div className="user-name">
                                    {user.name}
                                </div>

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

                        {/* HERO */}
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
                                    Find stores people trust, explore
                                    community ratings, and share your
                                    own experience.
                                </p>
                            </div>

                            <div className="stats">

                                <div className="stat">
                                    <div className="stat-number">
                                        {stores.length}
                                    </div>

                                    <div className="stat-label">
                                        STORES
                                    </div>
                                </div>

                                <div className="stat">
                                    <div className="stat-number">
                                        {ratedStores}
                                    </div>

                                    <div className="stat-label">
                                        YOUR RATINGS
                                    </div>
                                </div>

                                <div className="stat">
                                    <div className="stat-number">
                                        {averageRating}
                                    </div>

                                    <div className="stat-label">
                                        AVG. RATING
                                    </div>
                                </div>

                            </div>

                        </section>

                        {/* SEARCH */}
                        <div className="search-box">

                            <span className="search-icon">
                                🔍
                            </span>

                            <input
                                type="text"
                                placeholder="Search stores by name, location or email..."
                                value={search}
                                onChange={(e) =>
                                    setSearch(e.target.value)
                                }
                            />

                        </div>

                        {/* STORES */}
                        <div className="section-heading">

                            <h2>
                                Explore stores
                            </h2>

                            <span className="result-count">
                                {filteredStores.length} result
                                {filteredStores.length !== 1
                                    ? "s"
                                    : ""}
                            </span>

                        </div>

                        {dashboardLoading ? (

                            <div className="empty-state">
                                <h3>Loading your stores...</h3>
                                <p>
                                    Getting the latest ratings for you.
                                </p>
                            </div>

                        ) : dashboardError ? (

                            <div className="error-state">
                                {dashboardError}
                            </div>

                        ) : filteredStores.length === 0 ? (

                            <div className="empty-state">
                                <h3>No stores found</h3>
                                <p>
                                    Try searching for another store or
                                    location.
                                </p>
                            </div>

                        ) : (

                            <div className="store-grid">

                                {filteredStores.map((store) => {

                                    const currentRating =
                                        selectedRating[store.id] ||
                                        ratings[store.id] ||
                                        0;

                                    const hasRated =
                                        !!ratings[store.id];

                                    return (
                                        <article
                                            className="store-card"
                                            key={store.id}
                                        >

                                            <div className="store-glow"></div>

                                            <div className="store-top">

                                                <div className="store-icon">
                                                    🏪
                                                </div>

                                                <div className="average">
                                                    ★{" "}
                                                    {Number(
                                                        store.average_rating ||
                                                            0
                                                    ).toFixed(1)}
                                                </div>

                                            </div>

                                            <h3 className="store-name">
                                                {store.name}
                                            </h3>

                                            <p className="store-address">
                                                📍 {store.address}
                                            </p>

                                            <div className="rating-area">

                                                {user.role === "USER" ? (
                                                    <>
                                                        <div className="your-rating">
                                                            {hasRated
                                                                ? `Your rating: ${ratings[store.id]}/5`
                                                                : "Rate this store"}
                                                        </div>

                                                        <div className="stars">

                                                            {[1, 2, 3, 4, 5].map(
                                                                (star) => (
                                                                    <button
                                                                        key={star}
                                                                        className={`star-button ${
                                                                            currentRating >=
                                                                            star
                                                                                ? "active"
                                                                                : ""
                                                                        }`}
                                                                        onClick={() =>
                                                                            setSelectedRating(
                                                                                (
                                                                                    prev
                                                                                ) => ({
                                                                                    ...prev,
                                                                                    [store.id]:
                                                                                        star
                                                                                })
                                                                            )
                                                                        }
                                                                    >
                                                                        ★
                                                                    </button>
                                                                )
                                                            )}

                                                        </div>

                                                        {selectedRating[
                                                            store.id
                                                        ] ? (
                                                            <button
                                                                className="rate-button"
                                                                disabled={
                                                                    ratingLoading[
                                                                        store.id
                                                                    ]
                                                                }
                                                                onClick={() =>
                                                                    handleRating(
                                                                        store.id
                                                                    )
                                                                }
                                                            >
                                                                {ratingLoading[
                                                                    store.id
                                                                ]
                                                                    ? "Saving..."
                                                                    : hasRated
                                                                    ? "Update rating"
                                                                    : "Submit rating"}
                                                            </button>
                                                        ) : (
                                                            <div
                                                                className="already-rated"
                                                                style={{
                                                                    marginTop:
                                                                        "12px"
                                                                }}
                                                            >
                                                                {hasRated
                                                                    ? "Choose a new rating to update it"
                                                                    : "Select stars to rate"}
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="already-rated">
                                                        Administrator view
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
            </>
        );
    }

    // =========================
    // LOGIN / REGISTER UI
    // =========================

    return (
        <div className="app">

            <div className="background-glow glow-one"></div>
            <div className="background-glow glow-two"></div>

            <main className="login-page">

                {/* LEFT SIDE */}

                <section className="hero-section">

                    <div className="brand">
                        <div className="brand-icon">★</div>
                        <span>RateNest</span>
                    </div>

                    <div className="hero-content">

                        <div className="eyebrow">
                            ✦ SMART STORE REVIEWS
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

                                <span>★</span>

                                <div>
                                    <strong>Real ratings</strong>

                                    <small>
                                        Honest customer experiences
                                    </small>
                                </div>

                            </div>

                            <div className="feature">

                                <span>✓</span>

                                <div>
                                    <strong>Trusted reviews</strong>

                                    <small>
                                        Built for better decisions
                                    </small>
                                </div>

                            </div>

                        </div>

                    </div>

                    <div className="hero-footer">
                        © 2026 RateNest
                    </div>

                </section>

                {/* RIGHT SIDE */}

                <section className="form-section">

                    <div className="login-card">

                        <div className="mobile-brand">

                            <div className="brand-icon">
                                ★
                            </div>

                            <span>
                                RateNest
                            </span>

                        </div>

                        {!isRegistering ? (

                            /* LOGIN */

                            <>
                                <div className="form-heading">

                                    <p className="welcome">
                                        WELCOME BACK
                                    </p>

                                    <h2>
                                        Sign in to your account
                                    </h2>

                                    <p className="subtitle">
                                        Continue discovering great places.
                                    </p>

                                </div>

                                <form onSubmit={handleLogin}>

                                    <div className="input-group">

                                        <label>
                                            Email address
                                        </label>

                                        <div className="input-wrapper">

                                            <span className="input-icon">
                                                ✉
                                            </span>

                                            <input
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

                                            <label>
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

                                            <span className="input-icon">
                                                ●
                                            </span>

                                            <input
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
                                                        password:
                                                            e.target.value
                                                    })
                                                }
                                                required
                                            />

                                            <button
                                                type="button"
                                                className="password-toggle"
                                                onClick={() =>
                                                    setShowPassword(
                                                        !showPassword
                                                    )
                                                }
                                            >
                                                {showPassword
                                                    ? "Hide"
                                                    : "Show"}
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
                                                <span className="spinner"></span>
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
                                    >
                                        {message}
                                    </div>
                                )}

                                <div className="divider">
                                    <span>
                                        NEW TO RATENEST?
                                    </span>
                                </div>

                                <button
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

                            /* REGISTER */

                            <>
                                <div className="form-heading">

                                    <p className="welcome">
                                        GET STARTED
                                    </p>

                                    <h2>
                                        Create your account
                                    </h2>

                                    <p className="subtitle">
                                        Join RateNest and start sharing your
                                        experience.
                                    </p>

                                </div>

                                <form onSubmit={handleRegister}>

                                    <div className="input-group">

                                        <label>
                                            Full name
                                            <span className="hint">
                                                {" "}20–60 characters
                                            </span>
                                        </label>

                                        <div className="input-wrapper">

                                            <span className="input-icon">
                                                ♙
                                            </span>

                                            <input
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

                                        <label>
                                            Email address
                                        </label>

                                        <div className="input-wrapper">

                                            <span className="input-icon">
                                                ✉
                                            </span>

                                            <input
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

                                        <label>
                                            Address
                                            <span className="hint">
                                                {" "}up to 400 characters
                                            </span>
                                        </label>

                                        <div className="input-wrapper textarea-wrapper">

                                            <span className="input-icon">
                                                ⌖
                                            </span>

                                            <textarea
                                                placeholder="Enter your address"
                                                value={registerData.address}
                                                onChange={(e) =>
                                                    setRegisterData({
                                                        ...registerData,
                                                        address:
                                                            e.target.value
                                                    })
                                                }
                                                required
                                            />

                                        </div>

                                    </div>

                                    <div className="input-group">

                                        <label>
                                            Password
                                        </label>

                                        <div className="input-wrapper">

                                            <span className="input-icon">
                                                ●
                                            </span>

                                            <input
                                                type={
                                                    showRegisterPassword
                                                        ? "text"
                                                        : "password"
                                                }
                                                placeholder="Create a strong password"
                                                value={
                                                    registerData.password
                                                }
                                                onChange={(e) =>
                                                    setRegisterData({
                                                        ...registerData,
                                                        password:
                                                            e.target.value
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
                                            8–16 characters • 1 uppercase •
                                            1 special character
                                        </div>

                                    </div>

                                    <button
                                        type="submit"
                                        className="login-button"
                                        disabled={loading}
                                    >

                                        {loading ? (
                                            <>
                                                <span className="spinner"></span>
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
                                    >
                                        {message}
                                    </div>
                                )}

                                <div className="divider">
                                    <span>
                                        ALREADY HAVE AN ACCOUNT?
                                    </span>
                                </div>

                                <button
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