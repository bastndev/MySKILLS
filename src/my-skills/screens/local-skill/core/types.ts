export type LocalSkillKind = 'file' | 'folder';

export interface LocalSkill {
	id: string;
	name: string;
	source: string;
	kind: LocalSkillKind;
	icon?: string;
	enabled: boolean;
	installedAt: number;
}

export interface LocalSkillsUpdateMessage {
	type: 'localSkills.update';
	skills: LocalSkill[];
}

export interface LocalSkillsRequestMessage {
	type: 'localSkills.request';
}

export interface LocalSkillSetEnabledMessage {
	type: 'localSkill.setEnabled';
	id: string;
	enabled: boolean;
}
