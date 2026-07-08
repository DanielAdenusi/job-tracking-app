import {
	APPLICATION_STATUSES,
	APPLICATION_PRIORITIES,
	EMPLOYMENT_TYPES,
	WORK_MODES,
} from "../constants/applicationOptions.js";

export function validateApplicationInput(data, { partial = false } = {}) {
	const errors = {};

	const requiredFields = ["company", "role"];

	if (!partial) {
		for (const field of requiredFields) {
			if (!data[field] || String(data[field]).trim() === "") {
				errors[field] = `${field} is required`;
			}
		}
	}

	if (data.company !== undefined && String(data.company).trim() === "") {
		errors.company = "Company cannot be empty";
	}

	if (data.role !== undefined && String(data.role).trim() === "") {
		errors.role = "Role cannot be empty";
	}

	if (
		data.status !== undefined &&
		!APPLICATION_STATUSES.includes(data.status)
	) {
		errors.status = "Invalid application status";
	}

	if (
		data.priority !== undefined &&
		!APPLICATION_PRIORITIES.includes(data.priority)
	) {
		errors.priority = "Invalid priority";
	}

	if (
		data.employmentType !== undefined &&
		data.employmentType !== "" &&
		data.employmentType !== null &&
		!EMPLOYMENT_TYPES.includes(data.employmentType)
	) {
		errors.employmentType = "Invalid employment type";
	}

	if (
		data.workMode !== undefined &&
		data.workMode !== "" &&
		data.workMode !== null &&
		!WORK_MODES.includes(data.workMode)
	) {
		errors.workMode = "Invalid work mode";
	}

	if (
		data.interviewMode !== undefined &&
		data.interviewMode !== "" &&
		data.interviewMode !== null &&
		!WORK_MODES.includes(data.interviewMode)
	) {
		errors.interviewMode = "Invalid interview mode";
	}

	if (data.jobUrl) {
		try {
			const url = new URL(data.jobUrl);

			if (!["http:", "https:"].includes(url.protocol)) {
				errors.jobUrl = "Job URL must start with http:// or https://";
			}
		} catch {
			errors.jobUrl = "Job URL must be valid";
		}
	}

	if (data.contactEmail) {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

		if (!emailRegex.test(data.contactEmail)) {
			errors.contactEmail = "Contact email must be valid";
		}
	}

	if (
		data.jobDescription !== undefined &&
		(data.jobDescription === null ||
			typeof data.jobDescription !== "object" ||
			Array.isArray(data.jobDescription))
	) {
		errors.jobDescription = "Job description must be a section object";
	}

	if (data.hoursPerWeek) {
		const numericValue = Number(data.hoursPerWeek);

		if (
			Number.isNaN(numericValue) ||
			numericValue <= 0 ||
			numericValue > 168
		) {
			errors.hoursPerWeek = "Hours per week must be between 1 and 168";
		}
	}

	for (const field of ["reminderLeadMinutes", "secondReminderLeadMinutes"]) {
		if (data[field] === undefined || data[field] === null || data[field] === "") {
			continue;
		}

		const numericValue = Number(data[field]);

		if (
			!Number.isInteger(numericValue) ||
			numericValue < 0 ||
			numericValue > 60 * 24 * 30
		) {
			errors[field] = "Reminder timing must be between now and 30 days before";
		}
	}

	if (
		data.notificationsEnabled !== undefined &&
		typeof data.notificationsEnabled !== "boolean"
	) {
		errors.notificationsEnabled = "Notifications enabled must be true or false";
	}

	return {
		isValid: Object.keys(errors).length === 0,
		errors,
	};
}
