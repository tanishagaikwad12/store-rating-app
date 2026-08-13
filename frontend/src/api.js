export const API_BASE =
    import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

export function getToken() {
    return localStorage.getItem("token");
}

export function authHeaders() {
    const token = getToken();
    return {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
    };
}

export async function apiFetch(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, options);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || "Request failed");
    }

    return data;
}
