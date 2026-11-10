const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("doctorpro_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return headers;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    headers: getAuthHeaders(),
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      body.message || body.error || `Request failed (${res.status})`;
    throw new Error(Array.isArray(message) ? message.join(", ") : message);
  }

  // 204 No Content
  if (res.status === 204) return undefined as unknown as T;
  const json = await res.json();
  if (json && typeof json === "object" && "data" in json && "success" in json) {
    return json.data as T;
  }
  return json as T;
}

function get<T>(endpoint: string) {
  return request<T>(endpoint, { method: "GET" });
}

function post<T>(endpoint: string, data?: unknown) {
  return request<T>(endpoint, {
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  });
}

function put<T>(endpoint: string, data?: unknown) {
  return request<T>(endpoint, {
    method: "PUT",
    body: data ? JSON.stringify(data) : undefined,
  });
}

function patch<T>(endpoint: string, data?: unknown) {
  return request<T>(endpoint, {
    method: "PATCH",
    body: data ? JSON.stringify(data) : undefined,
  });
}

function del<T>(endpoint: string) {
  return request<T>(endpoint, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const auth = {
  login: (data: { email: string; password: string }) =>
    post<{ access_token: string; user: unknown }>("/auth/login", data),

  register: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) => post<{ access_token: string; user: unknown }>("/auth/register", data),

  doctorRegister: (data: unknown) => post<any>("/auth/doctor-register", data),

  approveDoctor: (id: string) => patch<any>(`/auth/approve-doctor/${id}`, {}),

  rejectDoctor: (id: string) => patch<any>(`/auth/reject-doctor/${id}`, {}),

  getMyAssistants: () => get<any[]>("/auth/my-assistants"),

  createMyAssistant: (data: unknown) => post<any>("/auth/my-assistants", data),

  deleteMyAssistant: (id: string) => del<any>(`/auth/my-assistants/${id}`),

  getProfile: () => get<unknown>("/auth/profile"),
};

// ---------------------------------------------------------------------------
// Doctors
// ---------------------------------------------------------------------------

export const doctors = {
  getAll: (params?: string) =>
    get<any[]>(`/doctors${params ? `?${params}` : ""}`),

  getById: (id: string) => get<any>(`/doctors/${id}`),

  getBySlug: (slug: string) => get<any>(`/doctors/${slug}`),

  create: (data: unknown) => post<any>("/doctors", data),

  update: (id: string, data: unknown) => patch<any>(`/doctors/${id}`, data),

  delete: (id: string) => del<any>(`/doctors/${id}`),
};

// ---------------------------------------------------------------------------
// Departments
// ---------------------------------------------------------------------------

export const departments = {
  getAll: (params?: string) =>
    get<unknown>(`/departments${params ? `?${params}` : ""}`),

  getById: (id: string) => get<unknown>(`/departments/${id}`),

  create: (data: unknown) => post<unknown>("/departments", data),

  update: (id: string, data: unknown) =>
    patch<unknown>(`/departments/${id}`, data),

  delete: (id: string) => del<unknown>(`/departments/${id}`),
};

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

export const services = {
  getAll: (params?: string) =>
    get<unknown>(`/services${params ? `?${params}` : ""}`),

  getById: (id: string) => get<unknown>(`/services/${id}`),

  create: (data: unknown) => post<unknown>("/services", data),

  update: (id: string, data: unknown) =>
    patch<unknown>(`/services/${id}`, data),

  delete: (id: string) => del<unknown>(`/services/${id}`),
};

// ---------------------------------------------------------------------------
// Appointments
// ---------------------------------------------------------------------------

export const appointments = {
  getAll: (params?: string) =>
    get<unknown>(`/appointments${params ? `?${params}` : ""}`),

  getById: (id: string) => get<unknown>(`/appointments/${id}`),

  book: (data: unknown) => post<unknown>("/appointments/book", data),

  bookPublic: (data: unknown) => post<unknown>("/appointments/book", data),

  create: (data: unknown) => post<unknown>("/appointments", data),

  update: (id: string, data: unknown) =>
    patch<unknown>(`/appointments/${id}`, data),

  delete: (id: string) => del<unknown>(`/appointments/${id}`),

  getAvailableSlots: (doctorId: string, date: string) =>
    get<unknown>(`/appointments/available-slots?doctorId=${doctorId}&date=${date}`),
};

// ---------------------------------------------------------------------------
// Patients
// ---------------------------------------------------------------------------

export const patients = {
  getAll: (params?: string) =>
    get<unknown>(`/patients${params ? `?${params}` : ""}`),

  getById: (id: string) => get<unknown>(`/patients/${id}`),

  create: (data: unknown) => post<unknown>("/patients", data),

  update: (id: string, data: unknown) =>
    patch<unknown>(`/patients/${id}`, data),

  delete: (id: string) => del<unknown>(`/patients/${id}`),
};

// ---------------------------------------------------------------------------
// Blog
// ---------------------------------------------------------------------------

export const blog = {
  getAll: (params?: string) =>
    get<unknown>(`/blog${params ? `?${params}` : ""}`),

  getBySlug: (slug: string) => get<unknown>(`/blog/${slug}`),

  create: (data: unknown) => post<unknown>("/blog", data),

  update: (id: string, data: unknown) => patch<unknown>(`/blog/${id}`, data),

  delete: (id: string) => del<unknown>(`/blog/${id}`),
};

// ---------------------------------------------------------------------------
// Gallery
// ---------------------------------------------------------------------------

export const gallery = {
  getAll: (params?: string) =>
    get<unknown>(`/gallery${params ? `?${params}` : ""}`),

  create: (data: unknown) => post<unknown>("/gallery", data),

  delete: (id: string) => del<unknown>(`/gallery/${id}`),
};

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export const settings = {
  getAll: () => get<unknown>("/settings"),

  update: (key: string, data: unknown) =>
    put<unknown>(`/settings/${key}`, data),

  updateBulk: (settings: { key: string; value: string; group?: string }[]) =>
    put<unknown>("/settings/bulk", { settings }),
};

// ---------------------------------------------------------------------------
// Testimonials
// ---------------------------------------------------------------------------

export const testimonials = {
  getAll: (params?: string) =>
    get<unknown>(`/testimonials${params ? `?${params}` : ""}`),

  create: (data: unknown) => post<unknown>("/testimonials", data),

  update: (id: string, data: unknown) =>
    patch<unknown>(`/testimonials/${id}`, data),

  delete: (id: string) => del<unknown>(`/testimonials/${id}`),
};

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export const dashboard = {
  getStats: () => get<unknown>("/dashboard/stats"),

  getRecentAppointments: (limit?: number) =>
    get<unknown>(`/dashboard/recent-appointments${limit ? `?limit=${limit}` : ""}`),

  getUpcomingAppointments: (limit?: number) =>
    get<unknown>(`/dashboard/upcoming-appointments${limit ? `?limit=${limit}` : ""}`),
};

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

export const upload = {
  file: async (
    file: File
  ): Promise<{ url: string; filename?: string; originalName?: string; size?: number }> => {
    const formData = new FormData();
    formData.append("file", file);

    const headers: HeadersInit = {};
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("doctorpro_token");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    const res = await fetch(`${API_BASE}/upload`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || "Upload failed");
    }

    const json = await res.json();
    return json.data || json;
  },
};

// ---------------------------------------------------------------------------
// Staff & Roles (Admin, Doctor, Doctor Assistant)
// ---------------------------------------------------------------------------

export const staff = {
  getAll: () => get<any[]>("/auth/staff"),
  create: (data: unknown) => post<any>("/auth/staff", data),
  update: (id: string, data: unknown) => patch<any>(`/auth/staff/${id}`, data),
  delete: (id: string) => del<any>(`/auth/staff/${id}`),
};

// ---------------------------------------------------------------------------
// Convenience default export
// ---------------------------------------------------------------------------

const api = {
  auth,
  staff,
  doctors,
  departments,
  services,
  appointments,
  patients,
  blog,
  gallery,
  settings,
  testimonials,
  dashboard,
  upload,
};

export default api;
