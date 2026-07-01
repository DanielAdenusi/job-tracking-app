export function errorHandler(error, req, res, next) {
	console.error(error);

	if (res.headersSent) {
		return next(error);
	}

	if (error.code === "23505") {
		return res.status(409).json({
			message: "Duplicate record",
		});
	}

	if (error.code === "23514") {
		return res.status(400).json({
			message: "Database constraint failed",
		});
	}

	if (error.code === "22P02") {
		return res.status(400).json({
			message: "Invalid ID format",
		});
	}

	res.status(500).json({
		message: "Something went wrong",
	});
}
