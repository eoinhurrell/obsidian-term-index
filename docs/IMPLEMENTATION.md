# Implementation Guide

## Project Setup

### Prerequisites
- Node.js 18+
- npm or pnpm
- Obsidian installed (for testing)

### Scaffold Plugin

```bash
# Create plugin directory in your vault's .obsidian/plugins/
mkdir -p /path/to/vault/.obsidian/plugins/obsidian-term-index
cd /path/to/vault/.obsidian/plugins/obsidian-term-index

# Initialize
npm init -y
```

### package.json

```json
{
  "name": "obsidian-term-index",
  "version": "0.1.0",
  "description": "Generate a term index for your Obsidian vault",
  "main": "main.js",
  "scripts": {
    "dev": "node esbuild.config.mjs",
    "build": "tsc -noEmit -skipLibCheck && node esbuild.config.mjs production",
    "lint": "eslint src/",
    "test": "jest"
  },
  "keywords": ["obsidian", "plugin", "index", "tfidf"],
  "author": "",
  "license": "MIT",
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "builtin-modules": "^3.3.0",
    "esbuild": "^0.20.0",
    "eslint": "^8.57.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "ts-jest": "^29.0.0",
    "obsidian": "latest",
    "typescript": "^5.4.0"
  },
  "dependencies": {}
}
```

**Note**: We're implementing TF-IDF ourselves rather than using `natural` to keep the plugin dependency-free and smaller.

### tsconfig.json

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "inlineSourceMap": true,
    "inlineSources": true,
    "module": "ESNext",
    "target": "ES6",
    "allowJs": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "moduleResolution": "node",
    "importHelpers": true,
    "isolatedModules": true,
    "lib": ["DOM", "ES5", "ES6", "ES7"]
  },
  "include": ["src/**/*.ts"]
}
```

### esbuild.config.mjs

```javascript
import esbuild from "esbuild";
import process from "process";
import builtins from "builtin-modules";

const prod = process.argv[2] === "production";

const context = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: [
    "obsidian",
    "electron",
    "@codemirror/autocomplete",
    "@codemirror/collab",
    "@codemirror/commands",
    "@codemirror/language",
    "@codemirror/lint",
    "@codemirror/search",
    "@codemirror/state",
    "@codemirror/view",
    "@lezer/common",
    "@lezer/highlight",
    "@lezer/lr",
    ...builtins,
  ],
  format: "cjs",
  target: "es2018",
  logLevel: "info",
  sourcemap: prod ? false : "inline",
  treeShaking: true,
  outfile: "main.js",
});

if (prod) {
  await context.rebuild();
  process.exit(0);
} else {
  await context.watch();
}
```

### manifest.json

```json
{
  "id": "obsidian-term-index",
  "name": "Term Index",
  "version": "0.1.0",
  "minAppVersion": "1.0.0",
  "description": "Generate a TF-IDF based term index for your vault",
  "author": "Your Name",
  "authorUrl": "",
  "isDesktopOnly": false
}
```

### Directory Structure

```
obsidian-term-index/
├── src/
│   ├── main.ts           # Plugin entry, commands, menu
│   ├── settings.ts       # Settings interface and tab
│   ├── generator.ts      # Orchestrates index generation
│   ├── parser.ts         # Markdown content parsing
│   ├── tokeniser.ts      # Tokenisation, stopwords, n-grams
│   ├── scorer.ts         # TF-IDF calculation
│   ├── formatter.ts      # Markdown output formatting
│   └── types.ts          # Shared type definitions
├── tests/
│   ├── parser.test.ts
│   ├── tokeniser.test.ts
│   ├── scorer.test.ts
│   └── formatter.test.ts
├── manifest.json
├── package.json
├── tsconfig.json
├── esbuild.config.mjs
├── jest.config.js
└── README.md
```

## Implementation Phases

### Phase 1: Foundation

**Goal**: Plugin loads, settings work, basic file collection.

- [ ] Create project structure
- [ ] Implement `types.ts`
- [ ] Implement `settings.ts` with defaults
- [ ] Basic `main.ts` with plugin lifecycle
- [ ] File collection in `generator.ts` (just list files, no processing)
- [ ] Verify plugin loads in Obsidian

**Test**: Plugin appears in settings, can configure options.

### Phase 2: Text Processing

**Goal**: Parse and tokenise documents.

- [ ] Implement `parser.ts` — frontmatter, code, links
- [ ] Implement `tokeniser.ts` — stopwords, n-grams
- [ ] Unit tests for parser
- [ ] Unit tests for tokeniser

**Test**: Parse a sample document, verify clean output.

### Phase 3: Scoring

**Goal**: TF-IDF scoring works correctly.

- [ ] Implement `scorer.ts` — term frequencies, IDF, filtering
- [ ] Unit tests for scorer
- [ ] Verify scoring produces sensible rankings

**Test**: Score a set of test documents, verify top terms make sense.

### Phase 4: Output

**Goal**: Generate formatted index file.

- [ ] Implement `formatter.ts` — alphabetical grouping, markdown
- [ ] Wire up full pipeline in `generator.ts`
- [ ] Write index file to vault
- [ ] Unit tests for formatter

**Test**: Generate index for test vault, verify output format.

### Phase 5: Commands & Polish

**Goal**: Full functionality with all triggers.

- [ ] Add "Generate Vault Index" command
- [ ] Add "Generate Folder Index" command with folder picker
- [ ] Add folder context menu item
- [ ] Add progress notices for large vaults
- [ ] Error handling and user feedback
- [ ] Manual testing in real vault

**Test**: All three triggers work, errors display nicely.

### Phase 6: Release Prep

- [ ] Write README.md
- [ ] Test on mobile (if applicable)
- [ ] Performance test with large vault
- [ ] Package for release

---

## Detailed Module Implementations

### types.ts

```typescript
/**
 * Shared type definitions for the term index plugin.
 */

