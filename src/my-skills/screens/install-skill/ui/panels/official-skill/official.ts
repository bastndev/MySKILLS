const SKILLS = [
	'anthropics.png', 'apollographql.png', 'auth0.png', 'browserbase.png',
	'callstackincubator.png', 'clickhouse.png', 'cloudflare.png', 'coderabbitai.png',
	'composiohq.png', 'datadog-labs.png', 'duckdb.png', 'expo.png', 'figma.png',
	'firebase.png', 'firecrawl.png', 'flutter.png', 'getsentry.png', 'google-gemini.png',
	'google-labs-code.png', 'googleworkspace.png', 'greensock.png', 'hashicorp.png',
	'huggingface.png', 'makenotion.png', 'microsoft.png', 'minimax-ai.png',
	'mongodb.png', 'neondatabase.png', 'netlify.png', 'openai.png', 'remotion-dev.png',
	'replicate.png', 'stripe.png', 'supabase.png', 'tinybirdco.png', 'typefully.png',
	'voltagent.png'
];

export function initOfficialPanel() {
	const grid = document.getElementById('official-grid');
	if (!grid) {return;}

	const baseUri = grid.dataset.baseUri;

	SKILLS.forEach(filename => {
		const name = filename.replace('.png', '');
		const card = document.createElement('div');
		card.className = 'official-card';
		
		// Create a clean display name
		let displayName = name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
		card.title = displayName;
		
		const img = document.createElement('img');
		img.className = 'official-card-icon';
		img.src = `${baseUri}/${filename}`;
		img.alt = displayName;
		img.loading = 'lazy';
		
		card.appendChild(img);
		grid.appendChild(card);

		card.addEventListener('click', () => {
			grid.querySelectorAll('.official-card').forEach(c => c.classList.remove('selected'));
			card.classList.add('selected');
		});
	});

	grid.addEventListener('mousemove', (e) => {
		const cards = grid.querySelectorAll('.official-card');
		cards.forEach((card) => {
			const rect = card.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;
			
			(card as HTMLElement).style.setProperty('--mouse-x', `${x}px`);
			(card as HTMLElement).style.setProperty('--mouse-y', `${y}px`);
		});
	});
}
