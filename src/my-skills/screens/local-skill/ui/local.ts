/**
 * local.ts — LOCAL panel logic
 *
 * Manages the list of skills installed in the current workspace.
 * Data is mocked here; replace `MOCK_SKILLS` with a real VS Code
 * message/API call when the backend is ready.
 *
 * Features:
 *  - Type-categorized skill list (agent / design / config)
 *  - Filter tabs (All / Agent / Design / Config)
 *  - Sort toggle (A–Z / Z–A / newest)
 *  - Hover: version number ↔ remove button (CSS grid trick)
 *  - Stats bar (total / updates / agent count)
 *  - Empty states (no skills, no results for filter)
 *  - "Browse skills →" CTA switches to the INSTALL tab
 *  - Refresh button with spin animation
 */

// ── Types ─────────────────────────────────────────────────────────────

type SkillType = 'agent' | 'design' | 'config';
type SortMode  = 'az' | 'za' | 'newest';

interface LocalSkill {
	id:        string;
	name:      string;        // e.g. "AGENTS.md"
	source:    string;        // e.g. "microsoft/skills"
	version:   string;        // e.g. "1.2.0"
	type:      SkillType;
	hasUpdate: boolean;
	installedAt: number;      // timestamp for "newest" sort
}

// ── Mock data (replace with real data from extension host) ─────────────

const MOCK_SKILLS: LocalSkill[] = [
	{ id: 's1',  name: 'AGENTS.md',           source: 'microsoft/skills',       version: 'v1.4.2', type: 'agent',  hasUpdate: true,  installedAt: 1747000000 },
	{ id: 's2',  name: 'typescript-expert',   source: 'mattpocock/skills',      version: 'v2.1.0', type: 'agent',  hasUpdate: false, installedAt: 1746800000 },
	{ id: 's3',  name: 'DESIGN.md',           source: 'bastndev/skills',        version: 'v1.0.1', type: 'design', hasUpdate: true,  installedAt: 1746700000 },
	{ id: 's4',  name: '.agents/',            source: 'bastndev/skills',        version: 'v1.2.0', type: 'config', hasUpdate: false, installedAt: 1746600000 },
	{ id: 's5',  name: 'accessibility',       source: 'bastndev/skills',        version: 'v1.1.3', type: 'agent',  hasUpdate: false, installedAt: 1746500000 },
	{ id: 's6',  name: 'find-skills',         source: 'vercel-labs/skills',     version: 'v3.0.0', type: 'config', hasUpdate: true,  installedAt: 1746400000 },
	{ id: 's7',  name: 'gpt-image-2',         source: 'agentspace-so/skills',   version: 'v1.0.0', type: 'agent',  hasUpdate: false, installedAt: 1746300000 },
	{ id: 's8',  name: 'code-reviewer',       source: 'gh-actions/skills',      version: 'v2.3.1', type: 'agent',  hasUpdate: false, installedAt: 1746200000 },
];

// ── SVG icons per type ─────────────────────────────────────────────────

const TYPE_ICONS: Record<SkillType, string> = {
	agent: `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
		<path d="M8 2a3 3 0 0 1 3 3v1h1a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h1V5a3 3 0 0 1 3-3z"/>
		<path d="M6 9.5h.5M9.5 9.5H10"/>
	</svg>`,
	design: `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
		<path d="M3 12.5h10"/>
		<path d="M5 3.5h6v6H5z"/>
		<path d="M6.5 11.5 8 9.5l1.5 2"/>
	</svg>`,
	config: `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
		<path d="M3.5 4.5h3l1 1h5v6h-9z"/>
		<path d="M5.5 8h5M8 6.75V9.25"/>
	</svg>`,
};

