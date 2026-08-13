import { useEffect, useState } from "react";
import DashboardShell from "./DashboardShell";
import {
    SearchIcon,
    StoreSkeleton,
    EmptyState,
    ErrorState,
    RatingStars
} from "./ui";
import { getToken } from "../api";

export default function UserDashboard({ user, onLogout }) {
    const [stores, setStores] = useState([]);
    const [filteredStores, setFilteredStores] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [ratings, setRatings] = useState({});
    const [ratingLoading, setRatingLoading] = useState({});
    const [selectedRating, setSelectedRating] = useState({});
    const [hoverRating, setHoverRating] = useState({});

    const fetchStores = async () => {
        const token = getToken();
        if (!token) return;

        setLoading(true);
        setError("");

        try {
            const response = await fetch("http://localhost:5000/api/stores", {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to load stores");
            }

            setStores(data);
            setFilteredStores(data);

            const ratingResults = {};

            for (const store of data) {
                try {
                    const ratingResponse = await fetch(
                        `http://localhost:5000/api/ratings/my/${store.id}`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );

                    if (ratingResponse.ok) {
                        const ratingData = await ratingResponse.json();
                        ratingResults[store.id] = ratingData.rating;
                    }
                } catch {
                    // Ignore individual rating errors
                }
            }

            setRatings(ratingResults);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStores();
    }, []);

    useEffect(() => {
        const searchValue = search.toLowerCase().trim();

        if (!searchValue) {
            setFilteredStores(stores);
            return;
        }

        setFilteredStores(
            stores.filter(
                (store) =>
                    store.name?.toLowerCase().includes(searchValue) ||
                    store.address?.toLowerCase().includes(searchValue) ||
                    store.email?.toLowerCase().includes(searchValue)
            )
        );
    }, [search, stores]);

    const handleRating = async (storeId) => {
        const rating = selectedRating[storeId];
        if (!rating) return;

        const token = getToken();

        setRatingLoading((prev) => ({ ...prev, [storeId]: true }));

        try {
            const existingRating = ratings[storeId];
            const url = existingRating
                ? `http://localhost:5000/api/ratings/${storeId}`
                : "http://localhost:5000/api/ratings";
            const method = existingRating ? "PUT" : "POST";
            const body = existingRating
                ? { rating }
                : { store_id: storeId, rating };

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
                throw new Error(data.message || "Failed to submit rating");
            }

            setRatings((prev) => ({ ...prev, [storeId]: rating }));
            setSelectedRating((prev) => ({ ...prev, [storeId]: null }));
            await fetchStores();
        } catch (err) {
            alert(err.message);
        } finally {
            setRatingLoading((prev) => ({ ...prev, [storeId]: false }));
        }
    };

    const ratedStores = Object.values(ratings).filter(Boolean).length;
    const averageRating =
        stores.length > 0
            ? (
                  stores.reduce(
                      (sum, store) => sum + Number(store.average_rating || 0),
                      0
                  ) / stores.length
              ).toFixed(1)
            : "0.0";

    return (
        <DashboardShell user={user} onLogout={onLogout}>
            <section className="dashboard-hero">
                <div>
                    <div className="dashboard-eyebrow">✦ Your discovery space</div>
                    <h1 className="dashboard-title">
                        Discover.
                        <br />
                        <span>Rate.</span> Decide.
                    </h1>
                    <p className="dashboard-subtitle">
                        Find stores people trust, explore community ratings, and
                        share your own experience.
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

            {loading ? (
                <div className="skeleton-grid">
                    <StoreSkeleton />
                    <StoreSkeleton />
                    <StoreSkeleton />
                </div>
            ) : error ? (
                <ErrorState message={error} />
            ) : filteredStores.length === 0 ? (
                <EmptyState
                    title="No places found"
                    message="Try searching for a different store, location, or email."
                />
            ) : (
                <div className="store-grid">
                    {filteredStores.map((store) => {
                        const hasRated = !!ratings[store.id];
                        const pendingSelection = selectedRating[store.id];
                        const displayRating =
                            hoverRating[store.id] ||
                            pendingSelection ||
                            ratings[store.id] ||
                            0;

                        return (
                            <article className="store-card" key={store.id}>
                                <div className="store-glow" aria-hidden="true" />

                                <div className="store-top">
                                    <div className="store-icon">🏪</div>
                                    <div className="average">
                                        <span className="average-star">★</span>
                                        {Number(store.average_rating || 0).toFixed(1)}
                                    </div>
                                </div>

                                <h3 className="store-name">{store.name}</h3>
                                <p className="store-address">
                                    <span className="store-address-icon">📍</span>
                                    {store.address}
                                </p>

                                <div className="store-divider" />

                                <div className="rating-area">
                                    <div className="your-rating">
                                        {hasRated
                                            ? `Your rating · ${ratings[store.id]}/5`
                                            : "Your rating"}
                                    </div>

                                    <RatingStars
                                        storeId={store.id}
                                        storeName={store.name}
                                        displayRating={displayRating}
                                        pendingSelection={pendingSelection}
                                        onSelect={(id, star) =>
                                            setSelectedRating((prev) => ({
                                                ...prev,
                                                [id]: star
                                            }))
                                        }
                                        onHover={(id, star) =>
                                            setHoverRating((prev) => ({
                                                ...prev,
                                                [id]: star
                                            }))
                                        }
                                        onLeave={(id) =>
                                            setHoverRating((prev) => ({
                                                ...prev,
                                                [id]: null
                                            }))
                                        }
                                    />

                                    {pendingSelection ? (
                                        <button
                                            type="button"
                                            className="rate-button"
                                            disabled={ratingLoading[store.id]}
                                            onClick={() => handleRating(store.id)}
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
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </DashboardShell>
    );
}
