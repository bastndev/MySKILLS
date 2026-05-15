declare function acquireVsCodeApi(): { postMessage(message: unknown): void; getState(): unknown; setState(state: unknown): void };

const vscodeApi = acquireVsCodeApi();

const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');
const indicator = document.querySelector('.slider-indicator') as HTMLElement;

function switchToTab(targetId: string) {
	const tab = document.querySelector(`.tab[data-target="${targetId}"]`) as HTMLElement;
	if (!tab) {
		return;
	}

	const index = Array.from(tabs).indexOf(tab);

	tabs.forEach(t => t.classList.remove('active'));
	tab.classList.add('active');

	if (indicator) {
		indicator.style.transform = `translateX(${index * 100}%)`;
	}

	panels.forEach(panel => {
		if (panel.id === targetId) {
			panel.classList.add('active');
		} else {
			panel.classList.remove('active');
		}
	});
}

tabs.forEach(tab => {
	tab.addEventListener('click', () => {
		const targetId = tab.getAttribute('data-target')!;
		switchToTab(targetId);
	});
});

window.addEventListener('message', event => {
	const message = event.data;
	if (!message || typeof message !== 'object' || !('type' in message)) {
		return;
	}
	if (message.type === 'switch-tab' && typeof message.target === 'string') {
		switchToTab(message.target);
	}
});
