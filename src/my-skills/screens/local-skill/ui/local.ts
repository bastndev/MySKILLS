import type { LocalSkill, LocalSkillsUpdateMessage } from '../core/types';

type SortMode = 'az' | 'za' | 'newest';

type VsCodeApi = {
	postMessage(message: unknown): void;
};

const SKILL_ICON = `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
	<path d="M3.5 4.5h3l1 1h5v6h-9z"/>
	<path d="M5.5 8h5M8 6.75V9.25"/>
</svg>`;

const FOLDER_ICON = `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
	<path d="M2.5 4.5h4l1.2 1.4h5.8v5.6a1 1 0 0 1-1 1h-10z"/>
	<path d="M2.5 4.5v-1h4.2l1.1 1.4"/>
</svg>`;

const DUPLICATE_ICON = `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
	<path d="M5 5.5h6.5v7H5z"/>
	<path d="M3.5 10.5h-1v-7H9v1"/>
</svg>`;

const DELETE_ICON = `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
	<path d="M3.5 4.5h9"/>
	<path d="M6.5 4.5v-1h3v1"/>
	<path d="M5 6.5l.45 6h5.1l.45-6"/>
	<path d="M7 7.5v3.5M9 7.5v3.5"/>
</svg>`;

function escHtml(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function renderSkill(skill: LocalSkill): string {
	const switchLabel = `${skill.enabled ? 'Disable' : 'Enable'} ${skill.name}`;
	const isFolder = skill.kind === 'folder';

	return `
		<li class="local-item ${skill.enabled ? '' : 'local-item--disabled'}" data-skill-id="${escHtml(skill.id)}">
			<span class="local-item-badge ${isFolder ? 'local-item-badge--folder' : ''}" aria-hidden="true">
				${isFolder ? FOLDER_ICON : SKILL_ICON}
			</span>
			<div class="local-item-info">
				<span class="local-item-name">${escHtml(skill.name)}</span>
				<span class="local-item-meta">${escHtml(skill.source)}</span>
			</div>
			<div class="local-item-actions">
				<button class="local-item-action" type="button" aria-label="Duplicate ${escHtml(skill.name)}" title="Duplicate" data-action="duplicate" data-skill-id="${escHtml(skill.id)}">
					${DUPLICATE_ICON}
				</button>
				<button class="local-item-action local-item-action--danger" type="button" aria-label="Delete ${escHtml(skill.name)}" title="Delete" data-action="delete" data-skill-id="${escHtml(skill.id)}">
					${DELETE_ICON}
				</button>
				<label class="local-item-switch" aria-label="${escHtml(switchLabel)}">
					<input type="checkbox" role="switch" data-toggle-id="${escHtml(skill.id)}" ${skill.enabled ? 'checked' : ''}>
					<span class="local-item-switch-track" aria-hidden="true"></span>
				</label>
			</div>
		</li>
	`;
}

let skills: LocalSkill[] = [];
let sortMode: SortMode = 'az';

const SORT_CYCLE: SortMode[] = ['az', 'za', 'newest'];
const SORT_LABELS: Record<SortMode, string> = { az: 'A–Z', za: 'Z–A', newest: 'New' };

function getSorted(list: LocalSkill[]): LocalSkill[] {
	return [...list].sort((a, b) => {
		if (sortMode === 'az')     { return a.name.localeCompare(b.name); }
		if (sortMode === 'za')     { return b.name.localeCompare(a.name); }
		return b.installedAt - a.installedAt;
	});
}

function renderStats(statTotal: HTMLElement, statActive: HTMLElement, statDisabled: HTMLElement): void {
	statTotal.textContent   = String(skills.length);
	statActive.textContent   = String(skills.filter(s => s.enabled).length);
	statDisabled.textContent = String(skills.filter(s => !s.enabled).length);
}

function render(
	listEl:        HTMLUListElement,
	emptyEl:       HTMLElement,
	statTotal:     HTMLElement,
	statActive:    HTMLElement,
	statDisabled:  HTMLElement,
): void {
	const sorted = getSorted(skills);
	renderStats(statTotal, statActive, statDisabled);

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

function updateSkillEnabled(
	id: string,
	enabled: boolean,
	itemEl: HTMLElement | null,
	inputEl: HTMLInputElement,
	statTotal: HTMLElement,
	statActive: HTMLElement,
	statDisabled: HTMLElement,
): void {
	const skill = skills.find(candidate => candidate.id === id);
	if (!skill) {
		inputEl.checked = !enabled;
		return;
	}

	skill.enabled = enabled;
	itemEl?.classList.toggle('local-item--disabled', !enabled);
	inputEl.closest('.local-item-switch')?.setAttribute('aria-label', `${enabled ? 'Disable' : 'Enable'} ${skill.name}`);
	renderStats(statTotal, statActive, statDisabled);
}

function isLocalSkillsUpdateMessage(value: unknown): value is LocalSkillsUpdateMessage {
	return Boolean(value)
		&& typeof value === 'object'
		&& (value as { type?: unknown }).type === 'localSkills.update'
		&& Array.isArray((value as { skills?: unknown }).skills);
}

export function initLocalPanel(vscodeApi: VsCodeApi): void {
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

	const rerender = () =>
		render(listEl, emptyEl, statTotal, statActive, statDisabled);

	rerender();

	window.addEventListener('message', event => {
		if (!isLocalSkillsUpdateMessage(event.data)) {
			return;
		}

		skills = event.data.skills;
		rerender();
	});

	vscodeApi.postMessage({ type: 'localSkills.request' });

	if (sortBtn && sortLabel) {
		sortBtn.addEventListener('click', () => {
			const idx  = SORT_CYCLE.indexOf(sortMode);
			sortMode   = SORT_CYCLE[(idx + 1) % SORT_CYCLE.length];
			sortLabel.textContent = SORT_LABELS[sortMode];
			rerender();
		});
	}

	listEl.addEventListener('change', event => {
		const input = (event.target as Element).closest<HTMLInputElement>('[data-toggle-id]');
		if (!input) {
			return;
		}

		updateSkillEnabled(
			input.dataset.toggleId ?? '',
			input.checked,
			input.closest<HTMLElement>('.local-item'),
			input,
			statTotal,
			statActive,
			statDisabled,
		);
		vscodeApi.postMessage({
			type: 'localSkill.setEnabled',
			id: input.dataset.toggleId ?? '',
			enabled: input.checked,
		});
	});

	listEl.addEventListener('click', event => {
		const action = (event.target as Element).closest<HTMLButtonElement>('[data-action]');
		if (!action) {
			return;
		}

		action.blur();
	});

	if (gotoInstall) {
		gotoInstall.addEventListener('click', () => {
			const installTab = document.querySelector<HTMLButtonElement>('[data-target="install-panel"]');
			installTab?.click();
		});
	}
}
