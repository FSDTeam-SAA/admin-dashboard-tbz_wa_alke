import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { getSession, signOut } from "next-auth/react";
import { unwrap } from "./utils";

const baseURL =
  process.env.NEXTPUBLICBASEURL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  "http://localhost:5000/api/v1";

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

const refreshApi = axios.create({
  baseURL,
  withCredentials: true,
});

let refreshPromise: Promise<string | undefined> | null = null;

api.interceptors.request.use(async (config) => {
  const session = await getSession();
  const token = session?.accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (error.response?.status !== 401 || !original || original._retry) {
      return Promise.reject(error);
    }

    original._retry = true;
    const session = await getSession();
    refreshPromise ??= refreshApi
      .post("/auth/refresh-token", { refreshToken: session?.refreshToken })
      .then((res) => unwrap<{ accessToken?: string }>(res.data, {}).accessToken)
      .finally(() => {
        refreshPromise = null;
      });

    const token = await refreshPromise;
    if (!token) {
      await signOut({ callbackUrl: "/auth/login" });
      return Promise.reject(error);
    }

    original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
    return api(original);
  },
);

export type LoginPayload = { email: string; password: string };
export type PageParams = { page?: number; limit?: number; search?: string; role?: string; status?: string; isManual?: boolean };

export const authApi = {
  login: (payload: LoginPayload) => api.post("/auth/login", payload).then((r) => r.data),
  logout: () => api.post("/auth/logout").then((r) => r.data),
  forgotPassword: (email: string) => api.post("/auth/forgot-password", { email }).then((r) => r.data),
  verifyResetOtp: (payload: { email: string; otp: string }) => api.post("/auth/verify-reset-otp", payload).then((r) => r.data),
  resetPassword: (payload: { resetToken: string; newPassword: string; confirmPassword: string }) => api.post("/auth/reset-password", payload).then((r) => r.data),
  changePassword: (payload: { currentPassword: string; newPassword: string; confirmPassword: string }) => api.patch("/auth/change-password", payload).then((r) => r.data),
};

export const adminApi = {
  me: () => api.get("/users/me").then((r) => unwrap(r.data, null)),
  updateMe: (payload: FormData | Record<string, unknown>) => api.patch("/users/me", payload).then((r) => r.data),
  dashboard: () => api.get("/dashboard").then((r) => unwrap(r.data, null)),
  revenue: () => api.get("/dashboard/revenue").then((r) => unwrap(r.data, null)),
  users: (params?: PageParams) => api.get("/users", { params }).then((r) => unwrap(r.data, null)),
  user: (id: string) => api.get(`/users/${id}`).then((r) => unwrap(r.data, null)),
  approveUser: (id: string) => api.patch(`/users/${id}/approve`).then((r) => r.data),
  rejectUser: (id: string) => api.patch(`/users/${id}/reject`).then((r) => r.data),
  deleteUser: (id: string) => api.delete(`/users/${id}`).then((r) => r.data),
  updateLevel: (id: string, level: string) => api.patch(`/users/${id}/level`, { level }).then((r) => r.data),
  groups: (params?: PageParams) => api.get("/groups", { params }).then((r) => unwrap(r.data, null)),
  createGroup: (payload: Record<string, unknown>) => api.post("/groups", payload).then((r) => r.data),
  updateGroup: (id: string, payload: Record<string, unknown>) => api.patch(`/groups/${id}`, payload).then((r) => r.data),
  deleteGroup: (id: string) => api.delete(`/groups/${id}`).then((r) => r.data),
  liveClasses: (params?: PageParams) => api.get("/live-classes", { params }).then((r) => unwrap(r.data, null)),
  createLiveClass: (payload: Record<string, unknown>) => api.post("/live-classes", payload).then((r) => r.data),
  payments: (params?: PageParams) => api.get("/payments", { params }).then((r) => unwrap(r.data, null)),
  approvePayment: (id: string) => api.patch(`/payments/${id}/approve`).then((r) => r.data),
  rejectPayment: (id: string) => api.patch(`/payments/${id}/reject`).then((r) => r.data),
  plans: () => api.get("/plans/subscribers").then((r) => unwrap(r.data, null)),
  updatePlan: (id: string, payload: Record<string, unknown>) => api.patch(`/plans/${id}`, payload).then((r) => r.data),
  wallets: (params?: PageParams) => api.get("/wallet", { params }).then((r) => unwrap(r.data, null)),
  adjustWallet: (userId: string, payload: Record<string, unknown>) => api.patch(`/wallet/${userId}/adjust`, payload).then((r) => r.data),
  referrals: () => api.get("/referrals").then((r) => unwrap(r.data, null)),
  referralSettings: () => api.get("/referrals/settings").then((r) => unwrap(r.data, null)),
  updateReferralSettings: (payload: Record<string, unknown>) => api.patch("/referrals/settings", payload).then((r) => r.data),
  lessons: () => api.get("/lessons").then((r) => unwrap(r.data, null)),
  library: () => api.get("/library/all").then((r) => unwrap(r.data, null)),
};
