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
	["bendingspoons.com", "Bending Spoons"],
	["joinrs.com", "Joinrs"],
	["haystack.cv", "Haystack"],
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

	const scriptPattern = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
	while ((match = scriptPattern.exec(html))) {
		const scriptContent = match[1];
		const stringPattern = /"((?:\\.|[^"\\])*)"/g;
		let stringMatch;

		while ((stringMatch = stringPattern.exec(scriptContent))) {
			const rawString = stringMatch[1];
			if (
				!rawString.includes("@type") &&
				!rawString.includes("\\\"@type\\\"")
			) {
				continue;
			}

			try {
				const decoded = JSON.parse(`"${rawString}"`);
				if (!decoded.includes("JobPosting")) continue;

				blocks.push(JSON.parse(decoded));
			} catch {
				// Some frameworks stream JSON-LD as escaped strings. Ignore
				// strings that are not complete JSON objects.
			}
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
		const companyCandidates = parts
			.slice(1)
			.filter((part) => part !== source);

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
	const locationType = String(
		jobPosting?.jobLocationType || "",
	).toLowerCase();
	const content = String(text || "").toLowerCase();

	if (locationType.includes("telecommute") || content.includes("remote")) {
		return "remote";
	}

	if (content.includes("hybrid")) return "hybrid";
	if (content.includes("on-site") || content.includes("onsite"))
		return "onsite";

	return undefined;
}

function formatLocation(jobPosting) {
	const locations = normalizeArray(jobPosting?.jobLocation);
	const locationTexts = locations
		.map((location) => {
			const address = location?.address || location;

			return firstText(
				[
					address?.addressLocality,
					address?.addressRegion,
					address?.addressCountry?.name || address?.addressCountry,
				]
					.filter(Boolean)
					.join(", "),
				location?.name,
			);
		})
		.filter(Boolean);

	return locationTexts.join(", ") || undefined;
}

function formatSalary(baseSalary) {
	if (!baseSalary) return undefined;

	const currency = baseSalary.currency;
	const value = baseSalary.value || baseSalary;
	const unit = value.unitText
		? ` ${String(value.unitText).toLowerCase()}`
		: "";
	const min = value.minValue;
	const max = value.maxValue;
	const direct = value.value || baseSalary.value;

	if (min && max)
		return cleanText(`${currency || ""} ${min} - ${max}${unit}`);
	if (direct && typeof direct !== "object") {
		return cleanText(`${currency || ""} ${direct}${unit}`);
	}

	return undefined;
}

