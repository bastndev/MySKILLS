export function initInstallPanel(): void {
	const installSurface = document.querySelector<HTMLElement>('.install-surface');
	if (!installSurface) {
		return;
	}

	const filters = Array.from(installSurface.querySelectorAll<HTMLButtonElement>('.install-filter[data-filter]'));
	const panels  = Array.from(installSurface.querySelectorAll<HTMLElement>('.install-panel'));

	if (!filters.length || !panels.length) {
		return;
	}

	const clearSearch = () => {
		const searchInput = document.getElementById('install-search-input') as HTMLInputElement | null;
		if (searchInput && searchInput.value !== '') {
			searchInput.value = '';
			searchInput.dispatchEvent(new Event('input', { bubbles: true }));
		}
	};

	const activateFilter = (btn: HTMLButtonElement) => {
		const target = btn.dataset.filter;
		if (!target) {
			return;
		}

		clearSearch();

		filters.forEach(filter => {
			const isActive = filter === btn;
			filter.classList.toggle('active', isActive);
			filter.setAttribute('aria-selected', String(isActive));
			filter.tabIndex = isActive ? 0 : -1;
		});

		panels.forEach(panel => {
			const isActive = panel.id === `install-panel-${target}`;
			panel.hidden = !isActive;
			panel.setAttribute('aria-hidden', String(!isActive));
		});
	};

	const focusFilter = (currentIndex: number, offset: number) => {
		const targetIndex = (currentIndex + offset + filters.length) % filters.length;
		filters[targetIndex].focus();
		activateFilter(filters[targetIndex]);
	};

	filters.forEach((btn, index) => {
		btn.tabIndex = btn.classList.contains('active') ? 0 : -1;

		btn.addEventListener('click', () => activateFilter(btn));
		btn.addEventListener('keydown', event => {
			if (event.key === 'ArrowRight') {
				event.preventDefault();
				focusFilter(index, 1);
			} else if (event.key === 'ArrowLeft') {
				event.preventDefault();
				focusFilter(index, -1);
			} else if (event.key === 'Home') {
				event.preventDefault();
				focusFilter(0, 0);
			} else if (event.key === 'End') {
				event.preventDefault();
				focusFilter(filters.length - 1, 0);
			}
		});
	});
}
