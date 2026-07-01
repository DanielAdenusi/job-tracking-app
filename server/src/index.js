import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import applicationsRoutes from "./routes/applications.routes.js";
import { pool } from "./db/pool.js";
import { requireAuth } from "./middleware/requireAuth.js";

dotenv.config();

const app = express();
const router = express.Router();

app.use(
	cors({
		origin: process.env.CLIENT_URL,
		credentials: true,
	}),
);

app.use(express.json());

app.get("/api/db-test", async (req, res) => {
	try {
		const result = await pool.query("SELECT NOW()");
		res.json({
			message: "Database connected",
			time: result.rows[0].now,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({
			message: "Database connection failed",
		});
	}
});

app.get("/api/health", (req, res) => {
	res.json({
		status: "ok",
		message: "Job Tracker API is running",
		timestamp: new Date().toISOString(),
	});
});

app.use("/api/applications", applicationsRoutes);

router.get("/", requireAuth, async (req, res) => {
	const result = await pool.query(
		`
    SELECT *
    FROM applications
    WHERE user_id = $1
    ORDER BY created_at DESC
    `,
		[req.user.id],
	);

	res.json(result.rows);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
	console.log(`API running on port ${PORT}`);
});

export default router;
