import { useEffect, useMemo, useState } from "react";
import DashboardShell from "./DashboardShell";
import { SearchIcon, StoreSkeleton, EmptyState, ErrorState } from "./ui";
import { apiFetch, authHeaders } from "../api";

const TABS = [
    { id: "overview", label: "Overview" },
    { id: "stores", label: "Stores" },
    { id: "users", label: "Users" }
];

export default function AdminDashboard({ user, onLogout }) {
    const [activeTab, setActiveTab] = useState("overview");
    const [stores, setStores] = useState([]);
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [usersLoading, setUsersLoading] = useState(false);
    const [error, setError] = useState("");
    const [usersError, setUsersError] = useState("");
    const [storeSearch, setStoreSearch] = useState("");
    const [userSearch, setUserSearch] = useState("");
    const [showAddStore, setShowAddStore] = useState(false);
    const [showAddUser, setShowAddUser] = useState(false);
    const [addLoading, setAddLoading] = useState(false);
    const [addMessage, setAddMessage] = useState("");
    const [storeForm, setStoreForm] = useState({ name: "", email: "", address: "", owner_id: "" });
    const [userForm, setUserForm] = useState({ name: "", email: "", address: "", password: "", role: "USER" });

    const fetchStats = async () => {
        try {
            setStats(await apiFetch("/admin/dashboard", { headers: authHeaders() }));
        } catch (err) {
            setError(err.message);
        }
    };
    const fetchStores = async () => {
        setLoading(true); setError("");
        try { setStores(await apiFetch("/stores", { headers: authHeaders() })); }
        catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };
    const fetchUsers = async (search = "") => {
        setUsersLoading(true); setUsersError("");
        try {
            const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
            setUsers(await apiFetch(`/admin/users${query}`, { headers: authHeaders() }));
        } catch (err) { setUsersError(err.message); }
        finally { setUsersLoading(false); }
    };

    useEffect(() => { fetchStores(); fetchStats(); fetchUsers(); }, []);
    useEffect(() => {
        const timer = setTimeout(() => fetchUsers(userSearch), 200);
        return () => clearTimeout(timer);
    }, [userSearch]);

    const filteredStores = useMemo(() => {
        const value = storeSearch.toLowerCase().trim();
        return value ? stores.filter((store) => store.name?.toLowerCase().includes(value) || store.email?.toLowerCase().includes(value) || store.address?.toLowerCase().includes(value)) : stores;
    }, [stores, storeSearch]);

    const handleAddStore = async (event) => {
        event.preventDefault(); setAddLoading(true); setAddMessage("");
        try {
            await apiFetch("/stores", { method: "POST", headers: authHeaders(), body: JSON.stringify({ ...storeForm, name: storeForm.name.trim(), email: storeForm.email.trim() || null, address: storeForm.address.trim(), owner_id: storeForm.owner_id ? Number(storeForm.owner_id) : null }) });
            setStoreForm({ name: "", email: "", address: "", owner_id: "" }); setShowAddStore(false); setAddMessage("Store added successfully.");
            await Promise.all([fetchStores(), fetchStats()]);
        } catch (err) { setAddMessage(err.message); }
        finally { setAddLoading(false); }
    };
    const handleAddUser = async (event) => {
        event.preventDefault(); setAddLoading(true); setAddMessage("");
        try {
            await apiFetch("/admin/users", { method: "POST", headers: authHeaders(), body: JSON.stringify(userForm) });
            setUserForm({ name: "", email: "", address: "", password: "", role: "USER" }); setShowAddUser(false); setAddMessage("User added successfully.");
            await Promise.all([fetchUsers(userSearch), fetchStats()]);
        } catch (err) { setAddMessage(err.message); }
        finally { setAddLoading(false); }
    };
    const message = addMessage && <div className={`message ${addMessage.includes("successfully") ? "success" : "error"}`} role="alert">{addMessage}</div>;

    return <DashboardShell user={user} onLogout={onLogout}>
        <section className="dashboard-hero dashboard-hero--compact"><div><div className="dashboard-eyebrow">✦ Admin control center</div><h1 className="dashboard-title">Manage.<br /><span>Monitor.</span> Grow.</h1><p className="dashboard-subtitle">Oversee stores and platform activity from one unified admin workspace.</p></div></section>
        <div className="panel-tabs">{TABS.map((tab) => <button key={tab.id} type="button" className={`panel-tab ${activeTab === tab.id ? "panel-tab--active" : ""}`} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>)}</div>
        {activeTab === "overview" && <div className="panel-section"><div className="stats stats--admin">
            <div className="stat"><div className="stat-index">01</div><div className="stat-number">{stats?.totalUsers ?? "—"}</div><div className="stat-label">Total users</div></div>
            <div className="stat"><div className="stat-index">02</div><div className="stat-number">{stats?.totalStores ?? "—"}</div><div className="stat-label">Total stores</div></div>
            <div className="stat"><div className="stat-index">03</div><div className="stat-number">{stats?.totalRatings ?? "—"}</div><div className="stat-label">Total ratings</div></div>
        </div>{error && <ErrorState message={error} />}</div>}
        {activeTab === "stores" && <div className="panel-section"><div className="panel-toolbar"><div className="search-box search-box--compact"><span className="search-icon"><SearchIcon /></span><input value={storeSearch} onChange={(e) => setStoreSearch(e.target.value)} placeholder="Search stores by name, email, or address..." aria-label="Search stores" /></div><button type="button" className="panel-action" onClick={() => setShowAddStore(!showAddStore)}>{showAddStore ? "Cancel" : "+ Add store"}</button></div>
            {showAddStore && <form className="inline-form" onSubmit={handleAddStore}><h3 className="inline-form-title">Add new store</h3><div className="inline-form-grid">{[["name", "Store name", "text"], ["email", "Email", "email"], ["address", "Address", "text"], ["owner_id", "Owner ID (optional)", "number"]].map(([field, label, type]) => <div className="input-group" key={field}><label>{label}</label><input type={type} min={field === "owner_id" ? "1" : undefined} required={field === "name" || field === "address"} value={storeForm[field]} onChange={(e) => setStoreForm({ ...storeForm, [field]: e.target.value })} /></div>)}</div><button className="login-button login-button--compact" disabled={addLoading}>{addLoading ? "Adding..." : "Add store"}</button>{message}</form>}
            {loading ? <div className="skeleton-grid skeleton-grid--table"><StoreSkeleton /></div> : error ? <ErrorState message={error} /> : filteredStores.length === 0 ? <EmptyState title="No stores found" message="Try a different search or add a new store." /> : <StoreTable stores={filteredStores} />}</div>}
        {activeTab === "users" && <div className="panel-section"><div className="panel-toolbar"><div className="search-box search-box--compact"><span className="search-icon"><SearchIcon /></span><input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Search users by name, email, address, or role..." aria-label="Search users" /></div><button type="button" className="panel-action" onClick={() => setShowAddUser(!showAddUser)}>{showAddUser ? "Cancel" : "+ Add user"}</button></div>
            {showAddUser && <form className="inline-form" onSubmit={handleAddUser}><h3 className="inline-form-title">Add new user</h3><div className="inline-form-grid">{[["name", "Name", "text"], ["email", "Email", "email"], ["address", "Address", "text"], ["password", "Password", "password"]].map(([field, label, type]) => <div className="input-group" key={field}><label>{label}</label><input type={type} required value={userForm[field]} onChange={(e) => setUserForm({ ...userForm, [field]: e.target.value })} /></div>)}<div className="input-group"><label>Role</label><select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}><option value="USER">USER</option><option value="ADMIN">ADMIN</option><option value="OWNER">OWNER</option></select></div></div><button className="login-button login-button--compact" disabled={addLoading}>{addLoading ? "Adding..." : "Add user"}</button>{message}</form>}
            {usersLoading ? <div className="skeleton-grid skeleton-grid--table"><StoreSkeleton /></div> : usersError ? <ErrorState message={usersError} /> : users.length === 0 ? <EmptyState icon="👥" title="No users found" message="Try a different search." /> : <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Name</th><th>Email</th><th>Address</th><th>Role</th></tr></thead><tbody>{users.map((listedUser) => <tr key={listedUser.id}><td>{listedUser.name}</td><td>{listedUser.email}</td><td>{listedUser.address}</td><td>{listedUser.role}</td></tr>)}</tbody></table></div>}</div>}
    </DashboardShell>;
}

function StoreTable({ stores }) { return <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Store name</th><th>Email</th><th>Address</th><th>Rating</th></tr></thead><tbody>{stores.map((store) => <tr key={store.id}><td>{store.name}</td><td>{store.email || "—"}</td><td>{store.address}</td><td><span className="table-rating">★ {Number(store.average_rating || 0).toFixed(1)}</span></td></tr>)}</tbody></table></div>; }
