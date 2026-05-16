interface SkillRecord {
	name: string;
	source: string;
	downloads: string;
}

function collectSkillsFromDom(): SkillRecord[] {
	const sourcePanels = document.querySelectorAll<HTMLElement>(
		'#install-panel-all .install-item, #install-panel-trending .install-item'
	);

	const seen = new Set<string>();
	const skills: SkillRecord[] = [];

	sourcePanels.forEach((item) => {
		const name     = item.querySelector<HTMLElement>('.install-name')?.textContent?.trim() ?? '';
		const source   = item.querySelector<HTMLElement>('.install-source')?.textContent?.trim() ?? '';
		const downloads = item.querySelector<HTMLElement>('.install-downloads')?.textContent?.trim().replace(/\s+/g, ' ').split(' ').pop() ?? '';

		if (name && !seen.has(name)) {
			seen.add(name);
			skills.push({ name, source, downloads });
		}
	});

	return skills;
}

function renderItem(item: SkillRecord, index: number): string {
	return `
		<li class="install-item">
			<span class="install-rank">${index + 1}</span>
			<div class="install-info">
				<span class="install-name">${escHtml(item.name)}</span>
				<span class="install-source">${escHtml(item.source)}</span>
			</div>
			<div class="install-meta">
				<span class="install-downloads">
					<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M8 2v7M5 6.5L8 10l3-3.5M3 13h10" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/></svg>
					${escHtml(item.downloads)}
				</span>
				<button class="install-btn" type="button" aria-label="Install ${escHtml(item.name)}">Install</button>
			</div>
		</li>
	`;
}

function escHtml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

export function initSearchPanel(): void {
	const searchInput      = document.getElementById('install-search-input') as HTMLInputElement | null;
	const searchPanel      = document.getElementById('install-panel-search');
	const resultsContainer = document.getElementById('install-search-results');
	const emptyState       = document.getElementById('install-search-empty');
	const countEl          = document.getElementById('install-search-count');

	if (!searchInput || !searchPanel || !resultsContainer || !emptyState) {
		return;
	}

	let skillData: SkillRecord[] = [];

	function ensureSkillData() {
		if (skillData.length === 0) {
			skillData = collectSkillsFromDom();
		}
	}

	function showSearchResults(query: string) {
		ensureSkillData();

		const allPanels = document.querySelectorAll<HTMLElement>('.install-panel:not(#install-panel-search)');
		allPanels.forEach(p => {
			p.hidden = true;
			p.setAttribute('aria-hidden', 'true');
		});
		searchPanel!.hidden = false;
		searchPanel!.setAttribute('aria-hidden', 'false');

		const q = query.toLowerCase();
		const filtered = skillData.filter(item =>
			item.name.toLowerCase().includes(q) || item.source.toLowerCase().includes(q)
		);

		if (filtered.length > 0) {
			resultsContainer!.innerHTML = filtered.map((item, i) => renderItem(item, i)).join('');
			resultsContainer!.hidden = false;
			emptyState!.hidden = true;
			if (countEl) {
				countEl.textContent = `${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${query}"`;
				countEl.hidden = false;
			}
		} else {
			resultsContainer!.hidden = true;
			emptyState!.hidden = false;
			if (countEl) { countEl.hidden = true; }
		}
	}

	function hideSearchResults() {
		searchPanel!.hidden = true;
		searchPanel!.setAttribute('aria-hidden', 'true');
		if (countEl) { countEl.hidden = true; }

		const activeFilter = document.querySelector<HTMLButtonElement>('.install-filter.active');
		if (activeFilter) {
			const target      = activeFilter.dataset.filter;
			const activePanel = document.getElementById(`install-panel-${target}`);
			if (activePanel) {
				activePanel.hidden = false;
				activePanel.setAttribute('aria-hidden', 'false');
			}
		}
	}

	searchInput.addEventListener('input', (e) => {
		const query = (e.target as HTMLInputElement).value.trim();

		if (query.length > 0) {
			showSearchResults(query);
		} else {
			hideSearchResults();
		}
	});

	searchInput.addEventListener('keydown', (e) => {
		if (e.key === 'Escape') {
			searchInput.value = '';
			hideSearchResults();
		}
	});
}
