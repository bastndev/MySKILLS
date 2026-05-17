import * as vscode from 'vscode';
import { ROOT_SKILL_FILES, ROOT_SKILL_FILE_ICON, ROOT_SKILL_FILE_NAMES } from './file-folder/file-skills';
import { ROOT_SKILL_FOLDERS, ROOT_SKILL_FOLDER_WATCH_PATTERNS } from './file-folder/folder-skills';
import type { LocalSkill } from './types';

export { ROOT_SKILL_FILE_NAMES };
export { ROOT_SKILL_FOLDER_WATCH_PATTERNS };
const GITIGNORE_FILE = '.gitignore';
const BLOCK_BEGIN = '# My Skills: begin';
const BLOCK_END = '# My Skills: end';
const SKILL_MANIFEST_FILE = 'SKILL.md';
const SKILL_FOLDER_NAME_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?$/;

interface GitignoreBlock {
	lines: string[];
	startIndex: number;
	endIndex: number;
}

interface GitignoreText {
	content: string;
	eol: '\n' | '\r\n';
}

export async function getWorkspaceRootSkills(): Promise<LocalSkill[]> {
	const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
	if (!workspaceFolder) {
		return [];
	}

	const disabledSkills = await getDisabledSkillIds(workspaceFolder.uri);
	const fileChecks = ROOT_SKILL_FILES.map(async (fileName): Promise<LocalSkill | undefined> => {
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
				kind: 'file',
				icon: ROOT_SKILL_FILE_ICON,
				enabled: !disabledSkills.has(fileName),
				installedAt: stat.mtime,
			};
		} catch {
			return undefined;
		}
	});
	const folderChecks = ROOT_SKILL_FOLDERS.map(folder => getWorkspaceFolderSkills(workspaceFolder, folder, disabledSkills));

	const [fileResults, folderResults] = await Promise.all([
		Promise.all(fileChecks),
		Promise.all(folderChecks),
	]);

	return [
		...fileResults.filter((skill): skill is LocalSkill => Boolean(skill)),
		...folderResults.flat(),
	];
}

export async function setWorkspaceRootSkillEnabled(skillId: string, enabled: boolean): Promise<void> {
	if (!isSupportedSkillId(skillId)) {
		return;
	}

	const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
	if (!workspaceFolder) {
		return;
	}

	const gitignoreUri = vscode.Uri.joinPath(workspaceFolder.uri, GITIGNORE_FILE);
	const text = await readGitignoreText(gitignoreUri);
	const nextContent = updateGitignoreSkillState(text.content, skillId, enabled, text.eol);

	if (nextContent === text.content) {
		return;
	}

	await vscode.workspace.fs.writeFile(gitignoreUri, new TextEncoder().encode(nextContent));
}

async function getWorkspaceFolderSkills(
	workspaceFolder: vscode.WorkspaceFolder,
	folder: typeof ROOT_SKILL_FOLDERS[number],
	disabledSkills: Set<string>,
): Promise<LocalSkill[]> {
	const folderUri = vscode.Uri.joinPath(workspaceFolder.uri, ...folder.split('/'));

	try {
		const entries = await vscode.workspace.fs.readDirectory(folderUri);
		const checks = entries
			.filter(([name, type]) => type === vscode.FileType.Directory && isValidSkillFolderName(name))
			.map(async ([name]): Promise<LocalSkill | undefined> => {
				const id = `${folder}/${name}`;
				const uri = vscode.Uri.joinPath(folderUri, name);

				try {
					const [stat, hasManifest] = await Promise.all([
						vscode.workspace.fs.stat(uri),
						hasSkillManifest(uri),
					]);
					if (!hasManifest) {
						return undefined;
					}

					return {
						id,
						name,
						source: `${workspaceFolder.name}/${folder}`,
						kind: 'folder',
						enabled: !disabledSkills.has(id),
						installedAt: stat.mtime,
					};
				} catch {
					return undefined;
				}
			});
		const results = await Promise.all(checks);
		return results.filter((skill): skill is LocalSkill => Boolean(skill));
	} catch {
		return [];
	}
}

async function hasSkillManifest(folderUri: vscode.Uri): Promise<boolean> {
	try {
		const stat = await vscode.workspace.fs.stat(vscode.Uri.joinPath(folderUri, SKILL_MANIFEST_FILE));
		return stat.type === vscode.FileType.File;
	} catch {
		return false;
	}
}

async function getDisabledSkillIds(workspaceUri: vscode.Uri): Promise<Set<string>> {
	const text = await readGitignoreText(vscode.Uri.joinPath(workspaceUri, GITIGNORE_FILE));
	const block = findGitignoreBlock(text.content);
	const disabled = new Set<string>();

	if (!block) {
		return disabled;
	}

	for (const line of block.lines) {
		const parsed = parseManagedSkillLine(line);
		if (parsed && !parsed.commented) {
			disabled.add(parsed.skillId);
		}
	}

	return disabled;
}