/** Raw file information from vault */
export interface FileInfo {
  path: string;     // Full path from vault root
  name: string;     // Filename without extension
  content: string;  // Raw markdown content
}

/** Document after markdown parsing */
export interface ParsedDocument {
  path: string;
  name: string;
  text: string;     // Clean text for tokenisation
}

/** Document after tokenisation */
export interface TokenizedDocument {
  path: string;
  name: string;
  tokens: string[];   // Unigrams
  bigrams: string[];  // Bigrams
}

/** Document reference within a term */
export interface DocumentReference {
  path: string;
  name: string;
  count: number;
}

/** Scored term with document references */
export interface TermScore {
  term: string;
  score: number;              // TF-IDF score (for ranking)
  totalOccurrences: number;   // Sum of counts across all docs
  documents: DocumentReference[];
}
```

### settings.ts

```typescript
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
```

### main.ts

```typescript
import { Plugin, TFolder, Notice, TFile, FuzzySuggestModal } from 'obsidian';
import { TermIndexSettings, DEFAULT_SETTINGS, TermIndexSettingTab } from './settings';
import { generateIndex } from './generator';

/** Modal for selecting a folder */
class FolderSuggestModal extends FuzzySuggestModal<TFolder> {
  folders: TFolder[];
  onChoose: (folder: TFolder) => void;

