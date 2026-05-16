import * as vscode from 'vscode';
import type { LocalSkill } from './types';

const ROOT_SKILL_FILES = ['AGENTS.md', 'CLAUDE.md', 'GEMINI.md', 'DESIGN.md'] as const;

export async function getWorkspaceRootSkills(): Promise<LocalSkill[]> {
	const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
	if (!workspaceFolder) {
		return [];
	}

	const checks = ROOT_SKILL_FILES.map(async (fileName): Promise<LocalSkill | undefined> => {
		const uri = vscode.Uri.joinPath(workspaceFolder.uri, fileName);

		try {
			const stat = await vscode.workspace.fs.stat(uri);
			if (stat.type !== vscode.FileType.File) {
				return undefined;
			}

			return {
				id: fileName,
				name: fileName,
				source: workspaceFolder.name,
				enabled: true,
				installedAt: stat.mtime,
			};
		} catch {
			return undefined;
		}
	});

	const results = await Promise.all(checks);
	return results.filter((skill): skill is LocalSkill => Boolean(skill));
}
