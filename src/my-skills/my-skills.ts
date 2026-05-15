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
		let html = fs.readFileSync(shellPath, 'utf8');

		const viewPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'screens', 'my-skill', 'ui', 'view.html').fsPath;
		const installPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'screens', 'install-skill', 'ui', 'install.html').fsPath;
		const createPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'screens', 'create-skill', 'ui', 'create.html').fsPath;

		const viewHtml = fs.readFileSync(viewPath, 'utf8');
		const installHtml = fs.readFileSync(installPath, 'utf8');
		const createHtml = fs.readFileSync(createPath, 'utf8');

		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.js'));
		const globalUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'view', 'styles', 'global.css'));
		const viewStyleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'screens', 'my-skill', 'ui', 'view.css'));
		const installStyleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'screens', 'install-skill', 'ui', 'install.css'));
		const createStyleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'screens', 'create-skill', 'ui', 'create.css'));

		const csp = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} https:; font-src ${webview.cspSource};">`;

		html = html.replace('<!-- CSP -->', csp);
		html = html.replace('<!-- STYLES -->', `<link href="${globalUri}" rel="stylesheet"><link href="${viewStyleUri}" rel="stylesheet"><link href="${installStyleUri}" rel="stylesheet"><link href="${createStyleUri}" rel="stylesheet">`);
		html = html.replace('<!-- VIEW_PANEL -->', viewHtml);
		html = html.replace('<!-- INSTALL_PANEL -->', installHtml);
		html = html.replace('<!-- CREATE_PANEL -->', createHtml);
		html = html.replace('<!-- SCRIPTS -->', `<script nonce="${nonce}" src="${scriptUri}"></script>`);

		return html;
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
