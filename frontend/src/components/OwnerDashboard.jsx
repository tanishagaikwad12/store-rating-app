import { useEffect, useState } from "react";
import DashboardShell from "./DashboardShell";
import { EmptyState, ErrorState } from "./ui";
import { apiFetch, authHeaders } from "../api";

export default function OwnerDashboard({ user, onLogout }) {
    const [dashboard, setDashboard] = useState(null);
    const [error, setError] = useState("");
    useEffect(() => {
        apiFetch("/owner/dashboard", { headers: authHeaders() })
            .then(setDashboard)
            .catch((err) => setError(err.message));
    }, []);
    const stores = dashboard?.stores || [];
    return <DashboardShell user={user} onLogout={onLogout}>
        <section className="dashboard-hero dashboard-hero--compact"><div><div className="dashboard-eyebrow">✦ Store owner portal</div><h1 className="dashboard-title">Your store.<br /><span>Your ratings.</span></h1><p className="dashboard-subtitle">Track how customers experience your business on RateNest.</p></div><div className="stats"><div className="stat"><div className="stat-index">01</div><div className="stat-number">{dashboard?.total_stores ?? "—"}</div><div className="stat-label">Your stores</div></div><div className="stat"><div className="stat-index">02</div><div className="stat-number">{dashboard ? Number(dashboard.average_rating || 0).toFixed(1) : "—"}</div><div className="stat-label">Avg. rating</div></div><div className="stat"><div className="stat-index">03</div><div className="stat-number">{dashboard?.total_ratings ?? "—"}</div><div className="stat-label">Total ratings</div></div></div></section>
        {!dashboard && !error ? <EmptyState icon="⏳" title="Loading your stores..." message="Fetching store information from the server." /> : error ? <ErrorState message={error} /> : stores.length === 0 ? <EmptyState icon="🏪" title="No stores assigned" message="No stores are linked to your account yet. An admin must assign your user ID as owner_id." /> : <><div className="section-heading"><h2>Your stores</h2><span className="result-count">{stores.length} store{stores.length !== 1 ? "s" : ""}</span></div><div className="store-grid store-grid--owner">{stores.map((store) => <article className="store-card" key={store.id}><div className="store-glow" aria-hidden="true" /><div className="store-top"><div className="store-icon">🏪</div><div className="average"><span className="average-star">★</span>{Number(store.average_rating || 0).toFixed(1)}</div></div><h3 className="store-name">{store.name}</h3><p className="store-address">📍 {store.address}</p>{store.email && <p className="store-meta">✉ {store.email}</p>}<p className="store-meta">{store.total_ratings} rating{Number(store.total_ratings) !== 1 ? "s" : ""}</p></article>)}</div><div className="panel-section panel-section--spaced"><div className="section-heading"><h2>Customer ratings</h2></div>{stores.every((store) => !store.ratings?.length) ? <EmptyState icon="★" title="No ratings yet" message="Customer ratings will appear here when submitted." /> : <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Store</th><th>Customer</th><th>Email</th><th>Rating</th></tr></thead><tbody>{stores.flatMap((store) => (store.ratings || []).map((rating) => <tr key={`${store.id}-${rating.id}`}><td>{store.name}</td><td>{rating.user_name}</td><td>{rating.user_email}</td><td><span className="table-rating">★ {rating.rating}/5</span></td></tr>))}</tbody></table></div>}</div></>}
    </DashboardShell>;
}
