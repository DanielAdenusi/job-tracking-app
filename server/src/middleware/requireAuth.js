import { adminAuth } from "../config/firebaseAdmin.js";
import { pool } from "../db/pool.js";

export async function requireAuth(req, res, next) {
	try {
		const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return res.status(401).json({
				message: "Missing or invalid Authorization header",
			});
		}

		const token = authHeader.split("Bearer ")[1];

		const decodedToken = await adminAuth.verifyIdToken(token);

		const firebaseUid = decodedToken.uid;
		const email = decodedToken.email || "";
		const displayName = decodedToken.name || "";

		const result = await pool.query(
			`
      INSERT INTO users (firebase_uid, email, display_name)
      VALUES ($1, $2, $3)
      ON CONFLICT (firebase_uid)
      DO UPDATE SET
        email = EXCLUDED.email,
        display_name = EXCLUDED.display_name
      RETURNING *
      `,
			[firebaseUid, email, displayName],
		);

		req.user = result.rows[0];

		next();
	} catch (error) {
		console.error("Auth error:", {
			code: error?.code,
			message: error?.message,
		});

		return res.status(401).json({
			message: "Invalid or expired token",
		});
	}
}
