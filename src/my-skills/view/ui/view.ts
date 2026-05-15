const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');
const indicator = document.querySelector('.slider-indicator') as HTMLElement;

tabs.forEach((tab, index) => {
	tab.addEventListener('click', () => {
		// Update tabs
		tabs.forEach(t => t.classList.remove('active'));
		tab.classList.add('active');

		// Move indicator
		if (indicator) {
			indicator.style.transform = `translateX(${index * 100}%)`;
		}

		// Show corresponding panel
		const targetId = tab.getAttribute('data-target');
		panels.forEach(panel => {
			if (panel.id === targetId) {
				panel.classList.add('active');
			} else {
				panel.classList.remove('active');
			}
		});
	});
});