const API_URL = "https://ssfms.onrender.com/api";

function getToken() {
	return localStorage.getItem("token");
}

async function fetchWithAuth(endpoint, options = {}) {
	const response = await fetch(`${API_URL}${endpoint}`, {
		...options,
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${getToken()}`,
			...options.headers,
		},
	});

	if (response.status === 401) {
		localStorage.removeItem("token");
		localStorage.removeItem("user");
		window.location.reload();
		return;
	}

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Something went wrong");
	}

	return response.json();
}

export const api = {
	login: (credentials) =>
		fetch(`${API_URL}/auth/login`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(credentials),
		}).then((r) => r.json()),

	getFields: () => fetchWithAuth("/fields"),
	getField: (id) => fetchWithAuth(`/fields/${id}`),
	createField: (data) =>
		fetchWithAuth("/fields", {
			method: "POST",
			body: JSON.stringify(data),
		}),
	updateField: (id, data) =>
		fetchWithAuth(`/fields/${id}/updates`, {
			method: "POST",
			body: JSON.stringify(data),
		}),
	deleteField: (id) => fetchWithAuth(`/fields/${id}`, { method: "DELETE" }),
	getDashboard: () => fetchWithAuth("/dashboard"),
};
