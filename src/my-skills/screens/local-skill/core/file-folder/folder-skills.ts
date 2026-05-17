export const ROOT_SKILL_FOLDERS = [
	'.agents/skills',
] as const;

export const ROOT_SKILL_FOLDER_WATCH_PATTERNS: readonly string[] = ROOT_SKILL_FOLDERS.flatMap(folder => [
	folder,
	`${folder}/*`,
	`${folder}/*/SKILL.md`,
]);
