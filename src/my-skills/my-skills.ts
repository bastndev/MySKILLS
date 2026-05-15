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

		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.js'));
		const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'view', 'ui', 'view.css'));

		html = html.replace('<!-- STYLES -->', `<link href="${styleUri}" rel="stylesheet">`);
		html = html.replace('<!-- SCRIPTS -->', `<script src="${scriptUri}"></script>`);

		return html;
	}
}