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
	// The install surface is the real container — there is no #install-panel element.
	const installSurface = document.querySelector<HTMLElement>('.install-surface');
	if (!installSurface) {
		return; // install surface not in the DOM yet — skip
	}

	const filters = installSurface.querySelectorAll<HTMLButtonElement>('.install-filter[data-filter]');
	const panels  = installSurface.querySelectorAll<HTMLElement>('.install-panel');

	if (!filters.length || !panels.length) {
		return;
	}

	filters.forEach((btn) => {
		btn.addEventListener('click', () => {
			const target = btn.dataset.filter; // 'all' | 'trending' | 'official'

			// Clear search input if active
			const searchInput = document.getElementById('install-search-input') as HTMLInputElement | null;
			if (searchInput) {
				searchInput.value = '';
			}

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
