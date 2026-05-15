const createSurface = document.querySelector('.create-skill-surface') as HTMLElement | null;

if (createSurface) {
	let pointerFrame = 0;
	let pointerX = 0;
	let pointerY = 0;

	createSurface.addEventListener('pointermove', event => {
		const rect = createSurface.getBoundingClientRect();
		pointerX = event.clientX - rect.left;
		pointerY = event.clientY - rect.top;
		createSurface.classList.add('is-pointer-active');

		if (pointerFrame) {
			return;
		}

		pointerFrame = requestAnimationFrame(() => {
			createSurface.style.setProperty('--create-glow-x', `${pointerX}px`);
			createSurface.style.setProperty('--create-glow-y', `${pointerY}px`);
			pointerFrame = 0;
		});
	});

	createSurface.addEventListener('pointerleave', () => {
		if (pointerFrame) {
			cancelAnimationFrame(pointerFrame);
			pointerFrame = 0;
		}

		createSurface.classList.remove('is-pointer-active');
	});
}
