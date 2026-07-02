import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, Navigate, useParams } from "react-router";
import {
	Accessibility,
	ArchiveRestore,
	Bell,
	BriefcaseBusiness,
	CheckCircle2,
	Database,
	Download,
	FileJson,
	KeyRound,
	LockKeyhole,
	Mail,
	Megaphone,
	Palette,
	RefreshCcw,
	ShieldOff,
	SlidersHorizontal,
	Table2,
	Trash2,
	Upload,
	type LucideIcon,
} from "lucide-react";

import { useAuth } from "../auth/useAuth";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { useToast } from "../components/ToastProvider";
import { useAccountSettings } from "../context/AccountSettingsContext";
import { Button } from "../components/ui/Button";
import {
	Checkbox as UiCheckbox,
	SegmentedControl as UiSegmentedControl,
	Select,
	Toggle as UiToggle,
} from "../components/ui/FormControls";
import {
	APPLICATION_STATUSES,
	EMPLOYMENT_TYPES,
	WORK_MODES,
	type ApplicationStatus,
	type EmploymentType,
	type WorkMode,
} from "../constants/applicationOptions";
import { applicationStatusLabels } from "../constants/applicationStatusStyles";
import {
	createApplication,
	deleteAllApplications,
	getApplications,
} from "../services/applicationsApi";
import {
	clearLocalSettings,
	normalizeSettings,
	tableRowOptions,
	type AccentColour,
	type Currency,
	type ReminderTiming,
	type SettingsTab,
	type UserSettings,
} from "../lib/accountSettings";
import type { Application, CreateApplicationInput } from "../types/application";

type DangerAction =
	| "reset_preferences"
	| "clear_local_data"
	| "clear_applications"
	| null;

const tabs: { id: SettingsTab; label: string }[] = [
	{ id: "settings", label: "Settings" },
	{ id: "details", label: "Details" },
	{ id: "notifications", label: "Notifications" },
	{ id: "defaults", label: "Defaults" },
	{ id: "data", label: "Data" },
];

const tabIds = tabs.map((tab) => tab.id);

const accentOptions: {
	label: string;
	value: AccentColour;
	className: string;
}[] = [
	{ label: "Teal", value: "teal", className: "bg-teal-500" },
	{ label: "Blue", value: "blue", className: "bg-blue-600" },
	{ label: "Purple", value: "purple", className: "bg-violet-600" },
	{ label: "Green", value: "green", className: "bg-emerald-500" },
	{ label: "Orange", value: "orange", className: "bg-orange-500" },
	{ label: "Pink", value: "pink", className: "bg-pink-500" },
];

function isSettingsTab(value: string | undefined): value is SettingsTab {
	return tabIds.includes(value as SettingsTab);
}

function formatOption(value: string) {
	return value
		.split("_")
		.map((word) => word[0].toUpperCase() + word.slice(1))
		.join(" ");
}

function toCsvValue(value: string | number | null | undefined) {
	const text = value == null ? "" : String(value);
	return `"${text.replaceAll('"', '""')}"`;
}

