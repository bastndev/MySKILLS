import type { LocalSkill, LocalSkillsUpdateMessage } from '../core/types';
import { ROOT_SKILL_FILES } from '../core/file-folder/file-skills';

type SortMode = 'az' | 'za' | 'newest';

type VsCodeApi = {
	postMessage(message: unknown): void;
};

const FOLDER_ICON = `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
	<path d="M2.5 4.5h4l1.2 1.4h5.8v5.6a1 1 0 0 1-1 1h-10z"/>
	<path d="M2.5 4.5v-1h4.2l1.1 1.4"/>
</svg>`;

const DUPLICATE_ICON = `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
	<path d="M5 5.5h6.5v7H5z"/>
	<path d="M3.5 10.5h-1v-7H9v1"/>
</svg>`;

const SAVE_ICON = `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
	<path d="M3.5 2.5h7.4l1.6 1.6v9.4h-9z"/>
	<path d="M5.5 2.5v4h5"/>
	<path d="M5.5 13.5v-4h5v4"/>
</svg>`;

const DELETE_ICON = `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
	<path d="M3.5 4.5h9"/>
	<path d="M6.5 4.5v-1h3v1"/>
	<path d="M5 6.5l.45 6h5.1l.45-6"/>
	<path d="M7 7.5v3.5M9 7.5v3.5"/>
</svg>`;

const ACTION_ICONS = {
	delete: DELETE_ICON,
	save: SAVE_ICON,
	duplicate: DUPLICATE_ICON,
} as const;

type LocalAction = keyof typeof ACTION_ICONS;
const POSTABLE_ACTIONS = new Set<LocalAction>(['delete']);

