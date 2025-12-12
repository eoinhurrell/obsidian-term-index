import { Vault, TFile, TFolder } from 'obsidian';
import { TermIndexSettings } from './settings';
import { parseDocument } from './parser';
import { tokenize } from './tokeniser';
import { calculateScores } from './scorer';
import { formatIndex } from './formatter';
import { FileInfo, ParsedDocument, TokenizedDocument } from './types';

export interface GenerationResult {
	termCount: number;
	fileCount: number;
	outputPath: string;
}

export async function generateIndex(
	vault: Vault,
	folderPath: string | null,
	settings: TermIndexSettings
): Promise<GenerationResult> {
	// 1. Collect files
	const files = await collectFiles(vault, folderPath, settings.excludedFolders);

	if (files.length === 0) {
		throw new Error('No markdown files found in scope');
	}

	// 2. Parse documents
	const parsed: ParsedDocument[] = files.map(parseDocument);

	// 3. Tokenize
	const tokenized: TokenizedDocument[] = parsed.map(tokenize);

	// 4. Calculate TF-IDF scores
	const scores = calculateScores(tokenized, settings);

	if (scores.length === 0) {
		throw new Error(
			`No terms met the threshold (min ${settings.minOccurrences} occurrences across 2+ files)`
		);
	}

	// 5. Format output
	const title = folderPath ? `Index: ${folderPath}` : 'Vault Index';
	const markdown = formatIndex(scores, title, new Date());

	// 6. Write file
	const filename = folderPath
		? `${folderPath}/folder-index.md`
		: 'vault-index.md';

	const existingFile = vault.getAbstractFileByPath(filename);
	if (existingFile instanceof TFile) {
		await vault.modify(existingFile, markdown);
	} else {
		await vault.create(filename, markdown);
	}

	return {
		termCount: scores.length,
		fileCount: files.length,
		outputPath: filename,
	};
}

async function collectFiles(
	vault: Vault,
	folderPath: string | null,
	excludedFolders: string[]
): Promise<FileInfo[]> {
	let files = vault.getMarkdownFiles();

	// Filter to folder scope
	if (folderPath) {
		const prefix = folderPath + '/';
		files = files.filter((f) => f.path.startsWith(prefix) || f.path === folderPath);
	}

	// Normalize excluded folders (ensure trailing slash)
	const normalizedExclusions = excludedFolders.map((f) =>
		f.endsWith('/') ? f : f + '/'
	);

	files = files.filter((f) => {
		// Don't index the index files themselves
		if (f.name === 'vault-index.md' || f.name === 'folder-index.md') {
			return false;
		}
		// Check exclusions
		for (const excluded of normalizedExclusions) {
			if (f.path.startsWith(excluded)) {
				return false;
			}
		}
		return true;
	});

	// Read content
	const results: FileInfo[] = [];
	for (const file of files) {
		try {
			const content = await vault.cachedRead(file);
			results.push({
				path: file.path,
				name: file.basename,
				content,
			});
		} catch (e) {
			console.warn(`Term Index: Failed to read ${file.path}:`, e);
		}
	}

	return results;
}
