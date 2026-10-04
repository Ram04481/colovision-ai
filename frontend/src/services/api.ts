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

// Handle 401 and 403 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("access_token");
      localStorage.removeItem("role");
      localStorage.removeItem("user");
      window.location.href = "/login";
    } else if (error.response?.status === 403) {
      // Forbidden - redirect to home or show error
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

// =========================
// AUTH API FUNCTIONS
// =========================

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export async function loginUser(identifier: string, password: string): Promise<LoginResponse> {
  const response = await api.post("/auth/login", { identifier, password });
  return response.data;
}

export async function loginAdmin(identifier: string, password: string): Promise<LoginResponse> {
  const response = await api.post("/auth/admin/login", { identifier, password });
  return response.data;
}

export async function registerUser(data: {
  name: string;
  email: string;
  phone: string;
  username: string;
  password: string;
}): Promise<{ message: string }> {
  const response = await api.post("/auth/register", data);
  return response.data;
}

export function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("role");
  localStorage.removeItem("user");
  window.location.href = "/login";
}

// =========================
// PATIENT API FUNCTIONS
// =========================

export interface Patient {
  id: number;
  patientId: string;
  name: string;
  address: string;
  age: number;
  gender: string;
  contact: string;
  photoPath?: string;
  createdBy: number;
  createdAt: string;
}

export interface CreatePatientRequest {
  patientId: string;
  name: string;
  age: number;
  gender: string;
  address: string;
  contact: string;
}

export async function createPatient(data: CreatePatientRequest): Promise<Patient> {
  const response = await api.post("/patients", data);
  return response.data;
}

export async function getPatients(): Promise<Patient[]> {
  const response = await api.get("/patients");
  return response.data;
}

export async function getPatient(id: number): Promise<Patient> {
  const response = await api.get(`/patients/${id}`);
  return response.data;
}

// =========================
// PREDICTION API FUNCTIONS
// =========================

export interface Prediction {
  id: number;
  patientId: number;
  imagePath: string;
  segmentationPath: string;
  overlayPath: string;
  predictedClass: string;
  confidence: number;
  adenocarcinomaProbability: number;
  highGradeProbability: number;
  lowGradeProbability: number;
  normalProbability: number;
  polypProbability: number;
  serratedProbability: number;
  createdAt: string;
}

export async function createPrediction(patientId: number, image: File): Promise<{
  id: number;
  predicted_class: string;
  confidence: number;
  probabilities: number[];
  mask_path: string;
  overlay_path: string;
}> {
  const formData = new FormData();
  formData.append("patient_id", patientId.toString());
  formData.append("image", image);
  const response = await api.post("/prediction", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function getPredictions(patientId: number): Promise<Prediction[]> {
  const response = await api.get(`/predictions/${patientId}`);
  return response.data;
}

// =========================
// REPORT API FUNCTIONS
// =========================

export interface Report {
  id: number;
  patientId: number;
  predictionId: number;
  reportPath: string;
  createdAt: string;
}

export async function getReport(id: number): Promise<{ id: number; prediction_id: number; report_path: string }> {
  const response = await api.get(`/reports/${id}`);
  return response.data;
}

export async function downloadReport(id: number): Promise<Blob> {
  const response = await api.get(`/reports/${id}/download`, {
    responseType: "blob",
  });
  return response.data;
}

// =========================
// ADMIN API FUNCTIONS
// =========================

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  phone?: string;
  status: string;
}

export async function getPendingUsers(): Promise<User[]> {
  const response = await api.get("/admin/users/pending");
  return response.data;
}

export async function getApprovedUsers(): Promise<User[]> {
  const response = await api.get("/admin/users/approved");
  return response.data;
}

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

// =========================
// ADMIN STATS API FUNCTIONS
// =========================

export interface AdminStats {
  totalUsers: number;
  pendingUsers: number;
  approvedUsers: number;
  rejectedUsers: number;
  suspendedUsers: number;
  totalPatients: number;
  totalPredictions: number;
  totalReports: number;
  totalAdmins: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  const response = await api.get("/admin/stats");
  return response.data;
}

// =========================
// ADMIN PATIENT API FUNCTIONS
// =========================

export interface Patient {
  id: number;
  patientId: string;
  name: string;
  address: string;
  age: number;
  gender: string;
  contact: string;
  photoPath?: string;
  createdBy: number;
  createdAt: string;
}

export async function getAllPatients(): Promise<Patient[]> {
  const response = await api.get("/admin/patients");
  return response.data;
}

export async function getAdminPatient(id: number): Promise<Patient> {
  const response = await api.get(`/admin/patients/${id}`);
  return response.data;
}

export async function getPatientPredictions(patientId: number): Promise<Prediction[]> {
  const response = await api.get(`/admin/patients/${patientId}/predictions`);
  return response.data;
}