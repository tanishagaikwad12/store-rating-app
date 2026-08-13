export function SearchIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
        </svg>
    );
}

export function StoreSkeleton() {
    return (
        <div className="skeleton-card">
            <div className="skeleton-line skeleton-line--icon" />
            <div className="skeleton-line skeleton-line--title" />
            <div className="skeleton-line skeleton-line--long" />
            <div className="skeleton-line skeleton-line--medium" />
        </div>
    );
}

export function EmptyState({ icon = "🔍", title, message }) {
    return (
        <div className="empty-state">
            <div className="empty-state-icon">{icon}</div>
            <h3>{title}</h3>
            <p>{message}</p>
        </div>
    );
}

export function ErrorState({ message }) {
    return (
        <div className="error-state" role="alert">
            <span className="error-state-icon">⚠</span>
            <span>{message}</span>
        </div>
    );
}

export function UnavailableNotice({ title, message }) {
    return (
        <div className="unavailable-notice">
            <div className="unavailable-notice-icon">ℹ</div>
            <div>
                <strong>{title}</strong>
                <p>{message}</p>
            </div>
        </div>
    );
}

export function RatingStars({
    storeId,
    storeName,
    displayRating,
    pendingSelection,
    onSelect,
    onHover,
    onLeave
}) {
    return (
        <div className="stars" role="group" aria-label={`Rate ${storeName}`}>
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    className={`star-button ${
                        displayRating >= star ? "active" : ""
                    } ${pendingSelection === star ? "selected-pending" : ""}`}
                    onClick={() => onSelect(storeId, star)}
                    onMouseEnter={() => onHover(storeId, star)}
                    onMouseLeave={() => onLeave(storeId)}
                    aria-label={`${star} star${star !== 1 ? "s" : ""}`}
                >
                    ★
                </button>
            ))}
        </div>
    );
}
