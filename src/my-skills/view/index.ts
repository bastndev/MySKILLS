type WebviewState = {
	activeTab?: string;
};

type VsCodeApi = {
	getState(): unknown;
	setState(state: WebviewState): void;
};

declare function acquireVsCodeApi(): VsCodeApi;

const vscodeApi = acquireVsCodeApi();

const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('.tab'));
const panels = Array.from(document.querySelectorAll<HTMLElement>('.panel'));
const indicator = document.querySelector<HTMLElement>('.slider-indicator');

function isWebviewState(value: unknown): value is WebviewState {
	if (!value || typeof value !== 'object') {
		return false;
	}

	const activeTab = (value as WebviewState).activeTab;
	return typeof activeTab === 'undefined' || typeof activeTab === 'string';
}

function switchToTab(targetId: string, persistState = true): boolean {
	const tab = tabs.find(candidate => candidate.dataset.target === targetId);
	const hasPanel = panels.some(panel => panel.id === targetId);

	if (!tab || !hasPanel) {
		return false;
	}

	const index = tabs.indexOf(tab);

	tabs.forEach(currentTab => {
		const isSelected = currentTab === tab;
		currentTab.classList.toggle('active', isSelected);
		currentTab.setAttribute('aria-selected', String(isSelected));
		currentTab.tabIndex = isSelected ? 0 : -1;
	});

	if (indicator) {
		indicator.style.transform = `translateX(${index * 100}%)`;
	}

	panels.forEach(panel => {
		const isSelected = panel.id === targetId;
		panel.classList.toggle('active', isSelected);
		panel.setAttribute('aria-hidden', String(!isSelected));
	});

	if (persistState) {
		vscodeApi.setState({ activeTab: targetId });
	}

	return true;
}

function focusRelativeTab(currentIndex: number, offset: number) {
	const targetIndex = (currentIndex + offset + tabs.length) % tabs.length;
	const target = tabs[targetIndex]?.dataset.target;

	if (target && switchToTab(target)) {
		tabs[targetIndex].focus();
	}
}

tabs.forEach((tab, index) => {
	tab.addEventListener('click', () => {
		const targetId = tab.dataset.target;

		if (targetId) {
			switchToTab(targetId);
		}
	});

	tab.addEventListener('keydown', event => {
		if (event.key === 'ArrowRight') {
			event.preventDefault();
			focusRelativeTab(index, 1);
		} else if (event.key === 'ArrowLeft') {
			event.preventDefault();
			focusRelativeTab(index, -1);
		} else if (event.key === 'Home') {
			event.preventDefault();
			focusRelativeTab(0, 0);
		} else if (event.key === 'End') {
			event.preventDefault();
			focusRelativeTab(tabs.length - 1, 0);
		}
	});
});

const savedState = vscodeApi.getState();
const savedTarget = isWebviewState(savedState) ? savedState.activeTab : undefined;
const fallbackTarget = tabs.find(tab => tab.classList.contains('active'))?.dataset.target ?? tabs[0]?.dataset.target;

if (!savedTarget || !switchToTab(savedTarget, false)) {
	if (fallbackTarget) {
		switchToTab(fallbackTarget, false);
	}
}

window.addEventListener('message', event => {
	const message = event.data;
	if (!message || typeof message !== 'object' || !('type' in message)) {
		return;
	}
	if (message.type === 'switch-tab' && typeof message.target === 'string') {
		switchToTab(message.target);
	}
});
