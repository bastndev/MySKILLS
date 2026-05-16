const tutorialButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('.create-guide-tutorial'));

tutorialButtons.forEach(button => {
	button.addEventListener('click', () => {
		const topic = button.dataset.guideTopic;
		const label = topic ? `Tutorial topic selected: ${topic}` : 'Tutorial topic selected';

		button.setAttribute('aria-label', label);
	});
});
