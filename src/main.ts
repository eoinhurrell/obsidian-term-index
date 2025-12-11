import { Plugin } from 'obsidian';
import { TermIndexSettings, DEFAULT_SETTINGS, TermIndexSettingTab } from './settings';

export default class TermIndexPlugin extends Plugin {
	settings: TermIndexSettings;

	async onload(): Promise<void> {
		await this.loadSettings();

		// Add settings tab
		this.addSettingTab(new TermIndexSettingTab(this.app, this));

		// Commands will be added here in Phase 5
		// Placeholder for: Generate Vault Index
		// Placeholder for: Generate Folder Index
		// Placeholder for: Folder context menu

		console.log('Term Index plugin loaded');
	}

	onunload(): void {
		console.log('Term Index plugin unloaded');
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
