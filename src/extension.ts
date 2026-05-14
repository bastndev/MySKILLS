import * as vscode from 'vscode';
import { YouTubeMusicViewProvider } from './myskills/focus';
import { MySkillsViewProvider } from './myskills/myskills';

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "rene" is now active!');

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			'rene-yt-music-view',
			new YouTubeMusicViewProvider(context.extensionUri),
			{ webviewOptions: { retainContextWhenHidden: true } }
		),
		vscode.window.registerWebviewViewProvider(
			MySkillsViewProvider.viewType,
			new MySkillsViewProvider(context.extensionUri),
			{ webviewOptions: { retainContextWhenHidden: true } }
		)
	);
}

// On deactivate
export function deactivate() { }
