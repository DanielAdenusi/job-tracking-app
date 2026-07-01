import { getDashboardStats } from "../services/dashboard.service.js";

export async function getDashboardStatsController(req, res, next) {
	try {
		const dashboard = await getDashboardStats(req.user.id);

		res.json(dashboard);
	} catch (error) {
		next(error);
	}
}
