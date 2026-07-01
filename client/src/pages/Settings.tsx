export function SettingsPage() {
	return (
		<section className="grid gap-6">
			<div>
				<h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
					Settings
				</h2>
				<p className="mt-2 max-w-2xl leading-7 text-slate-600">
					Manage your account, preferences, and job tracking settings.
				</p>
			</div>

			<div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
				<h3 className="text-lg font-extrabold">
					Settings coming later
				</h3>
				<p className="mx-auto mt-2 max-w-xl leading-7 text-slate-600">
					This can include profile details, default application
					status, notification preferences, and export options.
				</p>
			</div>
		</section>
	);
}
