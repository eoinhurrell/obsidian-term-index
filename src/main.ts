import { Plugin, TFolder, Notice, FuzzySuggestModal } from 'obsidian';
import { TermIndexSettings, DEFAULT_SETTINGS, TermIndexSettingTab } from './settings';
import { generateIndex } from './generator';

/** Modal for selecting a folder */
class FolderSuggestModal extends FuzzySuggestModal<TFolder> {
	folders: TFolder[];
	onChoose: (folder: TFolder) => void;

	constructor(app: any, folders: TFolder[], onChoose: (folder: TFolder) => void) {
		super(app);
		this.folders = folders;
		this.onChoose = onChoose;
	}

	getItems(): TFolder[] {
		return this.folders;
	}

	getItemText(folder: TFolder): string {
		return folder.path;
	}

	onChooseItem(folder: TFolder): void {
		this.onChoose(folder);
	}
}

export default class TermIndexPlugin extends Plugin {
	settings: TermIndexSettings;

	async onload(): Promise<void> {
		await this.loadSettings();

		// Add settings tab
		this.addSettingTab(new TermIndexSettingTab(this.app, this));

		// Command: Generate Vault Index
		this.addCommand({
			id: 'generate-vault-index',
			name: 'Generate Vault Index',
			callback: () => this.generateVaultIndex(),
		});

		// Command: Generate Folder Index (with picker)
		this.addCommand({
			id: 'generate-folder-index',
			name: 'Generate Folder Index',
			callback: () => this.promptFolderIndex(),
		});

		// Folder context menu
		this.registerEvent(
			this.app.workspace.on('file-menu', (menu, file) => {
				if (file instanceof TFolder) {
					menu.addItem((item) => {
						item
							.setTitle('Generate Term Index')
							.setIcon('list-ordered')
							.onClick(() => this.generateFolderIndex(file.path));
					});
				}
			})
		);

		console.log('Term Index plugin loaded');
	}

	onunload(): void {
		console.log('Term Index plugin unloaded');
	}

	async generateVaultIndex(): Promise<void> {
		const notice = new Notice('Generating vault index...', 0);
		try {
			const result = await generateIndex(this.app.vault, null, this.settings);
			notice.hide();
			new Notice(`Vault index generated: ${result.termCount} terms from ${result.fileCount} files`);
		} catch (e) {
			notice.hide();
			new Notice(`Error generating index: ${(e as Error).message}`);
			console.error('Term Index error:', e);
		}
	}

	promptFolderIndex(): void {
		// Get all folders in vault
		const folders: TFolder[] = [];
		const rootFolder = this.app.vault.getRoot();

		const collectFolders = (folder: TFolder) => {
			folders.push(folder);
			for (const child of folder.children) {
				if (child instanceof TFolder) {
					collectFolders(child);
				}
			}
		};

		for (const child of rootFolder.children) {
			if (child instanceof TFolder) {
				collectFolders(child);
			}
		}

		if (folders.length === 0) {
			new Notice('No folders found in vault');
			return;
		}

		new FolderSuggestModal(this.app, folders, (folder) => {
			this.generateFolderIndex(folder.path);
		}).open();
	}

	async generateFolderIndex(folderPath: string): Promise<void> {
		const notice = new Notice(`Generating index for ${folderPath}...`, 0);
		try {
			const result = await generateIndex(this.app.vault, folderPath, this.settings);
			notice.hide();
			new Notice(`Index generated: ${result.termCount} terms from ${result.fileCount} files`);
		} catch (e) {
			notice.hide();
			new Notice(`Error generating index: ${(e as Error).message}`);
			console.error('Term Index error:', e);
		}
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
