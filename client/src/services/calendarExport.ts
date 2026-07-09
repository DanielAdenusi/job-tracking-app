import type { Application } from "../types/application";
import {
	getApplicationEvents,
	type ApplicationEvent,
} from "./applicationEvents";

function pad(value: number) {
	return String(value).padStart(2, "0");
}

function escapeIcsText(value: string) {
	return value
		.replaceAll("\\", "\\\\")
		.replaceAll(";", "\\;")
		.replaceAll(",", "\\,")
		.replace(/\r?\n/g, "\\n");
}

function formatDate(value: Date) {
	return [
		value.getUTCFullYear(),
		pad(value.getUTCMonth() + 1),
		pad(value.getUTCDate()),
	].join("");
}

function formatDateTime(value: Date) {
	return `${formatDate(value)}T${pad(value.getUTCHours())}${pad(
		value.getUTCMinutes(),
	)}${pad(value.getUTCSeconds())}Z`;
}

function eventEnd(event: ApplicationEvent) {
	const end = new Date(event.start);

	end.setMinutes(end.getMinutes() + (event.kind === "interview" ? 60 : 30));

	return end;
}

function buildEventLines(event: ApplicationEvent) {
	const timestamp = formatDateTime(new Date());
	const start = event.isAllDay
		? `DTSTART;VALUE=DATE:${formatDate(event.start)}`
		: `DTSTART:${formatDateTime(event.start)}`;
	const end = event.isAllDay
		? ""
		: `DTEND:${formatDateTime(eventEnd(event))}`;

	return [
		"BEGIN:VEVENT",
		`UID:${event.id}@jobmarkr`,
		`DTSTAMP:${timestamp}`,
		start,
		end,
		`SUMMARY:${escapeIcsText(event.title)}`,
		event.location ? `LOCATION:${escapeIcsText(event.location)}` : "",
		`DESCRIPTION:${escapeIcsText(event.description)}`,
		"END:VEVENT",
	].filter(Boolean);
}

function downloadFile(fileName: string, content: string, type: string) {
	const blob = new Blob([content], { type });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = fileName;
	link.click();
	URL.revokeObjectURL(url);
}

export function buildApplicationCalendar(application: Application) {
	const events = getApplicationEvents(application);

	return [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"PRODID:-//Jobmarkr//Application Events//EN",
		"CALSCALE:GREGORIAN",
		"METHOD:PUBLISH",
		...events.flatMap(buildEventLines),
		"END:VCALENDAR",
	].join("\r\n");
}

export function downloadApplicationCalendar(application: Application) {
	const slug = [application.company, application.role]
		.join("-")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");

	downloadFile(
		`${slug || "application"}-events.ics`,
		buildApplicationCalendar(application),
		"text/calendar;charset=utf-8",
	);
}
