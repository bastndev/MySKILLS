import * as vscode from 'vscode';
import * as fs from 'fs';

export class MySkillsViewProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'myskills-panel';

	constructor(
		private readonly _extensionUri: vscode.Uri,
	) { }

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this._extensionUri],
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
	}

	private _getHtmlForWebview(webview: vscode.Webview): string {
		const htmlPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'view', 'ui', 'view.html').fsPath;
		let html = fs.readFileSync(htmlPath, 'utf8');

		const installPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'install-skill', 'ui', 'install.html').fsPath;
		const createPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'create-skill', 'ui', 'create.html').fsPath;
		let installHtml = fs.existsSync(installPath) ? fs.readFileSync(installPath, 'utf8') : '';
		let createHtml = fs.existsSync(createPath) ? fs.readFileSync(createPath, 'utf8') : '';

		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.js'));
		const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'view', 'ui', 'view.css'));
		const installStyleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'install-skill', 'ui', 'install.css'));
		const createStyleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'create-skill', 'ui', 'create.css'));
		const globalUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'shared', 'styles', 'global.css'));

		html = html.replace('<!-- STYLES -->', `<link href="${globalUri}" rel="stylesheet"><link href="${styleUri}" rel="stylesheet"><link href="${installStyleUri}" rel="stylesheet"><link href="${createStyleUri}" rel="stylesheet">`);
		html = html.replace('<!-- INSTALL_PANEL -->', installHtml);
		html = html.replace('<!-- CREATE_PANEL -->', createHtml);
		html = html.replace('<!-- SCRIPTS -->', `<script src="${scriptUri}"></script>`);

		return html;
	}
}