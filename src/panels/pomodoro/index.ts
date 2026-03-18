import * as vscode from 'vscode';

export const pomodoroProvider: vscode.TreeDataProvider<string> = {
	getChildren: () => ['Hello Pomodoro'],
	getTreeItem: (item: string) => ({
		label: item,
		tooltip: item,
		iconPath: new vscode.ThemeIcon('clock')
	})
};