function buildApplicationsCsv(applications: Application[]) {
	const columns: {
		label: string;
		value: (application: Application) => string | number | null | undefined;
	}[] = [
		{ label: "Company", value: (application) => application.company },
		{ label: "Role", value: (application) => application.role },
		{ label: "Status", value: (application) => application.status },
		{ label: "Priority", value: (application) => application.priority },
		{ label: "Location", value: (application) => application.location },
		{ label: "Salary", value: (application) => application.salary },
		{ label: "Applied At", value: (application) => application.appliedAt },
		{
			label: "Follow Up At",
			value: (application) => application.followUpAt,
		},
		{
			label: "Deadline At",
			value: (application) => application.deadlineAt,
		},
		{ label: "Created At", value: (application) => application.createdAt },
	];

	return [
		columns.map((column) => toCsvValue(column.label)).join(","),
		...applications.map((application) =>
			columns
				.map((column) => toCsvValue(column.value(application)))
				.join(","),
		),
	].join("\n");
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

function getNotificationPermission() {
	if (!("Notification" in window)) return "unsupported";

	return Notification.permission;
}

function getImportedApplications(value: unknown): CreateApplicationInput[] {
	if (
		value &&
		typeof value === "object" &&
		"applications" in value &&
		Array.isArray(value.applications)
	) {
		return value.applications as CreateApplicationInput[];
	}

	if (Array.isArray(value)) {
		return value as CreateApplicationInput[];
	}

	return [];
}

function AccountRow({
	icon: Icon,
	title,
	description,
	children,
	isDanger = false,
}: {
	icon: LucideIcon;
	title: string;
	description: string;
	children?: ReactNode;
	isDanger?: boolean;
}) {
	const className = isDanger
		? "text-red-600 border-red-200 bg-red-50"
		: "text-slate-600 border-slate-200 bg-slate-50";

	return (
		<section className="grid gap-4 py-7 md:grid-cols-[2.25rem_minmax(0,1fr)]">
			<span
				className={`grid h-9 w-9 place-items-center rounded-lg border  ${className}`}
			>
				<Icon size={18} strokeWidth={2.4} />
			</span>
			<div className="min-w-0">
				<h2 className="text-sm font-black text-slate-950">{title}</h2>
				<p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">
					{description}
				</p>
				{children && <div className="mt-5">{children}</div>}
			</div>
		</section>
	);
}

function SettingGrid({ children }: { children: ReactNode }) {
	return <div className="grid gap-4 lg:grid-cols-2">{children}</div>;
}

function SettingItem({
	label,
	description,
	children,
}: {
	label: string;
	description?: string;
	children: ReactNode;
}) {
	return (
		<div className="grid gap-2">
			<label className="text-sm font-bold text-slate-950">{label}</label>
			{description && (
				<p className="text-xs font-medium leading-5 text-slate-500">
					{description}
				</p>
			)}
			{children}
		</div>
	);
}

function Toggle({
	checked,
	onChange,
	label,
}: {
	checked: boolean;
	onChange: (checked: boolean) => void;
	label: string;
}) {
	return <UiToggle checked={checked} label={label} onChange={onChange} />;
}

function Checkbox({
	checked,
	onChange,
	label,
}: {
	checked: boolean;
	onChange: (checked: boolean) => void;
	label: string;
}) {
	return <UiCheckbox checked={checked} label={label} onChange={onChange} />;
}

function SelectControl({
	value,
	onChange,
	children,
}: {
	value: string | number;
	onChange: (value: string) => void;
	children: ReactNode;
}) {
	return (
		<Select
			value={value}
			onChange={(event) => onChange(event.target.value)}
		>
			{children}
		</Select>
	);
}

function SegmentedControl<T extends string>({
	value,
	options,
	onChange,
}: {
	value: T;
	options: { label: string; value: T }[];
	onChange: (value: T) => void;
}) {
	return (
		<UiSegmentedControl
			value={value}
			options={options}
			onChange={onChange}
		/>
	);
}

function PrimaryButton({
	children,
	onClick,
	disabled,
}: {
	children: ReactNode;
	onClick?: () => void;
	disabled?: boolean;
}) {
	return (
		<Button variant="secondary" onClick={onClick} disabled={disabled}>
			{children}
		</Button>
	);
}

function SaveSectionButton({
	onClick,
	disabled,
	label = "Save changes",
}: {
	onClick: () => void;
	disabled: boolean;
	label?: string;
}) {
	return (
		<div className="mt-5">
			<Button
				variant="secondary"
				onClick={onClick}
				disabled={disabled}
				className={[
					disabled
						? "border-slate-100 text-slate-400"
						: "border-slate-300",
				].join(" ")}
			>
				{label}
			</Button>
		</div>
	);
}

export function AccountSettingsPage() {
	const { user } = useAuth();
	const {
		settings: storedSettings,
		saveSettings: saveStoredSettings,
		resetSettings,
	} = useAccountSettings();
	const { showToast } = useToast();
	const { accountTab } = useParams();
	const importInputRef = useRef<HTMLInputElement | null>(null);
	const [savedSettings, setSavedSettings] =
		useState<UserSettings>(storedSettings);
	const [settings, setSettings] = useState<UserSettings>(savedSettings);
	const [dangerAction, setDangerAction] = useState<DangerAction>(null);
	const [isExporting, setIsExporting] = useState(false);
	const [isImporting, setIsImporting] = useState(false);
	const [notificationPermission, setNotificationPermission] = useState(() =>
		getNotificationPermission(),
	);
	const activeTab: SettingsTab = isSettingsTab(accountTab)
		? accountTab
		: "settings";
	const shouldRedirect = !isSettingsTab(accountTab);

	useEffect(() => {
		setSavedSettings(storedSettings);
		setSettings(storedSettings);
	}, [storedSettings]);

	function hasUnsavedChanges(keys: (keyof UserSettings)[]) {
		return keys.some((key) => settings[key] !== savedSettings[key]);
	}

	async function saveSettings(
		sectionLabel: string,
		keys: (keyof UserSettings)[],
	) {
		const nextSavedSettings = {
			...savedSettings,
			...Object.fromEntries(keys.map((key) => [key, settings[key]])),
		} as UserSettings;

		try {
			const saved = await saveStoredSettings(nextSavedSettings);

			setSavedSettings(saved);
			setSettings(saved);
			showToast(`${sectionLabel} saved.`, "success");
		} catch (error) {
			showToast(
				error instanceof Error
					? error.message
					: `Could not save ${sectionLabel.toLowerCase()}.`,
				"error",
			);
		}
	}

	function updateSetting<K extends keyof UserSettings>(
		key: K,
		value: UserSettings[K],
	) {
		setSettings((current) => ({
			...current,
			[key]: value,
		}));
	}

	const providerLabels = useMemo(() => {
		if (!user?.providerData.length) return ["Not available"];

		return user.providerData.map((provider) =>
			provider.providerId === "google.com"
				? "Google"
				: formatOption(provider.providerId.replace(".com", "")),
		);
	}, [user?.providerData]);

	async function exportApplications(format: "csv" | "json") {
		try {
			setIsExporting(true);

			const applications = await getApplications();

			if (format === "csv") {
				downloadFile(
					"job-tracker-applications.csv",
					buildApplicationsCsv(applications),
					"text/csv;charset=utf-8",
				);
			} else {
				downloadFile(
					"job-tracker-data.json",
					JSON.stringify(
						{
							exportedAt: new Date().toISOString(),
							settings: savedSettings,
							applications,
						},
						null,
						2,
					),
					"application/json;charset=utf-8",
				);
			}
			showToast("Export started.", "success");
		} catch (error) {
			showToast(
				error instanceof Error ? error.message : "Export failed.",
				"error",
			);
		} finally {
			setIsExporting(false);
		}
	}

	async function handleImportJson(file: File | undefined) {
		if (!file) return;

		try {
			setIsImporting(true);

			const fileText = await file.text();
			const parsed = JSON.parse(fileText) as unknown;

			if (parsed && typeof parsed === "object" && "settings" in parsed) {
				const importedSettings = normalizeSettings(
					parsed.settings as Partial<UserSettings>,
				);
				const saved = await saveStoredSettings(importedSettings);

				setSavedSettings(saved);
				setSettings(saved);
			}

			const importedApplications = getImportedApplications(parsed);

			await Promise.all(
				importedApplications.map((application) =>
					createApplication({
						company: application.company,
						role: application.role,
						location: application.location || undefined,
						jobUrl: application.jobUrl || undefined,
						salary: application.salary || undefined,
						status: application.status,
						priority: application.priority,
						employmentType: application.employmentType || undefined,
						workMode: application.workMode || undefined,
						source: application.source || undefined,
						contactName: application.contactName || undefined,
						contactEmail: application.contactEmail || undefined,
						notes: application.notes || undefined,
						appliedAt: application.appliedAt || undefined,
						followUpAt: application.followUpAt || undefined,
						deadlineAt: application.deadlineAt || undefined,
						interviewAt: application.interviewAt || undefined,
						rejectedAt: application.rejectedAt || undefined,
						offerDeadlineAt:
							application.offerDeadlineAt || undefined,
					}),
				),
			);

			window.dispatchEvent(new Event("applications:changed"));
			showToast(
				`Imported ${importedApplications.length} applications.`,
				"success",
			);
		} catch (error) {
			showToast(
				error instanceof Error
					? error.message
					: "Could not import that JSON file.",
				"error",
			);
		} finally {
			setIsImporting(false);
			if (importInputRef.current) {
				importInputRef.current.value = "";
			}
		}
	}

	async function handleBrowserNotificationToggle(checked: boolean) {
		if (!checked) {
			updateSetting("browserNotificationsEnabled", false);
			return;
		}

		if (!("Notification" in window)) {
			setNotificationPermission("unsupported");
			showToast("This browser does not support notifications.", "error");
			return;
		}

		const permission =
			Notification.permission === "default"
				? await Notification.requestPermission()
				: Notification.permission;

		setNotificationPermission(permission);

		if (permission === "granted") {
			updateSetting("browserNotificationsEnabled", true);
			showToast("Browser notifications enabled.", "success");
		} else {
			updateSetting("browserNotificationsEnabled", false);
			showToast("Notifications are blocked in this browser.", "error");
		}
	}

	async function confirmDangerAction() {
		try {
			if (dangerAction === "reset_preferences") {
				const saved = await resetSettings();

				setSettings(saved);
				setSavedSettings(saved);
				showToast("Preferences reset.", "success");
			}

			if (dangerAction === "clear_local_data") {
				clearLocalSettings();
				showToast("Local settings cache cleared.", "success");
			}

			if (dangerAction === "clear_applications") {
				const result = await deleteAllApplications();

				window.dispatchEvent(new Event("applications:changed"));
				showToast(
					`Deleted ${result.deletedCount} applications.`,
					"success",
				);
			}
		} catch (error) {
			showToast(
				error instanceof Error ? error.message : "Action failed.",
				"error",
			);
		}

		setDangerAction(null);
	}

	if (shouldRedirect) {
		return <Navigate to="/account/settings" replace />;
	}

	return (
		<section className="grid gap-6">
			<div className="border-b border-slate-200 overflow-x-auto">
				<div
					role="tablist"
					aria-label="Account settings"
					className="flex gap-7 overflow-x-auto overflow-y-hidden flex-row"
				>
					{tabs.map((tab) => {
						const isActive = activeTab === tab.id;

						return (
							<Link
								key={tab.id}
								to={`/account/${tab.id}`}
								role="tab"
								aria-selected={isActive}
								className={[
									"flex h-11 shrink-0 items-center border-b-2 text-sm font-black transition",
									isActive
										? "border-slate-950 text-slate-950"
										: "border-transparent text-slate-500 hover:text-slate-900",
								].join(" ")}
							>
								{tab.label}
							</Link>
						);
					})}
				</div>
			</div>

			<div className="rounded-xl border border-slate-200 bg-white px-5 shadow-sm shadow-slate-200/40 md:px-7">
				{activeTab === "settings" && (
					<div className="divide-y divide-slate-200">
						<AccountRow
							icon={Palette}
							title="Appearance"
							description="Choose how the app should look and feel across dashboards, tables, and boards."
						>
							<SettingGrid>
								<SettingItem label="Theme">
									<SegmentedControl
										value={settings.theme}
										options={[
											{
												label: "System",
												value: "system",
											},
											{ label: "Light", value: "light" },
											{ label: "Dark", value: "dark" },
										]}
										onChange={(value) =>
											updateSetting("theme", value)
										}
									/>
								</SettingItem>

								<SettingItem label="Accent colour">
									<div className="flex flex-wrap gap-2">
										{accentOptions.map((option) => (
											<button
												key={option.value}
												type="button"
												onClick={() =>
													updateSetting(
														"accentColour",
														option.value,
													)
												}
												className={[
													"inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-bold transition",
													settings.accentColour ===
													option.value
														? "border-blue-200 bg-blue-50 text-blue-700"
														: "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
												].join(" ")}
											>
												<span
													className={[
														"h-3 w-3 rounded-full",
														option.className,
													].join(" ")}
												/>
												{option.label}
											</button>
										))}
									</div>
								</SettingItem>

								<SettingItem label="Font size">
									<SegmentedControl
										value={settings.fontSize}
										options={[
											{ label: "Small", value: "small" },
											{
												label: "Default",
												value: "default",
											},
											{ label: "Large", value: "large" },
										]}
										onChange={(value) =>
											updateSetting("fontSize", value)
										}
									/>
								</SettingItem>
							</SettingGrid>
							<SaveSectionButton
								disabled={
									!hasUnsavedChanges([
										"theme",
										"accentColour",
										"fontSize",
									])
								}
								onClick={() =>
									saveSettings("Appearance", [
										"theme",
										"accentColour",
										"fontSize",
									])
								}
							/>
						</AccountRow>

						<AccountRow
							icon={Table2}
							title="Tables"
							description="Set the defaults you want for application lists and repeated table views."
						>
							<SettingGrid>
								<SettingItem label="Default rows shown">
									<SelectControl
										value={settings.defaultTableRows}
										onChange={(value) =>
											updateSetting(
												"defaultTableRows",
												Number(value),
											)
										}
									>
										{tableRowOptions.map((count) => (
											<option key={count} value={count}>
												{count} rows
											</option>
										))}
									</SelectControl>
								</SettingItem>

								<SettingItem label="Table density">
									<SegmentedControl
										value={settings.tableDensity}
										options={[
											{
												label: "Comfortable",
												value: "comfortable",
											},
											{
												label: "Compact",
												value: "compact",
											},
										]}
										onChange={(value) =>
											updateSetting("tableDensity", value)
										}
									/>
								</SettingItem>

								<SettingItem label="Default sort">
									<SelectControl
										value={settings.defaultSort}
										onChange={(value) =>
											updateSetting("defaultSort", value)
										}
									>
										<option value="newest">
											Newest first
										</option>
										<option value="oldest">
											Oldest first
										</option>
										<option value="company_az">
											Company A-Z
										</option>
										<option value="company_za">
											Company Z-A
										</option>
										<option value="follow_up">
											Follow-up date
										</option>
										<option value="priority">
											Priority
										</option>
									</SelectControl>
								</SettingItem>

								<Checkbox
									checked={settings.stickyTableHeader}
									onChange={(checked) =>
										updateSetting(
											"stickyTableHeader",
											checked,
										)
									}
									label="Use sticky table headers"
								/>
							</SettingGrid>
							<SaveSectionButton
								disabled={
									!hasUnsavedChanges([
										"defaultTableRows",
										"tableDensity",
										"defaultSort",
										"stickyTableHeader",
									])
								}
								onClick={() =>
									saveSettings("Tables", [
										"defaultTableRows",
										"tableDensity",
										"defaultSort",
										"stickyTableHeader",
									])
								}
							/>
						</AccountRow>

						<AccountRow
							icon={Accessibility}
							title="Accessibility"
							description="Tune motion, contrast, focus, and target size preferences."
						>
							<SettingGrid>
								<Checkbox
									checked={settings.reducedMotion}
									onChange={(checked) =>
										updateSetting("reducedMotion", checked)
									}
									label="Reduce motion"
								/>
								<Checkbox
									checked={settings.highContrast}
									onChange={(checked) =>
										updateSetting("highContrast", checked)
									}
									label="High contrast mode"
								/>
								<Checkbox
									checked={settings.alwaysShowFocus}
									onChange={(checked) =>
										updateSetting(
											"alwaysShowFocus",
											checked,
										)
									}
									label="Always show focus outlines"
								/>
								<Checkbox
									checked={settings.largerClickTargets}
									onChange={(checked) =>
										updateSetting(
											"largerClickTargets",
											checked,
										)
									}
									label="Use larger click targets"
								/>
							</SettingGrid>
							<SaveSectionButton
								disabled={
									!hasUnsavedChanges([
										"reducedMotion",
										"highContrast",
										"alwaysShowFocus",
										"largerClickTargets",
									])
								}
								onClick={() =>
									saveSettings("Accessibility", [
										"reducedMotion",
										"highContrast",
										"alwaysShowFocus",
										"largerClickTargets",
									])
								}
							/>
						</AccountRow>
					</div>
				)}

				{activeTab === "details" && (
					<div className="divide-y divide-slate-200">
						<AccountRow
							icon={Mail}
							title="Email"
							description="Maintain access to your account and receive important security notifications."
						>
							<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
								<input
									readOnly
									value={user?.email || "No email available"}
									className="h-10 w-full max-w-sm rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-500 outline-none"
								/>
								<PrimaryButton disabled>
									Change email
								</PrimaryButton>
							</div>
							<div className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
								<CheckCircle2 size={16} strokeWidth={2.5} />
								{user?.emailVerified
									? "Email verified"
									: "Email not verified"}
							</div>
						</AccountRow>

						<AccountRow
							icon={KeyRound}
							title="Password"
							description="If you have forgotten your password, log out and reset it from the sign-in screen."
						>
							<PrimaryButton disabled>
								Change password
							</PrimaryButton>
						</AccountRow>

						<AccountRow
							icon={LockKeyhole}
							title="Connected providers"
							description="Sign-in providers reported by Firebase Auth."
						>
							<div className="flex flex-wrap gap-2">
								{providerLabels.map((provider) => (
									<span
										key={provider}
										className="inline-flex h-8 items-center rounded-lg bg-slate-100 px-3 text-xs font-bold text-slate-600"
									>
										{provider}
									</span>
								))}
							</div>
						</AccountRow>

						<AccountRow
							icon={Megaphone}
							title="Marketing preferences"
							description="Choose whether JobTracker can send product updates and non-essential messages."
						>
							<Checkbox
								checked={settings.marketingUpdatesEnabled}
								onChange={(checked) =>
									updateSetting(
										"marketingUpdatesEnabled",
										checked,
									)
								}
								label="I would like to receive JobTracker product updates."
							/>
							<SaveSectionButton
								disabled={
									!hasUnsavedChanges([
										"marketingUpdatesEnabled",
									])
								}
								onClick={() =>
									saveSettings("Marketing preferences", [
										"marketingUpdatesEnabled",
									])
								}
								label="Save preferences"
							/>
						</AccountRow>

						<AccountRow
							icon={ShieldOff}
							title="Security sessions"
							description="A full sign-out from every device needs a server-side session revocation flow. This placeholder marks where that control will live."
						>
							<PrimaryButton disabled>
								Sign out from all devices
							</PrimaryButton>
						</AccountRow>

						<AccountRow
							icon={Trash2}
							title="Delete account"
							description="Account deletion is disabled until a Firebase re-authentication and backend account removal flow is added."
							isDanger
						>
							<Button
								disabled
								variant="dangerSoft"
								icon={<Trash2 size={16} strokeWidth={2.4} />}
								className="border-red-100 bg-red-50 text-red-300"
							>
								Delete account
							</Button>
						</AccountRow>
					</div>
				)}

				{activeTab === "notifications" && (
					<div className="divide-y divide-slate-200">
						<AccountRow
							icon={Bell}
							title="Reminders"
							description="Choose which job search moments should nudge you."
						>
							<SettingGrid>
								<Checkbox
									checked={settings.interviewRemindersEnabled}
									onChange={(checked) =>
										updateSetting(
											"interviewRemindersEnabled",
											checked,
										)
									}
									label="Before interviews"
								/>
								<Checkbox
									checked={settings.deadlineRemindersEnabled}
									onChange={(checked) =>
										updateSetting(
											"deadlineRemindersEnabled",
											checked,
										)
									}
									label="Before application deadlines"
								/>
								<Checkbox
									checked={settings.followUpRemindersEnabled}
									onChange={(checked) =>
										updateSetting(
											"followUpRemindersEnabled",
											checked,
										)
									}
									label="When I should follow up"
								/>
								<Checkbox
									checked={settings.weeklySummaryEnabled}
									onChange={(checked) =>
										updateSetting(
											"weeklySummaryEnabled",
											checked,
										)
									}
									label="Weekly job search summary"
								/>
							</SettingGrid>
							<SaveSectionButton
								disabled={
									!hasUnsavedChanges([
										"interviewRemindersEnabled",
										"deadlineRemindersEnabled",
										"followUpRemindersEnabled",
										"weeklySummaryEnabled",
									])
								}
								onClick={() =>
									saveSettings("Reminders", [
										"interviewRemindersEnabled",
										"deadlineRemindersEnabled",
										"followUpRemindersEnabled",
										"weeklySummaryEnabled",
									])
								}
							/>
						</AccountRow>

						<AccountRow
							icon={SlidersHorizontal}
							title="Delivery"
							description="Set timing and browser notification preferences."
						>
							<SettingGrid>
								<SettingItem label="Reminder timing">
									<SelectControl
										value={settings.reminderTiming}
										onChange={(value) =>
											updateSetting(
												"reminderTiming",
												value as ReminderTiming,
											)
										}
									>
										<option value="one_hour">
											1 hour before
										</option>
										<option value="one_day">
											1 day before
										</option>
										<option value="three_days">
											3 days before
										</option>
									</SelectControl>
								</SettingItem>

								<SettingItem label="Browser notifications">
									<div className="flex items-center">
										<Toggle
											checked={
												settings.browserNotificationsEnabled
											}
											onChange={(checked) =>
												void handleBrowserNotificationToggle(
													checked,
												)
											}
											label="Browser notifications"
										/>
									</div>
									<p className="text-xs font-medium text-slate-500">
										Permission:{" "}
										{formatOption(notificationPermission)}
									</p>
								</SettingItem>
							</SettingGrid>
							<SaveSectionButton
								disabled={
									!hasUnsavedChanges([
										"reminderTiming",
										"browserNotificationsEnabled",
									])
								}
								onClick={() =>
									saveSettings("Delivery", [
										"reminderTiming",
										"browserNotificationsEnabled",
									])
								}
							/>
						</AccountRow>
					</div>
				)}

				{activeTab === "defaults" && (
					<div className="divide-y divide-slate-200">
						<AccountRow
							icon={BriefcaseBusiness}
							title="New application defaults"
							description="Reduce repeated input when you add a role."
						>
							<SettingGrid>
								<SettingItem
									label="Default application status"
									description="The pipeline stage selected automatically when you create a new application."
								>
									<SelectControl
										value={
											settings.defaultApplicationStatus
										}
										onChange={(value) =>
											updateSetting(
												"defaultApplicationStatus",
												value as ApplicationStatus,
											)
										}
									>
										{APPLICATION_STATUSES.map((status) => (
											<option key={status} value={status}>
												{
													applicationStatusLabels[
														status
													]
												}
											</option>
										))}
									</SelectControl>
								</SettingItem>

								<SettingItem
									label="Default job type"
									description="The employment type you most often apply for."
								>
									<SelectControl
										value={settings.defaultJobType}
										onChange={(value) =>
											updateSetting(
												"defaultJobType",
												value as EmploymentType | "",
											)
										}
									>
										<option value="">Not set</option>
										{EMPLOYMENT_TYPES.map((type) => (
											<option key={type} value={type}>
												{formatOption(type)}
											</option>
										))}
									</SelectControl>
								</SettingItem>

								<SettingItem
									label="Default work mode"
									description="The working arrangement to prefill on new roles."
								>
									<SelectControl
										value={settings.defaultWorkMode}
										onChange={(value) =>
											updateSetting(
												"defaultWorkMode",
												value as WorkMode | "",
											)
										}
									>
										<option value="">Not set</option>
										{WORK_MODES.map((mode) => (
											<option key={mode} value={mode}>
												{formatOption(mode)}
											</option>
										))}
									</SelectControl>
								</SettingItem>

								<SettingItem
									label="Preferred tracker view"
									description="Choose whether your default job-tracking workspace should open as the applications table or the Kanban board."
								>
									<SegmentedControl
										value={settings.defaultApplicationsView}
										options={[
											{ label: "Table", value: "table" },
											{
												label: "Kanban",
												value: "kanban",
											},
										]}
										onChange={(value) =>
											updateSetting(
												"defaultApplicationsView",
												value,
											)
										}
									/>
								</SettingItem>

								<SettingItem
									label="Default currency"
									description="The currency to assume when you enter a salary range."
								>
									<SelectControl
										value={settings.defaultCurrency}
										onChange={(value) =>
											updateSetting(
												"defaultCurrency",
												value as Currency,
											)
										}
									>
										<option value="GBP">GBP</option>
										<option value="USD">USD</option>
										<option value="EUR">EUR</option>
									</SelectControl>
								</SettingItem>

								<SettingItem
									label="Default salary period"
									description="Whether salary values should usually be treated as yearly or hourly."
								>
									<SegmentedControl
										value={settings.defaultSalaryPeriod}
										options={[
											{
												label: "Yearly",
												value: "yearly",
											},
											{
												label: "Hourly",
												value: "hourly",
											},
										]}
										onChange={(value) =>
											updateSetting(
												"defaultSalaryPeriod",
												value,
											)
										}
									/>
								</SettingItem>
							</SettingGrid>
							<SaveSectionButton
								disabled={
									!hasUnsavedChanges([
										"defaultApplicationStatus",
										"defaultJobType",
										"defaultWorkMode",
										"defaultApplicationsView",
										"defaultCurrency",
										"defaultSalaryPeriod",
									])
								}
								onClick={() =>
									saveSettings("Application defaults", [
										"defaultApplicationStatus",
										"defaultJobType",
										"defaultWorkMode",
										"defaultApplicationsView",
										"defaultCurrency",
										"defaultSalaryPeriod",
									])
								}
							/>
						</AccountRow>
					</div>
				)}

				{activeTab === "data" && (
					<div className="divide-y divide-slate-200">
						<AccountRow
							icon={Download}
							title="Export data"
							description="CSV exports are best for spreadsheets. JSON exports include applications and settings so they can be imported later."
						>
							<div className="flex flex-col gap-3 sm:flex-row">
								<PrimaryButton
									disabled={isExporting}
									onClick={() =>
										void exportApplications("csv")
									}
								>
									<Download size={16} strokeWidth={2.4} />
									Export applications CSV
								</PrimaryButton>
								<PrimaryButton
									disabled={isExporting}
									onClick={() =>
										void exportApplications("json")
									}
								>
									<FileJson size={16} strokeWidth={2.4} />
									Export full JSON
								</PrimaryButton>
							</div>
						</AccountRow>

						<AccountRow
							icon={Upload}
							title="Import data"
							description="Import a JSON backup exported from JobTracker. Applications are added to your backend account and settings are restored if present."
						>
							<input
								ref={importInputRef}
								type="file"
								accept="application/json,.json"
								className="hidden"
								onChange={(event) =>
									void handleImportJson(
										event.target.files?.[0],
									)
								}
							/>
							<PrimaryButton
								disabled={isImporting}
								onClick={() => importInputRef.current?.click()}
							>
								<Upload size={16} strokeWidth={2.4} />
								{isImporting ? "Importing..." : "Import JSON"}
							</PrimaryButton>
						</AccountRow>

						<AccountRow
							icon={Database}
							title="Storage details"
							description="Applications and saved preferences are stored in the backend database. This browser keeps a local settings cache only for fast startup and offline fallback."
						>
							<div className="grid gap-3 text-sm font-semibold text-slate-600 md:grid-cols-3">
								<span className="rounded-lg bg-slate-50 px-3 py-2">
									Auth: Firebase
								</span>
								<span className="rounded-lg bg-slate-50 px-3 py-2">
									Applications: API
								</span>
								<span className="rounded-lg bg-slate-50 px-3 py-2">
									Preferences: API + local cache
								</span>
							</div>
						</AccountRow>

						<AccountRow
							icon={ArchiveRestore}
							title="Reset and clear data"
							description="Reset preferences in the backend, clear this browser's settings cache, or remove all applications from your account."
							isDanger
						>
							<div className="flex flex-col gap-3 sm:flex-row">
								<PrimaryButton
									onClick={() =>
										setDangerAction("reset_preferences")
									}
								>
									<RefreshCcw size={16} strokeWidth={2.4} />
									Reset preferences
								</PrimaryButton>
								<Button
									onClick={() =>
										setDangerAction("clear_local_data")
									}
									variant="secondary"
									icon={
										<ArchiveRestore
											size={16}
											strokeWidth={2.4}
										/>
									}
								>
									Clear local cache
								</Button>
								<Button
									onClick={() =>
										setDangerAction("clear_applications")
									}
									variant="dangerSoft"
									icon={
										<Trash2 size={16} strokeWidth={2.4} />
									}
								>
									Clear all applications
								</Button>
							</div>
						</AccountRow>
					</div>
				)}
			</div>

			<ConfirmationModal
				isOpen={dangerAction !== null}
				title={
					dangerAction === "reset_preferences"
						? "Reset preferences?"
						: dangerAction === "clear_applications"
							? "Clear all applications?"
							: "Clear local cache?"
				}
				description={
					dangerAction === "reset_preferences"
						? "This will return your saved backend settings to their default values."
						: dangerAction === "clear_applications"
							? "This will permanently delete every application saved to your account."
							: "This will remove the settings cache from this browser. Your backend settings will remain saved."
				}
				confirmLabel={
					dangerAction === "reset_preferences"
						? "Reset preferences"
						: dangerAction === "clear_applications"
							? "Clear applications"
							: "Clear cache"
				}
				onCancel={() => setDangerAction(null)}
				onConfirm={confirmDangerAction}
			/>
		</section>
	);
}
