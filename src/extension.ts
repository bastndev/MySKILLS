import * as vscode from 'vscode';
import { MySkillsViewProvider } from './my-skills/my-skills';

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "myskills" is now active!');

	const provider = new MySkillsViewProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			MySkillsViewProvider.viewType,
			provider,
			{ webviewOptions: { retainContextWhenHidden: true } }
		)
	);
}

// On deactivate
export function deactivate() { }
