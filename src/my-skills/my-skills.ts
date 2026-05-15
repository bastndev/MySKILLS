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
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this._extensionUri],
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
	}

	public switchTab(target: string) {
		if (this._view) {
			this._view.webview.postMessage({ type: 'switch-tab', target });
		}
	}

	private _getHtmlForWebview(webview: vscode.Webview): string {
		const htmlPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'shared', 'components', 'slider-menu', 'slider-menu.html').fsPath;
		let html = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, 'utf8') : '';

		const viewPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'view', 'ui', 'view.html').fsPath;
		const installPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'install-skill', 'ui', 'install.html').fsPath;
		const createPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'create-skill', 'ui', 'create.html').fsPath;
		
		let viewHtml = fs.existsSync(viewPath) ? fs.readFileSync(viewPath, 'utf8') : '';
		let installHtml = fs.existsSync(installPath) ? fs.readFileSync(installPath, 'utf8') : '';
		let createHtml = fs.existsSync(createPath) ? fs.readFileSync(createPath, 'utf8') : '';

		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.js'));
		const globalUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'shared', 'styles', 'global.css'));
		const sliderStyleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'shared', 'components', 'slider-menu', 'slider-menu.css'));
		const viewStyleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'view', 'ui', 'view.css'));
		const installStyleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'install-skill', 'ui', 'install.css'));
		const createStyleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'my-skills', 'create-skill', 'ui', 'create.css'));

		html = html.replace('<!-- STYLES -->', `<link href="${globalUri}" rel="stylesheet"><link href="${sliderStyleUri}" rel="stylesheet"><link href="${viewStyleUri}" rel="stylesheet"><link href="${installStyleUri}" rel="stylesheet"><link href="${createStyleUri}" rel="stylesheet">`);
		html = html.replace('<!-- VIEW_PANEL -->', viewHtml);
		html = html.replace('<!-- INSTALL_PANEL -->', installHtml);
		html = html.replace('<!-- CREATE_PANEL -->', createHtml);
		html = html.replace('<!-- SCRIPTS -->', `<script src="${scriptUri}"></script>`);

		return html;
	}
}