function updateGitignoreSkillState(content: string, skillId: string, enabled: boolean, eol: '\n' | '\r\n'): string {
	const normalizedContent = normalizeLineEndings(content);
	const block = findGitignoreBlock(normalizedContent);

	if (!block) {
		if (enabled) {
			return normalizedContent;
		}

		return withLineEndings(appendManagedBlock(normalizedContent, skillId), eol);
	}

	const nextLines = [...block.lines];
	const existingIndex = nextLines.findIndex(line => parseManagedSkillLine(line)?.skillId === skillId);
	const nextLine = enabled ? `# ${skillId}` : skillId;

	if (existingIndex === -1) {
		nextLines.push(nextLine);
	} else {
		nextLines[existingIndex] = nextLine;
	}

	const allLines = splitLines(normalizedContent);
	allLines.splice(block.startIndex + 1, block.lines.length, ...nextLines);
	return withLineEndings(formatManagedBlockSpacing(allLines).join('\n'), eol);
}

function appendManagedBlock(content: string, skillId: string): string {
	const prefix = content.trim().length === 0
		? ''
		: content.endsWith('\n\n') ? content : content.endsWith('\n') ? `${content}\n` : `${content}\n\n`;

	return `${prefix}${BLOCK_BEGIN}\n${skillId}\n${BLOCK_END}\n`;
}

function findGitignoreBlock(content: string): GitignoreBlock | undefined {
	const lines = splitLines(content);
	const startIndex = lines.findIndex(line => line.trim() === BLOCK_BEGIN);
	if (startIndex === -1) {
		return undefined;
	}

	const endIndex = lines.findIndex((line, index) => index > startIndex && line.trim() === BLOCK_END);
	if (endIndex === -1) {
		return undefined;
	}

	return {
		lines: lines.slice(startIndex + 1, endIndex),
		startIndex,
		endIndex,
	};
}

function parseManagedSkillLine(line: string): { skillId: string; commented: boolean } | undefined {
	const trimmed = line.trim();
	const commented = trimmed.startsWith('#');
	const candidate = commented ? trimmed.slice(1).trim() : trimmed;

	if (!isSupportedSkillId(candidate)) {
		return undefined;
	}

	return { skillId: candidate, commented };
}

async function readGitignoreText(uri: vscode.Uri): Promise<GitignoreText> {
	try {
		const bytes = await vscode.workspace.fs.readFile(uri);
		const content = new TextDecoder().decode(bytes);
		return {
			content,
			eol: content.includes('\r\n') ? '\r\n' : '\n',
		};
	} catch {
		return { content: '', eol: '\n' };
	}
}

function splitLines(content: string): string[] {
	const normalizedContent = normalizeLineEndings(content);
	if (normalizedContent.length === 0) {
		return [];
	}

	return normalizedContent.replace(/\n$/, '').split('\n');
}

function normalizeLineEndings(content: string): string {
	return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function withLineEndings(content: string, eol: '\n' | '\r\n'): string {
	return eol === '\n' ? content : content.replace(/\n/g, eol);
}

function formatManagedBlockSpacing(lines: string[]): string[] {
	const startIndex = lines.findIndex(line => line.trim() === BLOCK_BEGIN);
	if (startIndex === -1) {
		return [...lines, ''];
	}

	const nextLines = [...lines];
	if (startIndex > 0 && nextLines[startIndex - 1] !== '') {
		nextLines.splice(startIndex, 0, '');
	}

	const adjustedStartIndex = nextLines.findIndex(line => line.trim() === BLOCK_BEGIN);
	const endIndex = nextLines.findIndex((line, index) => index > adjustedStartIndex && line.trim() === BLOCK_END);
	if (endIndex !== -1 && nextLines[endIndex + 1] !== '') {
		nextLines.splice(endIndex + 1, 0, '');
	}

	while (nextLines.length > 0 && nextLines[nextLines.length - 1] === '') {
		nextLines.pop();
	}

	return [...nextLines, ''];
}

function isRootSkillFile(value: string): value is typeof ROOT_SKILL_FILES[number] {
	return ROOT_SKILL_FILES.some(fileName => fileName === value);
}

function isRootSkillFolder(value: string): boolean {
	return ROOT_SKILL_FOLDERS.some(folder => value.startsWith(`${folder}/`) && value.length > folder.length + 1);
}

function isValidSkillFolderName(value: string): boolean {
	return SKILL_FOLDER_NAME_PATTERN.test(value)
		&& !value.includes('..')
		&& !value.includes('--')
		&& !value.includes('__')
		&& !value.includes('._')
		&& !value.includes('_.')
		&& !value.includes('.-')
		&& !value.includes('-.')
		&& !value.includes('_-')
		&& !value.includes('-_');
}

function isSupportedSkillId(value: string): boolean {
	return isRootSkillFile(value) || isRootSkillFolder(value);
}
