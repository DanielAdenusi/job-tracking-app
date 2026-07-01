import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { pool } from "../src/db/pool.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsDir = path.join(__dirname, "../src/db/migrations");

async function runMigrations() {
	const client = await pool.connect();

	try {
		await client.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                id SERIAL PRIMARY KEY,
                filename TEXT UNIQUE NOT NULL,
                executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);

		const files = await fs.readdir(migrationsDir);
		const migrationFiles = files
			.filter((file) => file.endsWith(".sql"))
			.sort();

		for (const file of migrationFiles) {
			const alreadyRun = await client.query(
				"SELECT id FROM schema_migrations WHERE filename = $1",
				[file],
			);

			if (alreadyRun.rows.length > 0) {
				console.log(`Skipping ${file}`);
				continue;
			}

			const filePath = path.join(migrationsDir, file);
			const sql = await fs.readFile(filePath, "utf8");

			console.log(`Running ${file}`);

			await client.query("BEGIN");
			await client.query(sql);
			await client.query(
				"INSERT INTO schema_migrations (filename) VALUES ($1)",
				[file],
			);
			await client.query("COMMIT");

			console.log(`Completed ${file}`);
		}

		console.log("All migrations completed.");
	} catch (error) {
		await client.query("ROLLBACK");
		console.error("Migration failed:", error);
		process.exit(1);
	} finally {
		client.release();
		await pool.end();
	}
}

runMigrations();