function escHtml(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

// ── Render ─────────────────────────────────────────────────────────────

function renderSkill(skill: LocalSkill): string {
	const updateBadge = skill.hasUpdate
		? `<span class="local-item-update">update</span>`
		: '';

	return `
		<li class="local-item" data-skill-id="${escHtml(skill.id)}" data-skill-type="${skill.type}">
			<span class="local-item-badge" aria-label="${skill.type} skill">
				${TYPE_ICONS[skill.type]}
			</span>
			<div class="local-item-info">
				<span class="local-item-name">${escHtml(skill.name)}</span>
				<span class="local-item-meta">${escHtml(skill.source)}</span>
			</div>
			${updateBadge}
			<div class="local-item-actions">
				<span class="local-item-version">${escHtml(skill.version)}</span>
				<button
					class="local-item-remove-btn"
					type="button"
					aria-label="Remove ${escHtml(skill.name)}"
					data-remove-id="${escHtml(skill.id)}"
				>
					<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
						<path d="M4 4l8 8M12 4l-8 8"/>
					</svg>
				</button>
			</div>
		</li>
	`;
}

// ── State ──────────────────────────────────────────────────────────────

let skills:      LocalSkill[] = [...MOCK_SKILLS];
let activeFilter: string      = 'all';
let sortMode:     SortMode    = 'az';

const SORT_CYCLE: SortMode[]      = ['az', 'za', 'newest'];
const SORT_LABELS: Record<SortMode, string> = { az: 'A–Z', za: 'Z–A', newest: 'New' };

function getSorted(list: LocalSkill[]): LocalSkill[] {
	return [...list].sort((a, b) => {
		if (sortMode === 'az')     { return a.name.localeCompare(b.name); }
		if (sortMode === 'za')     { return b.name.localeCompare(a.name); }
		/* newest */                 return b.installedAt - a.installedAt;
	});
}

function getFiltered(list: LocalSkill[]): LocalSkill[] {
	if (activeFilter === 'all') { return list; }
	return list.filter(s => s.type === activeFilter);
}

// ── Render pipeline ────────────────────────────────────────────────────

function render(
	listEl:        HTMLUListElement,
	emptyEl:       HTMLElement,
	filterEmptyEl: HTMLElement,
	statTotal:     HTMLElement,
	statUpdates:   HTMLElement,
	statAgents:    HTMLElement,
): void {
	// Stats always use the full unfiltered list
	statTotal.textContent   = String(skills.length);
	statUpdates.textContent = String(skills.filter(s => s.hasUpdate).length);
	statAgents.textContent  = String(skills.filter(s => s.type === 'agent').length);

	const filtered = getSorted(getFiltered(skills));

	if (skills.length === 0) {
		listEl.innerHTML = '';
		listEl.hidden    = true;
		emptyEl.hidden   = false;
		filterEmptyEl.hidden = true;
		return;
	}

	emptyEl.hidden = true;

	if (filtered.length === 0) {
		listEl.innerHTML = '';
		listEl.hidden    = true;
		filterEmptyEl.hidden = false;
		return;
	}

	filterEmptyEl.hidden = true;
	listEl.hidden        = false;
	listEl.innerHTML     = filtered.map(renderSkill).join('');
}

// ── Init ───────────────────────────────────────────────────────────────

export function initLocalPanel(): void {
	const listEl        = document.getElementById('local-list')        as HTMLUListElement | null;
	const emptyEl       = document.getElementById('local-empty')       as HTMLElement | null;
	const filterEmptyEl = document.getElementById('local-filter-empty') as HTMLElement | null;
	const statTotal     = document.getElementById('stat-total')        as HTMLElement | null;
	const statUpdates   = document.getElementById('stat-updates')      as HTMLElement | null;
	const statAgents    = document.getElementById('stat-agents')       as HTMLElement | null;
	const refreshBtn    = document.getElementById('local-refresh-btn') as HTMLButtonElement | null;
	const sortBtn       = document.getElementById('local-sort-btn')    as HTMLButtonElement | null;
	const sortLabel     = document.getElementById('local-sort-label')  as HTMLElement | null;
	const gotoInstall   = document.getElementById('local-goto-install') as HTMLButtonElement | null;

	if (!listEl || !emptyEl || !filterEmptyEl || !statTotal || !statUpdates || !statAgents) {
		return;
	}

	// ── Helper to re-render ──────────────────────────────────────────
	const rerender = () =>
		render(listEl, emptyEl, filterEmptyEl, statTotal, statUpdates, statAgents);

	// ── Initial render ───────────────────────────────────────────────
	rerender();

	// ── Filter tabs ──────────────────────────────────────────────────
	const filterTabs = document.querySelectorAll<HTMLButtonElement>('.local-tab[data-local-filter]');
	filterTabs.forEach(tab => {
		tab.addEventListener('click', () => {
			activeFilter = tab.dataset.localFilter ?? 'all';
			filterTabs.forEach(t => {
				t.classList.toggle('active', t === tab);
				t.setAttribute('aria-selected', String(t === tab));
			});
			rerender();
		});
	});

	// ── Sort toggle ──────────────────────────────────────────────────
	if (sortBtn && sortLabel) {
		sortBtn.addEventListener('click', () => {
			const idx  = SORT_CYCLE.indexOf(sortMode);
			sortMode   = SORT_CYCLE[(idx + 1) % SORT_CYCLE.length];
			sortLabel.textContent = SORT_LABELS[sortMode];
			rerender();
		});
	}

	// ── Remove skill (delegated) ─────────────────────────────────────
	listEl.addEventListener('click', e => {
		const btn = (e.target as Element).closest<HTMLButtonElement>('[data-remove-id]');
		if (!btn) { return; }
		e.stopPropagation();

		const id = btn.dataset.removeId;
		if (!id) { return; }

		// Animate item out before removing from data
		const item = btn.closest<HTMLElement>('.local-item');
		if (item) {
			item.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
			item.style.opacity    = '0';
			item.style.transform  = 'translateX(6px)';
			setTimeout(() => {
				skills = skills.filter(s => s.id !== id);
				rerender();
			}, 180);
		} else {
			skills = skills.filter(s => s.id !== id);
			rerender();
		}
	});

	// ── Refresh (spin animation + re-render) ─────────────────────────
	if (refreshBtn) {
		refreshBtn.addEventListener('click', () => {
			refreshBtn.classList.add('is-spinning');
			// In a real extension this would await a message to the host
			setTimeout(() => {
				refreshBtn.classList.remove('is-spinning');
				// skills = fetchedSkills; // future: replace mock
				rerender();
			}, 700);
		});
	}

	// ── "Browse skills →" CTA → switch to INSTALL tab ────────────────
	if (gotoInstall) {
		gotoInstall.addEventListener('click', () => {
			// Trigger the install tab using the main tab switcher.
			const installTab = document.querySelector<HTMLButtonElement>('[data-target="install-panel"]');
			installTab?.click();
		});
	}
}
