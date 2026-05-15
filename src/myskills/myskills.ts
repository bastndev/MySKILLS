import * as vscode from 'vscode';

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
		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>My Skills</title>
	<style>
		body {
			display: flex;
			justify-content: center;
			align-items: center;
			height: 100vh;
			margin: 0;
			color: var(--vscode-foreground);
			font-family: var(--vscode-font-family);
			font-size: 1.5rem;
		}
	</style>
</head>
<body>
	<div>Helo Skill 2</div>
</body>
</html>`;
	}
}
