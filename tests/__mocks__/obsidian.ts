// Mock Obsidian API for testing

export class Plugin {
	app: any;
	manifest: any;

	constructor(app: any, manifest: any) {
		this.app = app;
		this.manifest = manifest;
	}

	async loadData(): Promise<any> {
		return {};
	}

	async saveData(data: any): Promise<void> {
		// Mock implementation
	}

	addCommand(command: any): void {
		// Mock implementation
	}

	addSettingTab(tab: any): void {
		// Mock implementation
	}

	registerEvent(event: any): void {
		// Mock implementation
	}
}

export class PluginSettingTab {
	app: any;
	plugin: any;
	containerEl: HTMLElement;

	constructor(app: any, plugin: any) {
		this.app = app;
		this.plugin = plugin;
		this.containerEl = document.createElement('div');
	}

	display(): void {
		// Mock implementation
	}

	hide(): void {
		// Mock implementation
	}
}

export class Setting {
	constructor(containerEl: HTMLElement) {
		// Mock implementation
	}

	setName(name: string): this {
		return this;
	}

	setDesc(desc: string): this {
		return this;
	}

	addText(cb: (text: any) => any): this {
		const textComponent = {
			setPlaceholder: (placeholder: string) => textComponent,
			setValue: (value: string) => textComponent,
			onChange: (cb: (value: string) => void) => textComponent,
		};
		cb(textComponent);
		return this;
	}

	addToggle(cb: (toggle: any) => any): this {
		return this;
	}

	addDropdown(cb: (dropdown: any) => any): this {
		return this;
	}
}

export class App {
	vault: Vault;
	workspace: Workspace;

	constructor() {
		this.vault = new Vault();
		this.workspace = new Workspace();
	}
}

export class Vault {
	getMarkdownFiles(): TFile[] {
		return [];
	}

	async cachedRead(file: TFile): Promise<string> {
		return '';
	}

	async create(path: string, content: string): Promise<TFile> {
		return new TFile();
	}

	async modify(file: TFile, content: string): Promise<void> {
		// Mock implementation
	}

	getAbstractFileByPath(path: string): TAbstractFile | null {
		return null;
	}
}

export class Workspace {
	on(name: string, callback: (...args: any[]) => any): any {
		return {};
	}
}

export class TFile {
	path: string = '';
	basename: string = '';
	extension: string = 'md';
	name: string = '';
}

export class TFolder {
	path: string = '';
	name: string = '';
	children: TAbstractFile[] = [];
}

export abstract class TAbstractFile {
	path: string = '';
	name: string = '';
}

export class Notice {
	constructor(message: string, timeout?: number) {
		// Mock implementation
	}

	hide(): void {
		// Mock implementation
	}
}

export abstract class FuzzySuggestModal<T> {
	app: App;

	constructor(app: App) {
		this.app = app;
	}

	abstract getItems(): T[];
	abstract getItemText(item: T): string;
	abstract onChooseItem(item: T, evt: MouseEvent | KeyboardEvent): void;

	open(): void {
		// Mock implementation
	}

	close(): void {
		// Mock implementation
	}
}
