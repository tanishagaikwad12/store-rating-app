function roleLabel(role) {
    if (role === "ADMIN") return "Administrator";
    if (role === "OWNER") return "Store owner";
    return "RateNest member";
}

export default function DashboardShell({ user, onLogout, children }) {
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
                        <div className="user-role">{roleLabel(user.role)}</div>
                    </div>

                    <button type="button" className="logout-button" onClick={onLogout}>
                        Logout
                    </button>
                </div>
            </nav>

            <div className="dashboard-container">{children}</div>
        </div>
    );
}
