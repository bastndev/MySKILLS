const createSurface = document.querySelector('.create-skill-surface') as HTMLElement | null;
const createChat = document.querySelector('.create-chat') as HTMLElement | null;
const createChatInput = document.querySelector('.create-chat-input') as HTMLTextAreaElement | null;
const createChatSend = document.querySelector('.create-chat-send') as HTMLButtonElement | null;

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const canTrackPointer = window.matchMedia('(pointer: fine)');

if (createSurface && canTrackPointer.matches && !prefersReducedMotion.matches) {
	let pointerFrame = 0;
	let pointerX = 0;
	let pointerY = 0;

	const clearPointerGlow = () => {
		if (pointerFrame) {
			cancelAnimationFrame(pointerFrame);
			pointerFrame = 0;
		}

		createSurface.classList.remove('is-pointer-active');
	};

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
	}, { passive: true });

	createSurface.addEventListener('pointerleave', clearPointerGlow, { passive: true });
	createSurface.addEventListener('pointercancel', clearPointerGlow, { passive: true });
}

if (createSurface && !prefersReducedMotion.matches) {
	createSurface.classList.add('is-welcome');
	window.setTimeout(() => createSurface.classList.remove('is-welcome'), 1400);
}

if (createChat && createChatInput) {
	const syncChatInputState = () => {
		const hasMessage = createChatInput.value.trim().length > 0;

		createChat.classList.toggle('has-message', hasMessage);

		if (createChatSend) {
			createChatSend.disabled = !hasMessage;
			createChatSend.setAttribute('aria-disabled', String(!hasMessage));
		}
	};

	createChatInput.addEventListener('input', syncChatInputState);
	syncChatInputState();
}
