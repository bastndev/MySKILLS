import * as vscode from 'vscode';
import * as fs from 'fs';

export class MySkillsViewProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'myskills-panel';
	private _view?: vscode.WebviewView;

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
			const viewPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'screens', 'my-skill', 'ui', 'view.html').fsPath;
			const installPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'screens', 'install-skill', 'ui', 'install.html').fsPath;
			const createPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'screens', 'create-skill', 'ui', 'create.html').fsPath;

			// ── Install sub-panels ────────────────────────────────────────
			const alltimePath  = vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'screens', 'install-skill', 'ui', 'panels', 'alltime-skill',  'alltime.html').fsPath;
			const trendingPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'screens', 'install-skill', 'ui', 'panels', 'trending-skill', 'trending.html').fsPath;
			const officialPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'screens', 'install-skill', 'ui', 'panels', 'official-skill', 'official.html').fsPath;

			const viewHtml     = fs.readFileSync(viewPath, 'utf8');
			let   installHtml  = fs.readFileSync(installPath, 'utf8');
			const createHtml   = fs.readFileSync(createPath, 'utf8');

			const alltimeHtml  = fs.readFileSync(alltimePath,  'utf8');
			const trendingHtml = fs.readFileSync(trendingPath, 'utf8');
			const officialHtml = fs.readFileSync(officialPath, 'utf8');

			// Substitute sub-panel placeholders inside the install shell
			installHtml = installHtml.replace('<!-- ALLTIME_PANEL -->',  alltimeHtml);
			installHtml = installHtml.replace('<!-- TRENDING_PANEL -->', trendingHtml);
			installHtml = installHtml.replace('<!-- OFFICIAL_PANEL -->', officialHtml);

			const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.js'));
			const createScriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'dist', 'create-skill.js'));
			const createLogoUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'assets', 'svg', 'logo-animated.svg'));
			const globalUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'view', 'styles', 'global.css'));
			const viewStyleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'screens', 'my-skill', 'ui', 'view.css'));
			const installStyleUri  = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'screens', 'install-skill', 'ui', 'install.css'));
			const officialStyleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'screens', 'install-skill', 'ui', 'panels', 'official-skill', 'official.css'));
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
			html = html.replace('<!-- STYLES -->', `<link href="${globalUri}" rel="stylesheet"><link href="${viewStyleUri}" rel="stylesheet"><link href="${installStyleUri}" rel="stylesheet"><link href="${officialStyleUri}" rel="stylesheet"><link href="${createStyleUri}" rel="stylesheet">`);
			html = html.replace('<!-- VIEW_PANEL -->', viewHtml);
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

	public dispose() {
		this._view = undefined;
	}
}

function getNonce(): string {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 64; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
