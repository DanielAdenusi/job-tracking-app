const MAX_HTML_BYTES = 2_000_000;
const REQUEST_TIMEOUT_MS = 8_000;

const sourceLabels = new Map([
	["linkedin.com", "LinkedIn"],
	["indeed.com", "Indeed"],
	["glassdoor.com", "Glassdoor"],
	["reed.co.uk", "Reed"],
	["totaljobs.com", "Totaljobs"],
	["gradcracker.com", "Gradcracker"],
	["handshake.co.uk", "Handshake"],
	["workdayjobs.com", "Workday"],
	["greenhouse.io", "Greenhouse"],
	["lever.co", "Lever"],
]);

function cleanText(value) {
	if (value === undefined || value === null) return undefined;

	return String(value)
		.replace(/<script[\s\S]*?<\/script>/gi, " ")
		.replace(/<style[\s\S]*?<\/style>/gi, " ")
		.replace(/<[^>]+>/g, " ")
		.replace(/&nbsp;/gi, " ")
		.replace(/&amp;/gi, "&")
		.replace(/&quot;/gi, '"')
		.replace(/&#39;/gi, "'")
		.replace(/&apos;/gi, "'")
		.replace(/&lt;/gi, "<")
		.replace(/&gt;/gi, ">")
		.replace(/\s+/g, " ")
		.trim();
}

function firstText(...values) {
	for (const value of values) {
		const text = cleanText(value);
		if (text) return text;
	}

	return undefined;
}

function getNestedValue(value, path) {
	return path.reduce((current, key) => {
		if (current === undefined || current === null) return undefined;
		return current[key];
	}, value);
}

function normalizeArray(value) {
	if (value === undefined || value === null) return [];
	return Array.isArray(value) ? value : [value];
}

function stripJsonComments(value) {
	return value.replace(/<!--|-->/g, "").trim();
}

function parseJsonLdBlocks(html) {
	const blocks = [];
	const pattern =
		/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
	let match;

	while ((match = pattern.exec(html))) {
		const content = cleanText(stripJsonComments(match[1]));
		if (!content) continue;

		try {
			blocks.push(JSON.parse(content));
		} catch {
			// Some job boards ship malformed JSON-LD. Ignore and use meta tags.
		}
	}

	return blocks;
}

function flattenJsonLd(value) {
	const items = [];

	for (const item of normalizeArray(value)) {
		if (!item || typeof item !== "object") continue;

		items.push(item);
		items.push(...flattenJsonLd(item["@graph"]));
	}

	return items;
}

function isJobPosting(item) {
	const types = normalizeArray(item?.["@type"]).map((type) =>
		String(type).toLowerCase(),
	);

	return types.includes("jobposting");
}

function getMetaContent(html, name) {
	const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const pattern = new RegExp(
		`<meta\\b(?=[^>]*(?:name|property)=["']${escapedName}["'])(?=[^>]*content=["']([^"']*)["'])[^>]*>`,
		"i",
	);
	const match = html.match(pattern);

	return match ? cleanText(match[1]) : undefined;
}

function getTitle(html) {
	return cleanText(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]);
}

function getHostnameLabel(hostname) {
	const host = hostname.replace(/^www\./, "").toLowerCase();

	for (const [domain, label] of sourceLabels) {
		if (host === domain || host.endsWith(`.${domain}`)) return label;
	}

	const root = host.split(".").slice(-2, -1)[0] || host.split(".")[0];

	return root
		.split(/[-_]/)
		.filter(Boolean)
		.map((word) => word[0].toUpperCase() + word.slice(1))
		.join(" ");
}

function splitTitle(title, source) {
	if (!title) return {};

	const parts = title
		.split(/\s+(?:at|@|-|–|—|\|)\s+/i)
		.map(cleanText)
		.filter(Boolean);

	if (parts.length >= 2) {
		const role = parts[0];
		const companyCandidates = parts.slice(1).filter((part) => part !== source);

		return {
			role,
			company: companyCandidates[0],
		};
	}

	return { role: title };
}

function normalizeEmploymentType(value) {
	const text = normalizeArray(value)
		.map((item) => String(item).toLowerCase())
		.join(" ");

	if (!text) return undefined;
	if (text.includes("full")) return "full_time";
	if (text.includes("part")) return "part_time";
	if (text.includes("intern")) return "internship";
	if (text.includes("placement")) return "placement";
	if (text.includes("contract")) return "contract";
	if (text.includes("temporary")) return "temporary";
	if (text.includes("freelance")) return "freelance";

	return undefined;
}

function inferWorkMode(jobPosting, text) {
	const locationType = String(jobPosting?.jobLocationType || "").toLowerCase();
	const content = String(text || "").toLowerCase();

	if (locationType.includes("telecommute") || content.includes("remote")) {
		return "remote";
	}

	if (content.includes("hybrid")) return "hybrid";
	if (content.includes("on-site") || content.includes("onsite")) return "onsite";

	return undefined;
}

