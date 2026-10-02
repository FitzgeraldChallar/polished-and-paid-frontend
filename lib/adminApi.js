const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "");

export function getAdminToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("pp_admin_token");
}

export function setAdminToken(token) {
  localStorage.setItem("pp_admin_token", token);
}

export function clearAdminToken() {
  localStorage.removeItem("pp_admin_token");
}

async function request(path, options = {}) {
  const token = getAdminToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", `Token ${token}`);

  const isFormData = options.body instanceof FormData;
  if (!isFormData && options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { detail: text };
  }

  if (!response.ok) {
    const message =
      data?.detail ||
      Object.values(data || {})
        .flat()
        .filter(Boolean)
        .join(" ") ||
      "The request could not be completed.";
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const adminApi = {
  login: (payload) =>
    request("/admin/auth/login/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  logout: () => request("/admin/auth/logout/", { method: "POST" }),
  me: () => request("/admin/auth/me/"),
  dashboard: () => request("/admin/dashboard/"),

  categories: (params = "") => request(`/admin/categories/${params}`),
  createCategory: (payload) =>
    request("/admin/categories/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateCategory: (id, payload) =>
    request(`/admin/categories/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteCategory: (id) =>
    request(`/admin/categories/${id}/`, { method: "DELETE" }),

  products: (params = "") => request(`/admin/products/${params}`),
  createProduct: (payload) =>
    request("/admin/products/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateProduct: (id, payload) =>
    request(`/admin/products/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteProduct: (id) =>
    request(`/admin/products/${id}/`, { method: "DELETE" }),
  uploadProductImage: (id, formData) =>
    request(`/admin/products/${id}/images/`, {
      method: "POST",
      body: formData,
    }),
  deleteProductImage: (id, imageId) =>
    request(`/admin/products/${id}/images/${imageId}/`, {
      method: "DELETE",
    }),

  orders: (params = "") => request(`/admin/orders/${params}`),
  updateOrderStatus: (id, status) =>
    request(`/admin/orders/${id}/status/`, {
      method: "POST",
      body: JSON.stringify({ status }),
    }),

  customers: (params = "") => request(`/admin/customers/${params}`),
  payments: (params = "") => request(`/admin/payments/${params}`),
  inventory: (params = "") => request(`/admin/inventory/${params}`),
  adjustInventory: (payload) =>
    request("/admin/inventory/adjust/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export function mediaUrl(value) {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  const origin = API_BASE.replace(/\/api$/, "");
  return `${origin}${value.startsWith("/") ? value : `/${value}`}`;
}
