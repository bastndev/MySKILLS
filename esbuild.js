const esbuild = require("esbuild");

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
	name: 'esbuild-problem-matcher',

	setup(build) {
		build.onStart(() => {
			console.log('[watch] build started');
		});
		build.onEnd((result) => {
			result.errors.forEach(({ text, location }) => {
				console.error(`✘ [ERROR] ${text}`);
				console.error(`    ${location.file}:${location.line}:${location.column}:`);
			});
			console.log('[watch] build finished');
		});
	},
};

async function main() {
	const ctxExtension = await esbuild.context({
		entryPoints: ['src/extension.ts'],
		bundle: true,
		format: 'cjs',
		minify: production,
		sourcemap: !production,
		sourcesContent: false,
		platform: 'node',
		outfile: 'dist/extension.js',
		external: ['vscode'],
		logLevel: 'silent',
		plugins: [esbuildProblemMatcherPlugin],
	});

	const ctxWebview = await esbuild.context({
		entryPoints: ['src/my-skills/view/index.ts'],
		bundle: true,
		format: 'iife',
		minify: production,
		sourcemap: !production,
		sourcesContent: false,
		platform: 'browser',
		outfile: 'dist/webview.js',
		logLevel: 'silent',
		plugins: [esbuildProblemMatcherPlugin],
	});

	const ctxCreateSkill = await esbuild.context({
		entryPoints: ['src/my-skills/screens/create-skill/ui/create.ts'],
		bundle: true,
		format: 'iife',
		minify: production,
		sourcemap: !production,
		sourcesContent: false,
		platform: 'browser',
		outfile: 'dist/create-skill.js',
		logLevel: 'silent',
		plugins: [esbuildProblemMatcherPlugin],
	});

	const ctxCreateSkillSupport = await esbuild.context({
		entryPoints: ['src/my-skills/screens/create-skill/support/support.ts'],
		bundle: true,
		format: 'iife',
		minify: production,
		sourcemap: !production,
		sourcesContent: false,
		platform: 'browser',
		outfile: 'dist/create-skill-support.js',
		logLevel: 'silent',
		plugins: [esbuildProblemMatcherPlugin],
	});

	if (watch) {
		await Promise.all([ctxExtension.watch(), ctxWebview.watch(), ctxCreateSkill.watch(), ctxCreateSkillSupport.watch()]);
	} else {
		await Promise.all([ctxExtension.rebuild(), ctxWebview.rebuild(), ctxCreateSkill.rebuild(), ctxCreateSkillSupport.rebuild()]);
		await ctxExtension.dispose();
		await ctxWebview.dispose();
		await ctxCreateSkill.dispose();
		await ctxCreateSkillSupport.dispose();
	}
}

main().catch(e => {
	console.error(e);
	process.exit(1);
});
