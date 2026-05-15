/**
 * install.ts — Install panel filter logic
 *
 * Handles switching between the All Time, Trending and Official sub-panels
 * when the user clicks a filter button inside #install-panel.
 *
 * This module is imported (or its logic is called) from the webview entry
 * point once the DOM is ready.
 */

export function initInstallPanel(): void {
	const installPanel = document.getElementById('install-panel');
	if (!installPanel) {
		return; // install panel not in the DOM yet — skip
	}

	const filters = installPanel.querySelectorAll<HTMLButtonElement>('.install-filter[data-filter]');
	const panels  = installPanel.querySelectorAll<HTMLElement>('.install-panel');

	if (!filters.length || !panels.length) {
		return;
	}

	filters.forEach((btn) => {
		btn.addEventListener('click', () => {
			const target = btn.dataset.filter; // 'all' | 'trending' | 'official'

			// ── Update filter buttons ──────────────────────────────────────
			filters.forEach((f) => {
				f.classList.remove('active');
				f.setAttribute('aria-selected', 'false');
			});
			btn.classList.add('active');
			btn.setAttribute('aria-selected', 'true');

			// ── Show the matching panel, hide the others ───────────────────
			panels.forEach((panel) => {
				const panelId   = panel.id;                     // e.g. "install-panel-all"
				const panelKey  = panelId.replace('install-panel-', ''); // "all" | "trending" | "official"
				const isActive  = panelKey === target;

				panel.hidden = !isActive;
				panel.setAttribute('aria-hidden', String(!isActive));
			});
		});
	});
}
