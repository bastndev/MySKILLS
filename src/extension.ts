// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { oneGameProvider, pomodoroProvider, ytMusicProvider } from './panels';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "rene" is now active!');

	context.subscriptions.push(
		vscode.window.registerTreeDataProvider(
			'rene-one-game-view',
			oneGameProvider
		),
		vscode.window.registerTreeDataProvider(
			'rene-pomodoro-view',
			pomodoroProvider
		),
		vscode.window.registerTreeDataProvider(
			'rene-yt-music-view',
			ytMusicProvider
		)
	);

	// El comando existe pero no muestra nada (limpio)
	const disposable = vscode.commands.registerCommand('rene.helloWorld', () => {
		// Comando silencioso por ahora
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }
