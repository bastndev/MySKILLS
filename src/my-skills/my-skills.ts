import * as vscode from 'vscode';
import * as fs from 'fs';

export class MySkillsViewProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'myskills-panel';
	private _view?: vscode.WebviewView;
	private _supportPanel?: vscode.WebviewPanel;

	constructor(
		private readonly _extensionUri: vscode.Uri,
	) { }

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this._view = webviewView;

		const nonce = getNonce();

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this._extensionUri],
		};

		webviewView.webview.onDidReceiveMessage(message => {
			if (isWebviewMessage(message) && message.type === 'createSkill.openSupport') {
				this._openCreateSkillSupport();
			}
		});

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview, nonce);
	}

	public switchTab(target: string) {
		if (this._view) {
			this._view.webview.postMessage({ type: 'switch-tab', target });
		}
	}

	private _getHtmlForWebview(webview: vscode.Webview, nonce: string): string {
		const shellPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'view', 'index.html').fsPath;

		let html: string;
		try {
			html = fs.readFileSync(shellPath, 'utf8');
		} catch (err) {
			console.error(`[MySkills] Failed to read shell HTML: ${err}`);
			return this._errorHtml('Failed to load shell template');
		}

		try {
			const localPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'screens', 'local-skill', 'ui', 'local.html').fsPath;
			const installPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'screens', 'install-skill', 'ui', 'install.html').fsPath;
			const createPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'screens', 'create-skill', 'ui', 'create.html').fsPath;

			// ── Install sub-panels ────────────────────────────────────────
			const alltimePath  = vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'screens', 'install-skill', 'ui', 'panels', 'alltime-skill',  'alltime.html').fsPath;
			const trendingPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'screens', 'install-skill', 'ui', 'panels', 'trending-skill', 'trending.html').fsPath;
			const officialPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'screens', 'install-skill', 'ui', 'panels', 'official-skill', 'official.html').fsPath;
			const searchPath   = vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'screens', 'install-skill', 'ui', 'search', 'search.html').fsPath;

			let localHtml      = fs.readFileSync(localPath, 'utf8');
			let   installHtml  = fs.readFileSync(installPath, 'utf8');
			const createHtml   = fs.readFileSync(createPath, 'utf8');

			const alltimeHtml  = fs.readFileSync(alltimePath,  'utf8');
			const trendingHtml = fs.readFileSync(trendingPath, 'utf8');
			let officialHtml = fs.readFileSync(officialPath, 'utf8');
			const searchHtml   = fs.readFileSync(searchPath, 'utf8');

			const officialListPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'screens', 'install-skill', 'ui', 'panels', 'official-skill', 'list-skill', 'list.html').fsPath;
			const officialListHtml = fs.readFileSync(officialListPath, 'utf8');

			const officialImagesUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'assets', 'images', 'official'));
			officialHtml = officialHtml.replace('{{OFFICIAL_IMAGES_URI}}', officialImagesUri.toString());
			officialHtml = officialHtml.replace('<!-- OFFICIAL_LIST_PANEL -->', officialListHtml);

			// Substitute sub-panel placeholders inside the install shell
			installHtml = installHtml.replace('<!-- ALLTIME_PANEL -->',  alltimeHtml);
			installHtml = installHtml.replace('<!-- TRENDING_PANEL -->', trendingHtml);
			installHtml = installHtml.replace('<!-- OFFICIAL_PANEL -->', officialHtml);
			installHtml = installHtml.replace('<!-- SEARCH_PANEL -->', searchHtml);
			localHtml = localHtml.replaceAll('{{LOCAL_WORKSPACE_NAME}}', escapeHtml(getWorkspaceName()));

			const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.js'));
			const createScriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'dist', 'create-skill.js'));
			const createLogoUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'assets', 'svg', 'logo-animated.svg'));
			const globalUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'view', 'styles', 'global.css'));
			const localStyleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'screens', 'local-skill', 'ui', 'local.css'));
			const installStyleUri  = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'screens', 'install-skill', 'ui', 'install.css'));
			const officialStyleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'screens', 'install-skill', 'ui', 'panels', 'official-skill', 'official.css'));
			const searchStyleUri   = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'screens', 'install-skill', 'ui', 'search', 'search.css'));
			const createStyleUri   = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'screens', 'create-skill', 'ui', 'create.css'));
			const createPanelHtml = createHtml.replace('{{CREATE_LOGO_URI}}', createLogoUri.toString());

			const csp = [
				`<meta http-equiv="Content-Security-Policy" content="`,
				`default-src 'none';`,
				`base-uri 'none';`,
				`form-action 'none';`,
				`object-src 'none';`,
				`style-src ${webview.cspSource};`,
				`script-src 'nonce-${nonce}';`,
				`img-src ${webview.cspSource};`,
				`font-src ${webview.cspSource};`,
				`">`,
			].join(' ');

			html = html.replace('<!-- CSP -->', csp);
			html = html.replace('<!-- STYLES -->', `<link href="${globalUri}" rel="stylesheet"><link href="${localStyleUri}" rel="stylesheet"><link href="${installStyleUri}" rel="stylesheet"><link href="${officialStyleUri}" rel="stylesheet"><link href="${searchStyleUri}" rel="stylesheet"><link href="${createStyleUri}" rel="stylesheet">`);
			html = html.replace('<!-- LOCAL_PANEL -->', localHtml);
			html = html.replace('<!-- INSTALL_PANEL -->', installHtml); // already has sub-panels injected above
			html = html.replace('<!-- CREATE_PANEL -->', createPanelHtml);
			html = html.replace('<!-- SCRIPTS -->', `<script nonce="${nonce}" src="${scriptUri}"></script><script nonce="${nonce}" src="${createScriptUri}"></script>`);

			return html;
		} catch (err) {
			console.error(`[MySkills] Failed to read screen template: ${err}`);
			return this._errorHtml('Failed to load panel templates');
		}
	}

	private _errorHtml(message: string): string {
		return `<!DOCTYPE html><html><body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;color:var(--vscode-foreground,#ccc);background:var(--vscode-editor-background,#1e1e1e);"><p>${message}</p></body></html>`;
	}

	private _openCreateSkillSupport() {
		if (this._supportPanel) {
			this._supportPanel.reveal(vscode.ViewColumn.One);
			return;
		}

		const panel = vscode.window.createWebviewPanel(
			'myskills.createSupport',
			'My Skills: Support',
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				localResourceRoots: [this._extensionUri],
				retainContextWhenHidden: true,
			},
		);

		this._supportPanel = panel;
		panel.iconPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'assets', 'svg', 'logo.svg');
		panel.webview.html = this._getCreateSkillSupportHtml(panel.webview, getNonce());
		panel.onDidDispose(() => {
			this._supportPanel = undefined;
		});
	}

	private _getCreateSkillSupportHtml(webview: vscode.Webview, nonce: string): string {
		const supportPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'screens', 'create-skill', 'support', 'support.html').fsPath;

		let content: string;
		try {
			content = fs.readFileSync(supportPath, 'utf8');
		} catch (err) {
			console.error(`[MySkills] Failed to read create support template: ${err}`);
			return this._errorHtml('Failed to load create support');
		}

		const supportStyleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'screens', 'create-skill', 'support', 'support.css'));
		const supportScriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'dist', 'create-skill-support.js'));
		const supportLogoUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'assets', 'svg', 'logo-animated.svg'));
		const supportHtml = content.replace('{{CREATE_SUPPORT_LOGO_URI}}', supportLogoUri.toString());
		const csp = [
			`default-src 'none';`,
			`base-uri 'none';`,
			`form-action 'none';`,
			`object-src 'none';`,
			`style-src ${webview.cspSource};`,
			`script-src 'nonce-${nonce}';`,
			`img-src ${webview.cspSource};`,
			`font-src ${webview.cspSource};`,
		].join(' ');

		return [
			'<!DOCTYPE html>',
			'<html lang="en">',
			'<head>',
			'<meta charset="UTF-8">',
			'<meta name="viewport" content="width=device-width, initial-scale=1.0">',
			`<meta http-equiv="Content-Security-Policy" content="${csp}">`,
			'<title>My Skills: Support</title>',
			`<link href="${supportStyleUri}" rel="stylesheet">`,
			'</head>',
			'<body>',
			supportHtml,
			`<script nonce="${nonce}" src="${supportScriptUri}"></script>`,
			'</body>',
			'</html>',
		].join('');
	}

	public dispose() {
		this._view = undefined;
		this._supportPanel?.dispose();
		this._supportPanel = undefined;
	}
}

function isWebviewMessage(value: unknown): value is { type: string } {
	return Boolean(value) && typeof value === 'object' && typeof (value as { type?: unknown }).type === 'string';
}

function getNonce(): string {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 64; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

function getWorkspaceName(): string {
	return vscode.workspace.name ?? vscode.workspace.workspaceFolders?.[0]?.name ?? 'Workspace';
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}