  constructor(app: App, folders: TFolder[], onChoose: (folder: TFolder) => void) {
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

    // Settings tab
    this.addSettingTab(new TermIndexSettingTab(this.app, this));

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
      new Notice(`Error generating index: ${e.message}`);
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
      new Notice(`Error generating index: ${e.message}`);
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
```

### generator.ts

```typescript
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
  const filename = folderPath ? `${folderPath}/folder-index.md` : 'vault-index.md';

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

  // Filter excluded folders
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
```

### parser.ts

```typescript
import { FileInfo, ParsedDocument } from './types';

/**
 * Parse a markdown file and extract clean text for tokenisation.
 */
export function parseDocument(file: FileInfo): ParsedDocument {
  let text = file.content;

  text = removeFrontmatter(text);
  text = removeCodeBlocks(text);
  text = removeInlineCode(text);
  text = extractLinkText(text);
  text = stripMarkdownSyntax(text);

  return {
    path: file.path,
    name: file.name,
    text,
  };
}

/** Remove YAML frontmatter */
function removeFrontmatter(text: string): string {
  if (text.startsWith('---')) {
    const endIndex = text.indexOf('\n---', 3);
    if (endIndex !== -1) {
      return text.slice(endIndex + 4);
    }
  }
  return text;
}

/** Remove fenced and indented code blocks */
function removeCodeBlocks(text: string): string {
  // Fenced code blocks (``` or ~~~)
  text = text.replace(/```[\s\S]*?```/g, ' ');
  text = text.replace(/~~~[\s\S]*?~~~/g, ' ');
  // Indented code blocks (4 spaces or tab at line start)
  text = text.replace(/^(?:    |\t).*$/gm, ' ');
  return text;
}

/** Remove inline code */
function removeInlineCode(text: string): string {
  return text.replace(/`[^`\n]+`/g, ' ');
}

/** Extract display text from wiki and markdown links */
function extractLinkText(text: string): string {
  // ![[embed]] -> remove entirely
  text = text.replace(/!\[\[[^\]]+\]\]/g, ' ');
  // [[target|display]] -> display
  text = text.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2');
  // [[target]] -> target
  text = text.replace(/\[\[([^\]]+)\]\]/g, '$1');
  // ![alt](url) -> alt
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');
  // [display](url) -> display
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  return text;
}

/** Remove markdown formatting syntax, keeping text */
function stripMarkdownSyntax(text: string): string {
  // Headers
  text = text.replace(/^#{1,6}\s+/gm, '');
  // Bold
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  text = text.replace(/__([^_]+)__/g, '$1');
  // Italic
  text = text.replace(/\*([^*]+)\*/g, '$1');
  text = text.replace(/_([^_]+)_/g, '$1');
  // Strikethrough
  text = text.replace(/~~([^~]+)~~/g, '$1');
  // Highlight
  text = text.replace(/==([^=]+)==/g, '$1');
  // Block quotes
  text = text.replace(/^>\s*/gm, '');
  // List markers
  text = text.replace(/^[\s]*[-*+]\s+/gm, '');
  text = text.replace(/^[\s]*\d+\.\s+/gm, '');
  // Horizontal rules
  text = text.replace(/^[-*_]{3,}$/gm, ' ');
  // Tags
  text = text.replace(/#[a-zA-Z0-9_/-]+/g, ' ');
  // HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, ' ');
  // HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  return text;
}
```

### tokeniser.ts

```typescript
import { ParsedDocument, TokenizedDocument } from './types';

/**
 * Common English stopwords to filter out.
 * Extended list covering common words that don't carry meaning.
 */
const STOPWORDS = new Set([
  // Articles, conjunctions, prepositions
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'into', 'through', 'during', 'before',
  'after', 'above', 'below', 'between', 'under', 'over', 'out', 'off',
  'up', 'down', 'about', 'against', 'among', 'throughout', 'despite',
  'towards', 'upon', 'within', 'without', 'according', 'alongside',
  
  // Pronouns
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you',
  'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself',
  'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them',
  'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this',
  'that', 'these', 'those', 'there', 'here', 'where', 'when', 'why', 'how',
  
  // Common verbs
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'having', 'do', 'does', 'did', 'doing', 'will', 'would', 'could', 'should',
  'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used',
  'get', 'gets', 'got', 'getting', 'make', 'makes', 'made', 'making',
  'go', 'goes', 'went', 'gone', 'going', 'take', 'takes', 'took', 'taken',
  'come', 'comes', 'came', 'coming', 'see', 'sees', 'saw', 'seen', 'seeing',
  'know', 'knows', 'knew', 'known', 'think', 'thinks', 'thought', 'thinking',
  'want', 'wants', 'wanted', 'give', 'gives', 'gave', 'given', 'find',
  'use', 'uses', 'using', 'say', 'says', 'said',
  
  // Quantifiers and determiners
  'all', 'any', 'both', 'each', 'every', 'few', 'more', 'most', 'other',
  'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than',
  'too', 'very', 'just', 'also', 'even', 'still', 'already', 'always',
  'never', 'ever', 'often', 'usually', 'sometimes', 'again', 'further',
  'then', 'once', 'much', 'many', 'another', 'several', 'enough',
  
  // Common nouns (too generic)
  'thing', 'things', 'something', 'nothing', 'anything', 'everything',
  'someone', 'anyone', 'everyone', 'nobody', 'people', 'person', 'way',
  'ways', 'time', 'times', 'year', 'years', 'day', 'days', 'part', 'parts',
  'place', 'case', 'cases', 'point', 'points', 'fact', 'facts', 'example',
  'lot', 'lots', 'kind', 'type', 'number', 'set', 'different', 'following',
  'note', 'notes', 'page', 'section',
  
  // Miscellaneous
  'however', 'therefore', 'thus', 'hence', 'although', 'though', 'while',
  'whereas', 'whether', 'because', 'since', 'unless', 'until', 'if',
  'well', 'back', 'like', 'now', 'new', 'first', 'last', 'long', 'great',
  'little', 'good', 'right', 'big', 'high', 'small', 'large', 'next',
  'early', 'young', 'old', 'important', 'able', 'bad', 'etc', 'eg', 'ie',
  'via', 'per', 'based', 'related', 'include', 'includes', 'including',
]);

/**
 * Tokenize a parsed document into unigrams and bigrams.
 */
export function tokenize(doc: ParsedDocument): TokenizedDocument {
  const text = doc.text.toLowerCase();

  // Extract words: sequences of letters and numbers
  const allWords = text.match(/[a-z][a-z0-9]*/g) || [];

  // Filter: remove stopwords, very short words, and pure numbers
  const words = allWords.filter(
    (w) => w.length > 2 && !STOPWORDS.has(w)
  );

  // Generate bigrams from adjacent filtered words
  const bigrams: string[] = [];
  for (let i = 0; i < words.length - 1; i++) {
    bigrams.push(`${words[i]} ${words[i + 1]}`);
  }

  return {
    path: doc.path,
    name: doc.name,
    tokens: words,
    bigrams,
  };
}
```

### scorer.ts

```typescript
import { TokenizedDocument, TermScore, DocumentReference } from './types';
import { TermIndexSettings } from './settings';

interface TermData {
  documents: Map<string, DocumentReference>;
  totalCount: number;
}

/**
 * Calculate TF-IDF scores for all terms across documents.
 */
export function calculateScores(
  documents: TokenizedDocument[],
  settings: TermIndexSettings
): TermScore[] {
  const termMap = new Map<string, TermData>();
  const docCount = documents.length;

  // 1. Build term frequency data
  for (const doc of documents) {
    // Count unigrams
    const counts = new Map<string, number>();
    for (const token of doc.tokens) {
      counts.set(token, (counts.get(token) || 0) + 1);
    }
    for (const bigram of doc.bigrams) {
      counts.set(bigram, (counts.get(bigram) || 0) + 1);
    }

    // Add to global term map
    for (const [term, count] of counts) {
      if (!termMap.has(term)) {
        termMap.set(term, { documents: new Map(), totalCount: 0 });
      }
      const data = termMap.get(term)!;
      data.totalCount += count;
      data.documents.set(doc.path, {
        path: doc.path,
        name: doc.name,
        count,
      });
    }
  }

  // 2. Calculate scores and filter
  const scores: TermScore[] = [];

  for (const [term, data] of termMap) {
    const docFreq = data.documents.size;

    // Must appear in 2+ documents
    if (docFreq < 2) continue;

    // Must meet minimum occurrences
    if (data.totalCount < settings.minOccurrences) continue;

    // Bigrams need extra filtering (must appear in 2+ docs, already covered)
    const isBigram = term.includes(' ');
    if (isBigram && data.totalCount < 2) continue;

    // Calculate IDF
    const idf = Math.log(docCount / docFreq);

    // Aggregate TF-IDF (sum of TF * IDF across all documents)
    let totalScore = 0;
    for (const entry of data.documents.values()) {
      totalScore += entry.count * idf;
    }

    scores.push({
      term,
      score: totalScore,
      totalOccurrences: data.totalCount,
      documents: Array.from(data.documents.values()).sort(
        (a, b) => b.count - a.count
      ),
    });
  }

  // 3. Sort by score descending and take top N
  scores.sort((a, b) => b.score - a.score);
  return scores.slice(0, settings.topN);
}
```

### formatter.ts

```typescript
import { TermScore } from './types';

/**
 * Format term scores as a markdown index file.
 */
export function formatIndex(
  terms: TermScore[],
  title: string,
  timestamp: Date
): string {
  const lines: string[] = [];

  // Header
  lines.push(`# ${title}`);
  lines.push('');
  lines.push(`Generated: ${formatTimestamp(timestamp)}`);
  lines.push('');
  lines.push(`**${terms.length} terms** from vault`);
  lines.push('');

  // Group by first letter
  const grouped = groupByFirstLetter(terms);
  const letters = Array.from(grouped.keys()).sort();

  for (const letter of letters) {
    lines.push(`## ${letter.toUpperCase()}`);
    lines.push('');

    const letterTerms = grouped.get(letter)!;
    letterTerms.sort((a, b) => a.term.localeCompare(b.term));

    for (const term of letterTerms) {
      lines.push(`- **${term.term}** (${term.totalOccurrences} references)`);
      for (const doc of term.documents) {
        lines.push(`  - [[${doc.name}]] (${doc.count})`);
      }
    }

    lines.push('');
  }

  return lines.join('\n');
}

function formatTimestamp(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function groupByFirstLetter(terms: TermScore[]): Map<string, TermScore[]> {
  const groups = new Map<string, TermScore[]>();

  for (const term of terms) {
    const firstChar = term.term.charAt(0).toLowerCase();
    const letter = /[a-z]/.test(firstChar) ? firstChar : '#';

    if (!groups.has(letter)) {
      groups.set(letter, []);
    }
    groups.get(letter)!.push(term);
  }

  return groups;
}
```

---

## Testing Setup

### jest.config.js

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js'],
};
```

### Sample Test: tests/parser.test.ts

```typescript
import { parseDocument } from '../src/parser';
import { FileInfo } from '../src/types';

describe('parseDocument', () => {
  it('removes YAML frontmatter', () => {
    const file: FileInfo = {
      path: 'test.md',
      name: 'test',
      content: '---\ntitle: Test\ntags: [a, b]\n---\n\nActual content here.',
    };
    const result = parseDocument(file);
    expect(result.text).not.toContain('title');
    expect(result.text).toContain('Actual content here');
  });

  it('removes fenced code blocks', () => {
    const file: FileInfo = {
      path: 'test.md',
      name: 'test',
      content: 'Before\n```javascript\nconst x = 1;\n```\nAfter',
    };
    const result = parseDocument(file);
    expect(result.text).not.toContain('const');
    expect(result.text).toContain('Before');
    expect(result.text).toContain('After');
  });

  it('extracts display text from wiki links', () => {
    const file: FileInfo = {
      path: 'test.md',
      name: 'test',
      content: 'See [[target|display text]] for more.',
    };
    const result = parseDocument(file);
    expect(result.text).toContain('display text');
    expect(result.text).not.toContain('target|');
  });

  it('extracts text from plain wiki links', () => {
    const file: FileInfo = {
      path: 'test.md',
      name: 'test',
      content: 'See [[some note]] for more.',
    };
    const result = parseDocument(file);
    expect(result.text).toContain('some note');
    expect(result.text).not.toContain('[[');
  });

  it('removes inline code', () => {
    const file: FileInfo = {
      path: 'test.md',
      name: 'test',
      content: 'Use the `function` keyword here.',
    };
    const result = parseDocument(file);
    expect(result.text).not.toContain('function');
    expect(result.text).toContain('Use the');
  });
});
```

### Sample Test: tests/tokeniser.test.ts

```typescript
import { tokenize } from '../src/tokeniser';
import { ParsedDocument } from '../src/types';

describe('tokenize', () => {
  it('extracts words and removes stopwords', () => {
    const doc: ParsedDocument = {
      path: 'test.md',
      name: 'test',
      text: 'The transformer architecture is a neural network model.',
    };
    const result = tokenize(doc);
    
    expect(result.tokens).toContain('transformer');
    expect(result.tokens).toContain('architecture');
    expect(result.tokens).toContain('neural');
    expect(result.tokens).toContain('network');
    expect(result.tokens).toContain('model');
    expect(result.tokens).not.toContain('the');
    expect(result.tokens).not.toContain('is');
    expect(result.tokens).not.toContain('a');
  });

  it('generates bigrams from adjacent words', () => {
    const doc: ParsedDocument = {
      path: 'test.md',
      name: 'test',
      text: 'machine learning algorithms process data efficiently',
    };
    const result = tokenize(doc);
    
    expect(result.bigrams).toContain('machine learning');
    expect(result.bigrams).toContain('learning algorithms');
  });

  it('lowercases all tokens', () => {
    const doc: ParsedDocument = {
      path: 'test.md',
      name: 'test',
      text: 'Python JavaScript TypeScript',
    };
    const result = tokenize(doc);
    
    expect(result.tokens).toContain('python');
    expect(result.tokens).toContain('javascript');
    expect(result.tokens).not.toContain('Python');
  });

  it('filters out short words', () => {
    const doc: ParsedDocument = {
      path: 'test.md',
      name: 'test',
      text: 'AI is an ML API for NLP',
    };
    const result = tokenize(doc);
    
    // Words <= 2 chars should be filtered
    expect(result.tokens).not.toContain('ai');
    expect(result.tokens).not.toContain('is');
    expect(result.tokens).not.toContain('an');
    expect(result.tokens).not.toContain('ml');
    expect(result.tokens).toContain('api');
    expect(result.tokens).toContain('nlp');
  });
});
```

---

## Development Workflow

1. **Start dev build**: `npm run dev` (watches for changes)
2. **Enable plugin**: In Obsidian Settings → Community Plugins → Enable "Term Index"
3. **Reload after changes**: Ctrl+P → "Reload app without saving"
4. **Check console**: Ctrl+Shift+I for developer tools
5. **Run tests**: `npm test`

## Building for Release

```bash
npm run build
```

Creates `main.js` ready for distribution alongside `manifest.json`.
