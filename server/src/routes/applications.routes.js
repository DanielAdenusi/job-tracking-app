import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { pool } from "../db/pool.js";

const router = express.Router();

// GET /api/applications
// Gets all applications for the logged-in user
router.get("/", requireAuth, async (req, res) => {
	try {
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
	} catch (error) {
		console.error("Get applications error:", error);

		res.status(500).json({
			message: "Failed to get applications",
		});
	}
});

// POST /api/applications
// Creates a new application for the logged-in user
router.post("/", requireAuth, async (req, res) => {
	try {
		const {
			company,
			role,
			location,
			jobUrl,
			salary,
			status,
			notes,
			appliedAt,
			followUpAt,
		} = req.body;

		if (!company || !role) {
			return res.status(400).json({
				message: "Company and role are required",
			});
		}

		const result = await pool.query(
			`
      INSERT INTO applications (
        user_id,
        company,
        role,
        location,
        job_url,
        salary,
        status,
        notes,
        applied_at,
        follow_up_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, COALESCE($7, 'saved'), $8, $9, $10
      )
      RETURNING *
      `,
			[
				req.user.id,
				company,
				role,
				location || null,
				jobUrl || null,
				salary || null,
				status || "saved",
				notes || null,
				appliedAt || null,
				followUpAt || null,
			],
		);

		res.status(201).json(result.rows[0]);
	} catch (error) {
		console.error("Create application error:", error);

		res.status(500).json({
			message: "Failed to create application",
		});
	}
});

// PUT /api/applications/:id
// Updates an existing application for the logged-in user
router.put("/:id", requireAuth, async (req, res) => {
	try {
		const { id } = req.params;
		const {
			company,
			role,
			location,
			jobUrl,
			salary,
			status,
			notes,
			appliedAt,
			followUpAt,
		} = req.body;

		const result = await pool.query(
			`
      UPDATE applications
        SET
            company = COALESCE($1, company),
            role = COALESCE($2, role),
            location = COALESCE($3, location),
            job_url = COALESCE($4, job_url),
            salary = COALESCE($5, salary),
            status = COALESCE($6, status),
            notes = COALESCE($7, notes),
            applied_at = COALESCE($8, applied_at),
            follow_up_at = COALESCE($9, follow_up_at)
        WHERE id = $10 AND user_id = $11
        RETURNING *
        `,
			[
				company || null,
				role || null,
				location || null,
				jobUrl || null,
				salary || null,
				status || null,
				notes || null,
				appliedAt || null,
				followUpAt || null,
				id,
				req.user.id,
			],
		);

		if (result.rows.length === 0) {
			return res.status(404).json({
				message:
					"Application not found or you do not have permission to update it",
			});
		}

		res.json(result.rows[0]);
	} catch (error) {
		console.error("Update application error:", error);

		res.status(500).json({
			message: "Failed to update application",
		});
	}
});

// DELETE /api/applications/:id
// Deletes an existing application for the logged-in user
router.delete("/:id", requireAuth, async (req, res) => {
	try {
		const { id } = req.params;
		const result = await pool.query(
			`
      DELETE FROM applications
        WHERE id = $1 AND user_id = $2
        RETURNING *
        `,
			[id, req.user.id],
		);

		if (result.rows.length === 0) {
			return res.status(404).json({
				message:
					"Application not found or you do not have permission to delete it",
			});
		}

		res.json(result.rows[0]);
	} catch (error) {
		console.error("Delete application error:", error);

		res.status(500).json({
			message: "Failed to delete application",
		});
	}
});

// GET /api/applications/:id
// Gets a specific application for the logged-in user
router.get("/:id", requireAuth, async (req, res) => {
	try {
		const { id } = req.params;
		const result = await pool.query(
			`
      SELECT * FROM applications
        WHERE id = $1 AND user_id = $2
        `,
			[id, req.user.id],
		);

		if (result.rows.length === 0) {
			return res.status(404).json({
				message:
					"Application not found or you do not have permission to view it",
			});
		}

		res.json(result.rows[0]);
	} catch (error) {
		console.error("Get application error:", error);

		res.status(500).json({
			message: "Failed to get application",
		});
	}
});

// GET /api/applications/status/:status
// Gets all applications for the logged-in user with a specific status
router.get("/status/:status", requireAuth, async (req, res) => {
	try {
		const { status } = req.params;
		const result = await pool.query(
			`
            SELECT * FROM applications
            WHERE status = $1 AND user_id = $2
            `,
			[status, req.user.id],
		);

		res.json(result.rows);
	} catch (error) {
		console.error("Get applications by status error:", error);

		res.status(500).json({
			message: "Failed to get applications by status",
		});
	}
});

// PATCH /api/applications/:id/status
// Update the status of a specific application for the logged-in user
router.patch("/:id/status", requireAuth, async (req, res) => {
	try {
		const { id } = req.params;
		const { status } = req.body;

		const allowedStatuses = [
			"saved",
			"applied",
			"interviewing",
			"offer",
			"rejected",
			"withdrawn",
		];

		if (!allowedStatuses.includes(status)) {
			return res.status(400).json({
				message: `Invalid status. Allowed statuses are: ${allowedStatuses.join(", ")}`,
			});
		}

		const result = await pool.query(
			`
            UPDATE applications
                SET status = $1, updated_at = NOW()
            WHERE id = $2 AND user_id = $3
            RETURNING *
            `,
			[status, id, req.user.id],
		);

		if (result.rows.length === 0) {
			return res.status(404).json({
				message:
					"Application not found or you do not have permission to update it",
			});
		}

		res.json(result.rows[0]);
	} catch (error) {
		console.error("Update application status error:", error);

		res.status(500).json({
			message: "Failed to update application status",
		});
	}
});

export default router;
