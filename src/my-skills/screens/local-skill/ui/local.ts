/**
 * local.ts — LOCAL panel logic
 *
 * Manages the list of skills installed in the current workspace.
 * Data is mocked here; replace `MOCK_SKILLS` with a real VS Code
 * message/API call when the backend is ready.
 *
 * Features:
 *  - Sort toggle (A–Z / Z–A / newest)
 *  - Visible enable/disable switch per skill
 *  - Stats bar (installed / active / disabled)
 *  - Empty state when no skills are installed
 *  - "Browse skills →" CTA switches to the INSTALL tab
 */

// ── Types ─────────────────────────────────────────────────────────────

type SortMode  = 'az' | 'za' | 'newest';

interface LocalSkill {
	id:        string;
	name:      string;        // e.g. "AGENTS.md"
	source:    string;        // e.g. "microsoft/skills"
	hasUpdate: boolean;
	enabled:   boolean;
	installedAt: number;      // timestamp for "newest" sort
}

// ── Mock data (replace with real data from extension host) ─────────────

const MOCK_SKILLS: LocalSkill[] = [
	{ id: 's1',  name: 'AGENTS.md',           source: 'microsoft/skills',       hasUpdate: true,  enabled: true,  installedAt: 1747000000 },
	{ id: 's2',  name: 'typescript-expert',   source: 'mattpocock/skills',      hasUpdate: false, enabled: true,  installedAt: 1746800000 },
	{ id: 's3',  name: 'DESIGN.md',           source: 'bastndev/skills',        hasUpdate: true,  enabled: true,  installedAt: 1746700000 },
	{ id: 's4',  name: '.agents/',            source: 'bastndev/skills',        hasUpdate: false, enabled: true,  installedAt: 1746600000 },
	{ id: 's5',  name: 'accessibility',       source: 'bastndev/skills',        hasUpdate: false, enabled: true,  installedAt: 1746500000 },
	{ id: 's6',  name: 'find-skills',         source: 'vercel-labs/skills',     hasUpdate: true,  enabled: false, installedAt: 1746400000 },
	{ id: 's7',  name: 'gpt-image-2',         source: 'agentspace-so/skills',   hasUpdate: false, enabled: true,  installedAt: 1746300000 },
	{ id: 's8',  name: 'code-reviewer',       source: 'gh-actions/skills',      hasUpdate: false, enabled: false, installedAt: 1746200000 },
];

const SKILL_ICON = `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
	<path d="M3.5 4.5h3l1 1h5v6h-9z"/>
	<path d="M5.5 8h5M8 6.75V9.25"/>
</svg>`;

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
		<li class="local-item" data-skill-id="${escHtml(skill.id)}">
			<span class="local-item-badge" aria-hidden="true">
				${SKILL_ICON}
			</span>
			<div class="local-item-info">
				<span class="local-item-name">${escHtml(skill.name)}</span>
				<span class="local-item-meta">${escHtml(skill.source)}</span>
			</div>
			${updateBadge}
			<div class="local-item-actions">
				<label class="local-item-switch" aria-label="${skill.enabled ? 'Disable' : 'Enable'} ${escHtml(skill.name)}">
					<input type="checkbox" ${skill.enabled ? 'checked' : ''}>
					<span class="local-item-switch-track" aria-hidden="true"></span>
				</label>
			</div>
		</li>
	`;
}

// ── State ──────────────────────────────────────────────────────────────

let skills:      LocalSkill[] = [...MOCK_SKILLS];
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

// ── Render pipeline ────────────────────────────────────────────────────

function render(
	listEl:        HTMLUListElement,
	emptyEl:       HTMLElement,
	statTotal:     HTMLElement,
	statActive:    HTMLElement,
	statDisabled:  HTMLElement,
): void {
	// Stats always use the full unfiltered list
	statTotal.textContent   = String(skills.length);
	statActive.textContent   = String(skills.filter(s => s.enabled).length);
	statDisabled.textContent = String(skills.filter(s => !s.enabled).length);

	const sorted = getSorted(skills);

	if (skills.length === 0) {
		listEl.innerHTML = '';
		listEl.hidden    = true;
		emptyEl.hidden   = false;
		return;
	}

	emptyEl.hidden = true;
	listEl.hidden        = false;
	listEl.innerHTML     = sorted.map(renderSkill).join('');
}

// ── Init ───────────────────────────────────────────────────────────────

export function initLocalPanel(): void {
	const listEl        = document.getElementById('local-list')        as HTMLUListElement | null;
	const emptyEl       = document.getElementById('local-empty')       as HTMLElement | null;
	const statTotal     = document.getElementById('stat-total')        as HTMLElement | null;
	const statActive    = document.getElementById('stat-active')       as HTMLElement | null;
	const statDisabled  = document.getElementById('stat-disabled')     as HTMLElement | null;
	const sortBtn       = document.getElementById('local-sort-btn')    as HTMLButtonElement | null;
	const sortLabel     = document.getElementById('local-sort-label')  as HTMLElement | null;
	const gotoInstall   = document.getElementById('local-goto-install') as HTMLButtonElement | null;

	if (!listEl || !emptyEl || !statTotal || !statActive || !statDisabled) {
		return;
	}

	// ── Helper to re-render ──────────────────────────────────────────
	const rerender = () =>
		render(listEl, emptyEl, statTotal, statActive, statDisabled);

	// ── Initial render ───────────────────────────────────────────────
	rerender();

	// ── Sort toggle ──────────────────────────────────────────────────
	if (sortBtn && sortLabel) {
		sortBtn.addEventListener('click', () => {
			const idx  = SORT_CYCLE.indexOf(sortMode);
			sortMode   = SORT_CYCLE[(idx + 1) % SORT_CYCLE.length];
			sortLabel.textContent = SORT_LABELS[sortMode];
			rerender();
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