function parseNextData(html) {
	const match = html.match(
		/<script\b[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i,
	);

	if (!match?.[1]) return undefined;

	try {
		return JSON.parse(match[1]);
	} catch {
		return undefined;
	}
}

function normalizeSalaryText(value) {
	const text = cleanText(value);
	if (!text) return undefined;

	return text
		.replace(/\bper\s+(annum|year)\b/i, "per year")
		.replace(/\bper\s+yearly\b/i, "per year")
		.replace(/\/\s?(yr|year)\b/i, " per year")
		.replace(/\/\s?(hr|hour)\b/i, " per hour")
		.replace(/\bpa\b/i, "per year")
		.replace(/\s*-\s*/g, " - ");
}

function extractSalaryFromText(value) {
	const text = cleanText(value);
	if (!text) return undefined;

	const linkedInSalaryPattern =
		/(?:salary|pay|compensation)?[:\s-]*(?:(?:\u00a3|\$|\u20ac|GBP|USD|EUR)\s?\d[\d,]*(?:\.\d{1,2})?\s?[kK]?|\d[\d,]*(?:\.\d{1,2})?\s?[kK]?\s?(?:\u00a3|\$|\u20ac|GBP|USD|EUR))(?:\s?(?:-|to)\s?(?:(?:\u00a3|\$|\u20ac|GBP|USD|EUR)?\s?\d[\d,]*(?:\.\d{1,2})?\s?[kK]?|\d[\d,]*(?:\.\d{1,2})?\s?[kK]?\s?(?:\u00a3|\$|\u20ac|GBP|USD|EUR)))?(?:\s?(?:per|\/)\s?(?:hour|hr|day|week|month|year|yr|annum))?/i;
	const linkedInMatch = text.match(linkedInSalaryPattern);

	if (linkedInMatch) return normalizeSalaryText(linkedInMatch[0]);

	const salaryPattern =
		/(?:salary|pay|compensation)?[:\s-]*(?:£|\$|€|GBP|USD|EUR)\s?\d[\d,]*(?:\.\d{1,2})?(?:\s?(?:-|to)\s?(?:£|\$|€|GBP|USD|EUR)?\s?\d[\d,]*(?:\.\d{1,2})?)?(?:\s?(?:per|\/)\s?(?:hour|hr|day|week|month|year|annum))?/i;
	const match = text.match(salaryPattern);

	return normalizeSalaryText(match?.[0]);
}

function getFirstElementTextByClass(html, className) {
	const escapedClass = className.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const pattern = new RegExp(
		`<([a-z0-9-]+)\\b(?=[^>]*class=["'][^"']*\\b${escapedClass}\\b[^"']*["'])[^>]*>([\\s\\S]*?)<\\/\\1>`,
		"i",
	);

	return cleanText(html.match(pattern)?.[2]);
}

function getFirstElementHtmlByClass(html, className) {
	const escapedClass = className.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const pattern = new RegExp(
		`<([a-z0-9-]+)\\b(?=[^>]*class=["'][^"']*\\b${escapedClass}\\b[^"']*["'])[^>]*>([\\s\\S]*?)<\\/\\1>`,
		"i",
	);

	return html.match(pattern)?.[2];
}

function cleanRichText(value) {
	if (value === undefined || value === null) return undefined;

	const text = String(value)
		.replace(/<script[\s\S]*?<\/script>/gi, " ")
		.replace(/<style[\s\S]*?<\/style>/gi, " ")
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<\/(?:p|div|li|ul|ol|h[1-6]|section|article)>/gi, "\n")
		.replace(/<li\b[^>]*>/gi, "\n")
		.replace(/<[^>]+>/g, " ")
		.replace(/&nbsp;/gi, " ")
		.replace(/&amp;/gi, "&")
		.replace(/&quot;/gi, '"')
		.replace(/&#39;/gi, "'")
		.replace(/&apos;/gi, "'")
		.replace(/&lt;/gi, "<")
		.replace(/&gt;/gi, ">")
		.split(/\r?\n/)
		.map((line) => line.replace(/\s+/g, " ").trim())
		.filter(Boolean)
		.join("\n");

	return text || undefined;
}

function getElementTextsByClass(html, className) {
	const escapedClass = className.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const pattern = new RegExp(
		`<[^>]+class=["'][^"']*\\b${escapedClass}\\b[^"']*["'][^>]*>([\\s\\S]*?)(?=<[^>]+class=["'][^"']*\\b${escapedClass}\\b|<\\/ul>|<\\/ol>|<\\/section>|$)`,
		"gi",
	);
	const texts = [];
	let match;

	while ((match = pattern.exec(html))) {
		const text = cleanText(match[1]);
		if (text) texts.push(text);
	}

	return texts;
}

function extractCriteriaValue(html, label) {
	const itemPattern = new RegExp(
		`<[^>]+class=["'][^"']*\\bdescription__job-criteria-item\\b[^"']*["'][^>]*>([\\s\\S]*?)(?=<[^>]+class=["'][^"']*\\bdescription__job-criteria-item\\b|<\\/ul>|<\\/section>|$)`,
		"gi",
	);
	let match;

	while ((match = itemPattern.exec(html))) {
		const itemHtml = match[1];
		const itemLabel = getFirstElementTextByClass(
			itemHtml,
			"description__job-criteria-subheader",
		);

		if (itemLabel?.toLowerCase() !== label.toLowerCase()) continue;

		return getFirstElementTextByClass(
			itemHtml,
			"description__job-criteria-text",
		);
	}

	return undefined;
}

function extractLinkedInInsightTexts(html) {
	return [
		...getElementTextsByClass(
			html,
			"job-details-jobs-unified-top-card__job-insight",
		),
		...getElementTextsByClass(
			html,
			"job-details-jobs-unified-top-card__job-insight-view-model-secondary",
		),
		...getElementTextsByClass(html, "top-card-layout__job-info"),
	].filter(Boolean);
}

function extractLinkedInFallback(html) {
	const descriptionHtml = getFirstElementHtmlByClass(
		html,
		"show-more-less-html__markup",
	);
	const description = cleanRichText(descriptionHtml);
	const insightText = extractLinkedInInsightTexts(html).join(" ");
	const pageText = cleanText(html);
	const salary = firstText(
		extractCriteriaValue(html, "Salary"),
		extractCriteriaValue(html, "Base pay range"),
		extractSalaryFromText(insightText),
		extractSalaryFromText(description),
		extractSalaryFromText(pageText),
	);
	const employmentType = firstText(
		extractCriteriaValue(html, "Employment type"),
		normalizeEmploymentType(insightText),
		normalizeEmploymentType(pageText),
	);

	return {
		role: firstText(
			getFirstElementTextByClass(html, "top-card-layout__title"),
			html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1],
		),
		company: firstText(
			getFirstElementTextByClass(html, "topcard__org-name-link"),
			getFirstElementTextByClass(html, "topcard__flavor"),
		),
		location: getFirstElementTextByClass(
			html,
			"topcard__flavor--bullet",
		),
		description,
		employmentType: normalizeEmploymentType(employmentType),
		salary: normalizeSalaryText(salary),
	};
}

