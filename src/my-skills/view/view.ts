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
		// Read the HTML file from disk
		const htmlPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'ui', 'index.html').fsPath;
		let html = fs.readFileSync(htmlPath, 'utf8');

		// Generate Webview URIs for CSS and compiled JS
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.js'));
		const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'ui', 'global.css'));

		// Inject them into the HTML placeholders
		html = html.replace('<!-- STYLES -->', `<link href="${styleUri}" rel="stylesheet">`);
		html = html.replace('<!-- SCRIPTS -->', `<script src="${scriptUri}"></script>`);

		return html;
	}
}
