import { App, PluginSettingTab, Setting } from 'obsidian';
import type TermIndexPlugin from './main';

export interface TermIndexSettings {
	topN: number;
	minOccurrences: number;
	excludedFolders: string[];
}

export const DEFAULT_SETTINGS: TermIndexSettings = {
	topN: 250,
	minOccurrences: 10,
	excludedFolders: [],
};

export class TermIndexSettingTab extends PluginSettingTab {
	plugin: TermIndexPlugin;

	constructor(app: App, plugin: TermIndexPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'Term Index Settings' });

		new Setting(containerEl)
			.setName('Maximum terms')
			.setDesc('Maximum number of terms to include in the index (default: 250)')
			.addText((text) =>
				text
					.setPlaceholder('250')
					.setValue(String(this.plugin.settings.topN))
					.onChange(async (value) => {
						const num = parseInt(value, 10);
						if (!isNaN(num) && num > 0) {
							this.plugin.settings.topN = num;
							await this.plugin.saveSettings();
						}
					})
			);

		new Setting(containerEl)
			.setName('Minimum occurrences')
			.setDesc('Terms must appear at least this many times total (default: 10)')
			.addText((text) =>
				text
					.setPlaceholder('10')
					.setValue(String(this.plugin.settings.minOccurrences))
					.onChange(async (value) => {
						const num = parseInt(value, 10);
						if (!isNaN(num) && num > 0) {
							this.plugin.settings.minOccurrences = num;
							await this.plugin.saveSettings();
						}
					})
			);

		new Setting(containerEl)
			.setName('Excluded folders')
			.setDesc('Comma-separated folder paths to exclude (e.g., "templates, daily")')
			.addText((text) =>
				text
					.setPlaceholder('templates, daily-notes')
					.setValue(this.plugin.settings.excludedFolders.join(', '))
					.onChange(async (value) => {
						this.plugin.settings.excludedFolders = value
							.split(',')
							.map((s) => s.trim())
							.filter((s) => s.length > 0);
						await this.plugin.saveSettings();
					})
			);
	}
}
