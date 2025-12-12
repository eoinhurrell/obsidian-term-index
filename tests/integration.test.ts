import { generateIndex } from '../src/generator';
import { TermIndexSettings } from '../src/settings';
import { TFile, Vault } from 'obsidian';
import * as fs from 'fs';
import * as path from 'path';

describe('Full Pipeline Integration', () => {
	// Mock vault with test fixtures
	const createMockVault = (files: { path: string; content: string }[]): Vault => {
		const vault = new Vault();

		// Mock getMarkdownFiles
		vault.getMarkdownFiles = jest.fn().mockReturnValue(
			files.map((f) => {
				const tfile = new TFile();
				tfile.path = f.path;
				tfile.basename = path.basename(f.path, '.md');
				tfile.name = path.basename(f.path);
				return tfile;
			})
		);

		// Mock cachedRead
		vault.cachedRead = jest.fn().mockImplementation(async (file: TFile) => {
			const found = files.find((f) => f.path === file.path);
			return found ? found.content : '';
		});

		// Mock create
		vault.create = jest.fn().mockResolvedValue(new TFile());

		// Mock modify
		vault.modify = jest.fn().mockResolvedValue(undefined);

		// Mock getAbstractFileByPath
		vault.getAbstractFileByPath = jest.fn().mockReturnValue(null);

		return vault;
	};

	const loadFixture = (filename: string): string => {
		return fs.readFileSync(
			path.join(__dirname, 'fixtures', filename),
			'utf-8'
		);
	};

	it('processes full pipeline with test fixtures', async () => {
		const files = [
			{ path: 'doc1.md', content: loadFixture('doc1.md') },
			{ path: 'doc2.md', content: loadFixture('doc2.md') },
			{ path: 'doc3.md', content: loadFixture('doc3.md') },
		];

		const vault = createMockVault(files);
		const settings: TermIndexSettings = {
			topN: 20,
			minOccurrences: 2,
			excludedFolders: [],
		};

		const result = await generateIndex(vault, null, settings);

		expect(result.fileCount).toBe(3);
		expect(result.termCount).toBeGreaterThan(0);
		expect(result.outputPath).toBe('vault-index.md');
		expect(vault.create).toHaveBeenCalledWith(
			'vault-index.md',
			expect.any(String)
		);
	});

	it('generates index with expected bigrams', async () => {
		const files = [
			{ path: 'doc1.md', content: loadFixture('doc1.md') },
			{ path: 'doc2.md', content: loadFixture('doc2.md') },
			{ path: 'doc3.md', content: loadFixture('doc3.md') },
		];

		const vault = createMockVault(files);
		const settings: TermIndexSettings = {
			topN: 50,
			minOccurrences: 2,
			excludedFolders: [],
		};

		await generateIndex(vault, null, settings);

		const createdContent = (vault.create as jest.Mock).mock.calls[0][1];

		// Check for expected bigrams
		expect(createdContent).toContain('machine learning');
		expect(createdContent).toContain('neural network');
		expect(createdContent).toContain('deep learning');
	});

	it('includes all 3 documents in term references', async () => {
		const files = [
			{ path: 'doc1.md', content: loadFixture('doc1.md') },
			{ path: 'doc2.md', content: loadFixture('doc2.md') },
			{ path: 'doc3.md', content: loadFixture('doc3.md') },
		];

		const vault = createMockVault(files);
		const settings: TermIndexSettings = {
			topN: 50,
			minOccurrences: 2,
			excludedFolders: [],
		};

		await generateIndex(vault, null, settings);

		const createdContent = (vault.create as jest.Mock).mock.calls[0][1];

		// Documents should be referenced
		expect(createdContent).toContain('[[doc1]]');
		expect(createdContent).toContain('[[doc2]]');
		expect(createdContent).toContain('[[doc3]]');
	});

	it('formats index with alphabetical grouping', async () => {
		const files = [
			{ path: 'doc1.md', content: loadFixture('doc1.md') },
			{ path: 'doc2.md', content: loadFixture('doc2.md') },
			{ path: 'doc3.md', content: loadFixture('doc3.md') },
		];

		const vault = createMockVault(files);
		const settings: TermIndexSettings = {
			topN: 50,
			minOccurrences: 2,
			excludedFolders: [],
		};

		await generateIndex(vault, null, settings);

		const createdContent = (vault.create as jest.Mock).mock.calls[0][1];

		// Should have alphabetical sections
		expect(createdContent).toMatch(/## [A-Z]/);
		// Should have title
		expect(createdContent).toContain('# Vault Index');
		// Should have timestamp
		expect(createdContent).toMatch(/Generated: \d{4}-\d{2}-\d{2}/);
	});

	it('throws error for empty vault', async () => {
		const vault = createMockVault([]);
		const settings: TermIndexSettings = {
			topN: 10,
			minOccurrences: 2,
			excludedFolders: [],
		};

		await expect(generateIndex(vault, null, settings)).rejects.toThrow(
			'No markdown files found in scope'
		);
	});

	it('throws error when no terms meet threshold', async () => {
		const files = [
			{ path: 'doc1.md', content: 'unique word alpha' },
			{ path: 'doc2.md', content: 'different word beta' },
		];

		const vault = createMockVault(files);
		const settings: TermIndexSettings = {
			topN: 10,
			minOccurrences: 100, // Very high threshold
			excludedFolders: [],
		};

		await expect(generateIndex(vault, null, settings)).rejects.toThrow(
			/No terms met the threshold/
		);
	});

	it('excludes specified folders', async () => {
		const files = [
			{ path: 'notes/doc1.md', content: loadFixture('doc1.md') },
			{ path: 'notes/doc2.md', content: loadFixture('doc2.md') },
			{ path: 'templates/template.md', content: 'template content' },
		];

		const vault = createMockVault(files);
		const settings: TermIndexSettings = {
			topN: 10,
			minOccurrences: 2,
			excludedFolders: ['templates'],
		};

		const result = await generateIndex(vault, null, settings);

		// Should only process 2 files (excluding templates folder)
		expect(result.fileCount).toBe(2);
	});

	it('filters out vault-index.md and folder-index.md', async () => {
		const files = [
			{ path: 'doc1.md', content: loadFixture('doc1.md') },
			{ path: 'doc2.md', content: loadFixture('doc2.md') },
			{ path: 'vault-index.md', content: 'old index' },
			{ path: 'folder/folder-index.md', content: 'old folder index' },
		];

		const vault = createMockVault(files);
		const settings: TermIndexSettings = {
			topN: 10,
			minOccurrences: 2,
			excludedFolders: [],
		};

		const result = await generateIndex(vault, null, settings);

		// Should only process doc1.md and doc2.md
		expect(result.fileCount).toBe(2);
	});

	it('generates folder index with correct path', async () => {
		const files = [
			{ path: 'folder/doc1.md', content: loadFixture('doc1.md') },
			{ path: 'folder/doc2.md', content: loadFixture('doc2.md') },
		];

		const vault = createMockVault(files);
		const settings: TermIndexSettings = {
			topN: 10,
			minOccurrences: 2,
			excludedFolders: [],
		};

		const result = await generateIndex(vault, 'folder', settings);

		expect(result.outputPath).toBe('folder/folder-index.md');
		expect(vault.create).toHaveBeenCalledWith(
			'folder/folder-index.md',
			expect.stringContaining('# Index: folder')
		);
	});
});