function escHtml(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function getSkillMeta(skill: LocalSkill): string {
	if (skill.kind === 'folder') {
		const segments = skill.id.split('/');
		return segments.length > 1 ? segments.slice(0, -1).join('/') : skill.source;
	}

	return 'workspace root';
}

function renderActionButton(action: LocalAction, skill: LocalSkill): string {
	const label = action.charAt(0).toUpperCase() + action.slice(1);
	const className = action === 'delete'
		? 'local-item-action local-item-action--danger'
		: action === 'save'
			? 'local-item-action local-item-action--save'
			: 'local-item-action';

	return `
		<button class="${className}" type="button" aria-label="${label} ${escHtml(skill.name)}" title="${label}" data-action="${action}" data-skill-id="${escHtml(skill.id)}">
			${ACTION_ICONS[action]}
		</button>
	`;
}

function renderSkillActions(skill: LocalSkill): string {
	const actions: LocalAction[] = skill.kind === 'folder'
		? ['delete', 'save', 'duplicate']
		: ['delete'];

	return actions.map(action => renderActionButton(action, skill)).join('');
}

function renderSkill(skill: LocalSkill): string {
	const switchLabel = `${skill.enabled ? 'Disable' : 'Enable'} ${skill.name}`;
	const isFolder = skill.kind === 'folder';
	const meta = getSkillMeta(skill);
	const typeLabel = isFolder ? 'Folder' : 'File';

	return `
		<li class="local-item ${isFolder ? 'local-item--folder' : 'local-item--file'} ${skill.enabled ? '' : 'local-item--disabled'}" data-skill-id="${escHtml(skill.id)}" title="${escHtml(skill.id)}">
			<span class="local-item-badge ${isFolder ? 'local-item-badge--folder' : 'local-item-badge--file'}" aria-hidden="true">
				${isFolder ? FOLDER_ICON : skill.icon ?? ''}
			</span>
			<div class="local-item-info">
				<span class="local-item-name" title="${escHtml(skill.name)}">${escHtml(skill.name)}</span>
				<span class="local-item-meta" title="${escHtml(skill.id)}">
					<span class="local-item-kind">${typeLabel}</span>
					<span class="local-item-path">${escHtml(meta)}</span>
				</span>
			</div>
			<div class="local-item-actions">
				${renderSkillActions(skill)}
				<label class="local-item-switch" aria-label="${escHtml(switchLabel)}">
					<input type="checkbox" role="switch" data-toggle-id="${escHtml(skill.id)}" ${skill.enabled ? 'checked' : ''}>
					<span class="local-item-switch-track" aria-hidden="true"></span>
				</label>
			</div>
		</li>
	`;
}

let skills: LocalSkill[] = [];
let sortMode: SortMode = 'newest';

const SORT_CYCLE: SortMode[] = ['newest', 'az', 'za'];
const SORT_LABELS: Record<SortMode, string> = { az: 'A–Z', za: 'Z–A', newest: 'New' };
const NEXT_SORT_LABELS: Record<SortMode, string> = { newest: 'A–Z', az: 'Z–A', za: 'New' };

function getRootFileOrder(skill: LocalSkill): number {
	return ROOT_SKILL_FILES.findIndex(fileName => fileName === skill.id);
}

function getSorted(list: LocalSkill[]): LocalSkill[] {
	return [...list].sort((a, b) => {
		if (a.kind !== b.kind) {
			return a.kind === 'file' ? -1 : 1;
		}

		if (a.kind === 'file') {
			return getRootFileOrder(a) - getRootFileOrder(b);
		}

		if (sortMode === 'az')     { return a.name.localeCompare(b.name); }
		if (sortMode === 'za')     { return b.name.localeCompare(a.name); }
		return b.installedAt - a.installedAt;
	});
}

function renderStats(statTotal: HTMLElement, statActive: HTMLElement, statDisabled: HTMLElement): void {
	let activeCount = 0;
	for (const skill of skills) {
		if (skill.enabled) {
			activeCount++;
		}
	}

	statTotal.textContent = String(skills.length);
	statActive.textContent = String(activeCount);
	statDisabled.textContent = String(skills.length - activeCount);
}

function getSortedIds(list: LocalSkill[]): string[] {
	return getSorted(list).map(skill => skill.id);
}

function hasSameRenderedOrder(currentSkills: LocalSkill[], nextSkills: LocalSkill[]): boolean {
	const currentIds = getSortedIds(currentSkills);
	const nextIds = getSortedIds(nextSkills);

	return currentIds.length === nextIds.length
		&& currentIds.every((id, index) => id === nextIds[index]);
}

function syncRenderedSkillState(
	listEl: HTMLUListElement,
	statTotal: HTMLElement,
	statActive: HTMLElement,
	statDisabled: HTMLElement,
): void {
	for (const skill of skills) {
		const itemEl = listEl.querySelector<HTMLElement>(`[data-skill-id="${CSS.escape(skill.id)}"]`);
		const inputEl = itemEl?.querySelector<HTMLInputElement>('[data-toggle-id]');

		itemEl?.classList.toggle('local-item--disabled', !skill.enabled);
		if (inputEl) {
			inputEl.checked = skill.enabled;
			inputEl.closest('.local-item-switch')?.setAttribute('aria-label', `${skill.enabled ? 'Disable' : 'Enable'} ${skill.name}`);
		}
	}

	renderStats(statTotal, statActive, statDisabled);
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

function isLocalAction(value: string | undefined): value is LocalAction {
	return value === 'delete' || value === 'save' || value === 'duplicate';
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

		const nextSkills = event.data.skills;
		const canSyncStateOnly = skills.length > 0
			&& nextSkills.length > 0
			&& hasSameRenderedOrder(skills, nextSkills);

		skills = nextSkills;
		if (canSyncStateOnly) {
			syncRenderedSkillState(listEl, statTotal, statActive, statDisabled);
		} else {
			rerender();
		}
	});

	vscodeApi.postMessage({ type: 'localSkills.request' });

	if (sortBtn && sortLabel) {
		sortBtn.addEventListener('click', () => {
			const idx  = SORT_CYCLE.indexOf(sortMode);
			sortMode   = SORT_CYCLE[(idx + 1) % SORT_CYCLE.length];
			sortLabel.textContent = NEXT_SORT_LABELS[sortMode];
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

		const actionName = action.dataset.action;
		const skillId = action.dataset.skillId;
		if (isLocalAction(actionName) && POSTABLE_ACTIONS.has(actionName) && skillId) {
			vscodeApi.postMessage({
				type: 'localSkill.delete',
				id: skillId,
			});
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