const descriptionHeadingRules = [
	{
		key: "role",
		pattern:
			/\b(?:about the role|the role|role overview|about this role|about the job)\b/i,
	},
	{
		key: "keyResponsibilities",
		pattern:
			/\b(?:key responsibilities|responsibilities|what you(?:'|’)?ll do|what you will do|day to day|duties)\b/i,
	},
	{
		key: "lookingFor",
		pattern:
			/\b(?:what you(?:'|’)?ll need|what you will need|what we(?:'|’)?re looking for|requirements|about you|skills and experience|qualifications|who you are)\b/i,
	},
	{
		key: "desirable",
		pattern:
			/\b(?:desirable|nice to have|bonus points|preferred qualifications|preferred skills)\b/i,
	},
	{
		key: "whyJoinUs",
		pattern:
			/\b(?:why join us|what(?:'|’)?s on offer|what is on offer|benefits|perks|our offer|what we offer)\b/i,
	},
];

const extraDescriptionHeadingRules = [
	{
		key: "role",
		pattern:
			/\b(?:job overview|position overview|job description|the opportunity|overview|summary|about us|who we are|the team|about the team)\b/i,
	},
	{
		key: "keyResponsibilities",
		pattern:
			/\b(?:your responsibilities|main responsibilities|core responsibilities|role responsibilities|what you(?:'|\u2019)?d do|what you would do|what you(?:'|\u2019)?ll be doing|what you will be doing|in this role you(?:'|\u2019)?ll|you will be responsible for|you(?:'|\u2019)?ll be responsible for|tasks|your day to day)\b/i,
	},
	{
		key: "lookingFor",
		pattern:
			/\b(?:what we(?:'|\u2019)?re looking for|what we are looking for|what we(?:'|\u2019)?d like from you|what we would like from you|essential requirements|required skills|skills required|experience required|your experience|your skills|candidate profile|your profile|ideal candidate|the ideal candidate|you should have|we need you to have|you(?:'|\u2019)?ll bring|you will bring|must have|must-have|minimum qualifications)\b/i,
	},
	{
		key: "desirable",
		pattern:
			/\b(?:nice-to-have|preferred experience|advantageous|it would be great if|it would be a plus if|bonus skills|additional skills|not essential but|preferred requirements|plus points)\b/i,
	},
	{
		key: "whyJoinUs",
		pattern:
			/\b(?:why work with us|why work for us|benefits and perks|rewards and benefits|what you(?:'|\u2019)?ll get|what you will get|what we provide|package|compensation and benefits|life at|working at|culture|our culture|employee benefits)\b/i,
	},
];

const flatDescriptionHeadingRules = [
	{
		key: "role",
		pattern:
			/(^|[.!?]\s+|\s+)(About Revolut|About The Graduate Programme|About The Role|About This Role|About The Job|The Role|Role Overview|Job Overview|The Opportunity)\b/g,
	},
	{
		key: "keyResponsibilities",
		pattern:
			/(^|[.!?]\s+|\s+)(What You'll Be Doing|What You Will Be Doing|What You'll Do|What You Will Do|Key Responsibilities|Your Responsibilities|Responsibilities)\b/g,
	},
	{
		key: "lookingFor",
		pattern:
			/(^|[.!?]\s+|\s+)(What You'll Need|What You Will Need|What We're Looking For|What We Are Looking For|Requirements|About You|Who You Are|Your Profile|Ideal Candidate|The Ideal Candidate)\b/g,
	},
	{
		key: "desirable",
		pattern:
			/(^|[.!?]\s+|\s+)(Desirable|Nice To Have|Nice-to-have|Preferred Skills|Preferred Experience|Bonus Points)\b/g,
	},
	{
		key: "whyJoinUs",
		pattern:
			/(^|[.!?]\s+|\s+)(What's On Offer|What Is On Offer|Why Join Us|Why Work With Us|Benefits|Benefits And Perks|What You'll Get|What You Will Get)\b/g,
	},
];

function splitFlatDescriptionByHeadings(text) {
	const matches = [];

	for (const rule of flatDescriptionHeadingRules) {
		let match;

		while ((match = rule.pattern.exec(text))) {
			const prefix = match[1] || "";
			const heading = match[2];
			const index = match.index + prefix.length;

			matches.push({
				index,
				end: index + heading.length,
				key: rule.key,
			});
		}
	}

	matches.sort((a, b) => a.index - b.index);

	return matches.filter(
		(match, index) =>
			index === 0 || match.index !== matches[index - 1].index,
	);
}

function splitDescriptionByHeadings(text) {
	const matches = [];
	let offset = 0;

	for (const line of text.split(/\n+/)) {
		const trimmedLine = line.trim();
		const startsAt = text.indexOf(line, offset);
		offset = startsAt + line.length;

		if (!trimmedLine || trimmedLine.length > 90) continue;

		for (const rule of [
			...descriptionHeadingRules,
			...extraDescriptionHeadingRules,
		]) {
			if (!rule.pattern.test(trimmedLine)) continue;

			matches.push({
				index: startsAt,
				end: startsAt + line.length,
				key: rule.key,
			});
			break;
		}
	}

	matches.sort((a, b) => a.index - b.index);

	const uniqueMatches = matches.filter(
		(match, index) =>
			index === 0 || match.index !== matches[index - 1].index,
	);

	return uniqueMatches.length > 0
		? uniqueMatches
		: splitFlatDescriptionByHeadings(text);
}

function pushDescriptionSection(sections, key, value) {
	const text = cleanText(value);
	if (!text) return;

	sections[key].push(text);
}

function removeJobDescriptionBoilerplate(text) {
	const boilerplatePatterns = [
		/\bImportant notice for candidates:?\b/i,
		/\bBy submitting this application,?\b/i,
		/\bEqual opportunity employer\b/i,
		/\bWe are an equal opportunity employer\b/i,
		/\bCandidate Privacy Notice\b/i,
	];
	const cutIndex = boilerplatePatterns.reduce((earliest, pattern) => {
		const match = text.match(pattern);
		if (!match || match.index === undefined) return earliest;

		return earliest === -1 ? match.index : Math.min(earliest, match.index);
	}, -1);

	return cutIndex === -1 ? text : text.slice(0, cutIndex);
}

function buildJobDescription(description) {
	const text = cleanText(removeJobDescriptionBoilerplate(description));
	if (!text) return undefined;

	const sections = {
		role: [],
		keyResponsibilities: [],
		lookingFor: [],
		desirable: [],
		whyJoinUs: [],
	};
	const headings = splitDescriptionByHeadings(text);

	if (headings.length === 0) {
		sections.role.push(text);
		return sections;
	}

	const introduction = text.slice(0, headings[0].index);
	pushDescriptionSection(sections, "role", introduction);

	for (let index = 0; index < headings.length; index += 1) {
		const heading = headings[index];
		const nextHeading = headings[index + 1];
		const content = text.slice(
			heading.end,
			nextHeading ? nextHeading.index : text.length,
		);

		pushDescriptionSection(sections, heading.key, content);
	}

	if (!Object.values(sections).some((items) => items.length > 0)) {
		sections.role.push(text);
	}

	return sections;
}

function joinTitledItems(items) {
	return normalizeArray(items)
		.map((item) => {
			if (!item || typeof item !== "object") return cleanRichText(item);

			return firstText(
				[item.title, item.description].filter(Boolean).join(". "),
				item.description,
				item.title,
			);
		})
		.filter(Boolean);
}

function extractBendingSpoonsFallback(html) {
	const job = getNestedValue(parseNextData(html), [
		"props",
		"pageProps",
		"job",
	]);

	if (!job || typeof job !== "object") return {};

	const location = normalizeArray(job.officeLocations)
		.map((office) => firstText(office?.title))
		.filter(Boolean)
		.join(", ");
	const responsibilities = normalizeArray(job.responsibilities)
		.map(cleanRichText)
		.filter(Boolean);
	const requirements = joinTitledItems(job.requirements);
	const sellingPoints = joinTitledItems(job.sellingPoints);
	const highLevelDescription = cleanRichText(job.highLevelDescription);
	const combinedDescription = [
		highLevelDescription,
		...responsibilities,
		...requirements,
		...sellingPoints,
	].join("\n");

	return {
		role: firstText(job.jobTitle),
		company: "Bending Spoons",
		location: firstText(location),
		employmentType: normalizeEmploymentType(job.workSchedule),
		workMode:
			job.availableAsRemoteInDefaultCountries ||
			normalizeArray(job.additionalRemoteWorkCountries).length > 0
				? "remote"
				: undefined,
		salary: extractSalaryFromText(combinedDescription),
		description: highLevelDescription,
		jobDescription: {
			role: highLevelDescription ? [highLevelDescription] : [],
			keyResponsibilities: responsibilities,
			lookingFor: requirements,
			desirable: [],
			whyJoinUs: sellingPoints,
		},
	};
}

function getLastPathSegment(url) {
	return new URL(url).pathname.split("/").filter(Boolean).at(-1);
}

function formatHaystackSalary(job) {
	const currency = job?.salary_currency || "GBP";
	const period =
		job?.salary_period === "yearly"
			? " per year"
			: job?.salary_period
				? ` per ${job.salary_period}`
				: "";

	if (job?.salary_min && job?.salary_max) {
		if (job.salary_min === job.salary_max) {
			return `${currency} ${job.salary_min}${period}`;
		}

		return `${currency} ${job.salary_min} - ${job.salary_max}${period}`;
	}

	return normalizeSalaryText(job?.salary);
}

async function extractHaystackFallback(url) {
	const jobId = getLastPathSegment(url);
	if (!jobId) return {};

	const supabaseUrl = "https://npcmxclsxverzegunyvg.supabase.co";
	const anonKey =
		"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wY214Y2xzeHZlcnplZ3VueXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2MjczMjgsImV4cCI6MjA4MzIwMzMyOH0.wORLeoovyiQOE83Oq-1xij8yfh3v3TzfYtq7GgUyKX4";
	const requestUrl = new URL(`${supabaseUrl}/rest/v1/jobs`);
	requestUrl.searchParams.set("id", `eq.${jobId}`);
	requestUrl.searchParams.set(
		"select",
		"*,companies:company_id(name,slug,domain,logo_url,description)",
	);

	const response = await fetch(requestUrl, {
		headers: {
			apikey: anonKey,
			Authorization: `Bearer ${anonKey}`,
		},
	});

	if (!response.ok) return {};

	const [job] = await response.json();
	if (!job) return {};

	const company = firstText(job.companies?.name, job.company);
	const description = cleanRichText(job.description);

	return {
		company,
		role: firstText(job.title),
		location: firstText(
			[job.city, job.state, job.country].filter(Boolean).join(", "),
			job.work_mode,
		),
		salary: formatHaystackSalary(job),
		employmentType: normalizeEmploymentType(
			job.standardized_job_type || job.job_type,
		),
		workMode: inferWorkMode(undefined, `${job.work_mode} ${description}`),
		description,
		postedAt: firstText(job.posted_at, job.created_at)?.slice(0, 10),
		jobReferenceId: firstText(job.source_job_id, job.appcast_job_id, job.id),
		source: "Haystack",
	};
}

async function extractExternalFallback(url, source) {
	if (source === "Haystack") return extractHaystackFallback(url);

	return {};
}

function normalizeExtractedApplication(url, html, externalFallback = {}) {
	const parsedUrl = new URL(url);
	const source = getHostnameLabel(parsedUrl.hostname);
	const linkedinFallback =
		source === "LinkedIn" ? extractLinkedInFallback(html) : {};
	const bendingSpoonsFallback =
		source === "Bending Spoons" ? extractBendingSpoonsFallback(html) : {};

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
		linkedinFallback.description,
		bendingSpoonsFallback.description,
		externalFallback.description,
		getMetaContent(html, "description"),
		getMetaContent(html, "og:description"),
	);

	const company = firstText(
		getNestedValue(jobPosting, ["hiringOrganization", "name"]),
		linkedinFallback.company,
		bendingSpoonsFallback.company,
		externalFallback.company,
		titleParts.company,
	);

	const role = firstText(
		jobPosting?.title,
		linkedinFallback.role,
		bendingSpoonsFallback.role,
		externalFallback.role,
		titleParts.role,
	);

	return {
		company,
		role,
		location: firstText(
			formatLocation(jobPosting),
			linkedinFallback.location,
			bendingSpoonsFallback.location,
			externalFallback.location,
		),
		jobUrl: url,
		jobReferenceId:
			source === "LinkedIn"
				? extractLinkedInJobId(url)
				: externalFallback.jobReferenceId,
		salary: firstText(
			formatSalary(jobPosting?.baseSalary),
			linkedinFallback.salary,
			bendingSpoonsFallback.salary,
			externalFallback.salary,
			extractSalaryFromText(description),
		),
		status: "saved",
		priority: "medium",
		employmentType: firstText(
			normalizeEmploymentType(jobPosting?.employmentType),
			linkedinFallback.employmentType,
			bendingSpoonsFallback.employmentType,
			externalFallback.employmentType,
		),
		workMode: firstText(
			bendingSpoonsFallback.workMode,
			externalFallback.workMode,
			inferWorkMode(jobPosting, `${metaTitle} ${description}`),
		),
		source: externalFallback.source || source,
		jobDescription:
			bendingSpoonsFallback.jobDescription ||
			buildJobDescription(description),
		postedAt:
			firstText(jobPosting?.datePosted)?.slice(0, 10) ||
			externalFallback.postedAt,
		deadlineAt: firstText(jobPosting?.validThrough)?.slice(0, 10),
	};
}

function removeEmptyFields(application) {
	return Object.fromEntries(
		Object.entries(application).filter(
			([, value]) =>
				value !== undefined && value !== null && value !== "",
		),
	);
}

function extractLinkedInJobId(url) {
	const match = url.match(/linkedin\.com\/jobs\/view\/(?:[^/?#]*-)?(\d+)/i);

	return match?.[1];
}

export async function extractApplicationFromUrl(url, { status = "saved" } = {}) {
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
			const error = new Error(
				"That job page is too large to extract safely.",
			);
			error.statusCode = 422;
			throw error;
		}

		const html = await response.text();
		if (html.length > MAX_HTML_BYTES) {
			const error = new Error(
				"That job page is too large to extract safely.",
			);
			error.statusCode = 422;
			throw error;
		}

		const finalUrl = response.url || parsedUrl.toString();
		const source = getHostnameLabel(new URL(finalUrl).hostname);
		const externalFallback = await extractExternalFallback(finalUrl, source);
		const application = removeEmptyFields(
			normalizeExtractedApplication(finalUrl, html, externalFallback),
		);
		application.status = status;

		if (status === "applied") {
			application.appliedAt = new Date().toISOString().slice(0, 10);
		}

		if (!application.company || !application.role) {
			return {
				application,
				message:
					"We found the URL, but could not confidently detect both company and role. Review and fill the missing fields before saving.",
			};
		}

		return {
			application,
			message:
				status === "applied"
					? "Job details extracted. Review the application before saving."
					: "Job details extracted. Review the saved job before continuing.",
		};
	} catch (error) {
		if (error.name === "AbortError") {
			const timeoutError = new Error(
				"That job page took too long to respond.",
			);
			timeoutError.statusCode = 408;
			throw timeoutError;
		}

		throw error;
	} finally {
		clearTimeout(timeout);
	}
}
