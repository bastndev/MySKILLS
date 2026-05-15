import * as vscode from 'vscode';
import { MySkillsViewProvider } from './my-skills';

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "myskills" is now active!');

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			MySkillsViewProvider.viewType,
			new MySkillsViewProvider(context.extensionUri),
			{ webviewOptions: { retainContextWhenHidden: true } }
		)
	);
}

// On deactivate
export function deactivate() { }
