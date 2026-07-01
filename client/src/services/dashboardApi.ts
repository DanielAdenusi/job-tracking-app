import { apiFetch } from "../lib/api";
import type { DashboardStats } from "../types/dashboard";

export function getDashboardStats() {
	return apiFetch<DashboardStats>("/dashboard/stats");
}