function formatLocation(jobPosting) {
	const locations = normalizeArray(jobPosting?.jobLocation);
	const firstLocation = locations[0];
	const address = firstLocation?.address || firstLocation;

	return firstText(
		[
			address?.addressLocality,
			address?.addressRegion,
			address?.addressCountry?.name || address?.addressCountry,
		]
			.filter(Boolean)
			.join(", "),
		firstLocation?.name,
	);
}

function formatSalary(baseSalary) {
	if (!baseSalary) return undefined;

	const currency = baseSalary.currency;
	const value = baseSalary.value || baseSalary;
	const unit = value.unitText ? ` ${String(value.unitText).toLowerCase()}` : "";
	const min = value.minValue;
	const max = value.maxValue;
	const direct = value.value || baseSalary.value;

	if (min && max) return cleanText(`${currency || ""} ${min} - ${max}${unit}`);
	if (direct && typeof direct !== "object") {
		return cleanText(`${currency || ""} ${direct}${unit}`);
	}

	return undefined;
}

function buildNotes(description) {
	const text = cleanText(description);
	if (!text) return undefined;

	return text.length > 900 ? `${text.slice(0, 897).trim()}...` : text;
}

function normalizeExtractedApplication(url, html) {
	const parsedUrl = new URL(url);
	const source = getHostnameLabel(parsedUrl.hostname);
	const jsonLdItems = parseJsonLdBlocks(html).flatMap(flattenJsonLd);
	const jobPosting = jsonLdItems.find(isJobPosting);
	const metaTitle = firstText(
		getMetaContent(html, "og:title"),
		getMetaContent(html, "twitter:title"),
		getTitle(html),
	);
	const titleParts = splitTitle(metaTitle, source);
	const description = firstText(
		jobPosting?.description,
		getMetaContent(html, "description"),
		getMetaContent(html, "og:description"),
	);
	const company = firstText(
		getNestedValue(jobPosting, ["hiringOrganization", "name"]),
		getMetaContent(html, "og:site_name"),
		titleParts.company,
	);
	const role = firstText(jobPosting?.title, titleParts.role);

	return {
		company,
		role,
		location: formatLocation(jobPosting),
		jobUrl: url,
		salary: formatSalary(jobPosting?.baseSalary),
		status: "saved",
		priority: "medium",
		employmentType: normalizeEmploymentType(jobPosting?.employmentType),
		workMode: inferWorkMode(jobPosting, `${metaTitle} ${description}`),
		source,
		notes: buildNotes(description),
		deadlineAt: firstText(jobPosting?.validThrough)?.slice(0, 10),
	};
}

function removeEmptyFields(application) {
	return Object.fromEntries(
		Object.entries(application).filter(
			([, value]) => value !== undefined && value !== null && value !== "",
		),
	);
}

export async function extractApplicationFromUrl(url) {
	let parsedUrl;

	try {
		parsedUrl = new URL(url);
	} catch {
		const error = new Error("Enter a valid URL.");
		error.statusCode = 400;
		throw error;
	}

	if (!["http:", "https:"].includes(parsedUrl.protocol)) {
		const error = new Error("Job URL must start with http:// or https://.");
		error.statusCode = 400;
		throw error;
	}

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

	try {
		const response = await fetch(parsedUrl.toString(), {
			redirect: "follow",
			signal: controller.signal,
			headers: {
				Accept: "text/html,application/xhtml+xml",
				"User-Agent":
					"Mozilla/5.0 (compatible; JobMarkrBot/1.0; +https://jobmarkr.app)",
			},
		});

		if (!response.ok) {
			const error = new Error(
				`Could not read that job page. The site returned ${response.status}.`,
			);
			error.statusCode = 422;
			throw error;
		}

		const contentLength = Number(response.headers.get("content-length"));
		if (contentLength > MAX_HTML_BYTES) {
			const error = new Error("That job page is too large to extract safely.");
			error.statusCode = 422;
			throw error;
		}

		const html = await response.text();
		if (html.length > MAX_HTML_BYTES) {
			const error = new Error("That job page is too large to extract safely.");
			error.statusCode = 422;
			throw error;
		}

		const application = removeEmptyFields(
			normalizeExtractedApplication(response.url || parsedUrl.toString(), html),
		);

		if (!application.company || !application.role) {
			return {
				application,
				message:
					"We found the URL, but could not confidently detect both company and role. Review and fill the missing fields before saving.",
			};
		}

		return {
			application,
			message: "Extracted a draft application. Review it before saving.",
		};
	} catch (error) {
		if (error.name === "AbortError") {
			const timeoutError = new Error("That job page took too long to respond.");
			timeoutError.statusCode = 408;
			throw timeoutError;
		}

		throw error;
	} finally {
		clearTimeout(timeout);
	}
}
