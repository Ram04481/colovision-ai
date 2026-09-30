/// <reference types="vite/client" />
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8080/api",
});

// Automatically send JWT token with every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// =========================
// ADMIN API FUNCTIONS
// =========================

export async function getPendingUsers() {
  const response = await api.get("/admin/users/pending");
  return response.data;
}

// === ADDED FUNCTION START ===
export async function getApprovedUsers() {
  const response = await api.get("/admin/users/approved");
  return response.data;
}
// === ADDED FUNCTION END ===

export async function approveUser(id: number) {
  const response = await api.put(`/admin/users/${id}/approve`);
  return response.data;
}

export async function rejectUser(id: number) {
  const response = await api.put(`/admin/users/${id}/reject`);
  return response.data;
}

export async function suspendUser(id: number) {
  const response = await api.put(`/admin/users/${id}/suspend`);
  return response.data;
}