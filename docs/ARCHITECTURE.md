# Technical Architecture

## System Overview

obsidian-term-index is a standard Obsidian plugin that reads vault files, computes TF-IDF scores for terms, and writes a markdown index file. All processing is synchronous and manual-triggered.

```
┌─────────────────────────────────────────────────────────────────┐
│                         Obsidian                                 │
│                                                                  │
│  ┌─────────────────┐     ┌─────────────────┐                   │
│  │ Command Palette │     │  Folder Context │                   │
│  │    Commands     │     │      Menu       │                   │
│  └────────┬────────┘     └────────┬────────┘                   │
│           │                       │                             │
│           └───────────┬───────────┘                             │
│                       ▼                                         │
│           ┌─────────────────────┐                               │
│           │   Index Generator   │                               │
│           │                     │                               │
│           │  ┌───────────────┐  │                               │
│           │  │ File Collector │  │◄──── Settings (excluded)     │
│           │  └───────┬───────┘  │                               │
│           │          ▼          │                               │
│           │  ┌───────────────┐  │                               │
│           │  │  Text Parser  │  │◄──── Strip frontmatter, code  │
│           │  └───────┬───────┘  │                               │
│           │          ▼          │                               │
│           │  ┌───────────────┐  │                               │
│           │  │  Tokeniser    │  │◄──── Stopwords, n-grams       │
│           │  └───────┬───────┘  │                               │
│           │          ▼          │                               │
│           │  ┌───────────────┐  │                               │
│           │  │ TF-IDF Scorer │  │◄──── Settings (topN, minOcc)  │
│           │  └───────┬───────┘  │                               │
│           │          ▼          │                               │
│           │  ┌───────────────┐  │                               │
│           │  │Index Formatter│  │                               │
│           │  └───────┬───────┘  │                               │
│           └──────────┼──────────┘                               │
│                      ▼                                          │
│           ┌─────────────────────┐                               │
│           │  vault-index.md     │                               │
│           │  (or folder-index)  │                               │
│           └─────────────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Runtime
- **Platform**: Obsidian Plugin API
- **Language**: TypeScript
- **Build**: esbuild (standard Obsidian plugin setup)

### Dependencies

| Package | Purpose | Notes |
|---------|---------|-------|
| `obsidian` | Plugin API | Provided by Obsidian |
| `natural` | TF-IDF, tokenisation, stopwords | npm package |

The `natural` library provides:
- `TfIdf` class for scoring
- `WordTokenizer` for splitting text
- Stopword lists

Alternatively, we could implement TF-IDF ourselves to avoid the dependency—it's not complex. Decision: **use `natural`** for robustness and maintained stopword lists.

## Data Flow

### 1. File Collection

```typescript
interface FileInfo {
  path: string;      // Full path from vault root
  name: string;      // Filename without extension
  content: string;   // Raw markdown content
}

async function collectFiles(
  vault: Vault,
  scope: string | null,  // null = full vault, string = folder path
  excludedFolders: string[]
): Promise<FileInfo[]>
```

**Logic**:
1. Get all markdown files in scope
2. Filter out files in excluded folders
3. Read content for each file
4. Return array of FileInfo

### 2. Text Parsing

```typescript
interface ParsedDocument {
  path: string;
  name: string;
  text: string;  // Clean text for tokenisation
}

function parseDocument(file: FileInfo): ParsedDocument
```

**Logic**:
1. Remove YAML frontmatter (`---` blocks at start)
2. Remove code blocks (``` fenced and indented)
3. Remove inline code (backticks)
4. Extract display text from links: `[[target|display]]` → `display`, `[[target]]` → `target`
5. Remove other markdown syntax (headers, bold, etc.) — keep words only
6. Return clean text

### 3. Tokenisation

```typescript
interface TokenizedDocument {
  path: string;
  name: string;
  tokens: string[];        // Unigrams
  bigrams: string[];       // Bigrams
}

function tokenize(doc: ParsedDocument): TokenizedDocument
```

**Logic**:
1. Lowercase all text
2. Split into words (alphanumeric sequences)
3. Remove stopwords
4. Generate bigrams from adjacent non-stopword tokens
5. Return both unigrams and bigrams

### 4. TF-IDF Scoring

```typescript
interface TermScore {
  term: string;
  score: number;           // TF-IDF score (for ranking)
  totalOccurrences: number;
  documents: {
    path: string;
    name: string;
    count: number;
  }[];
}

function scoreTerm(
  documents: TokenizedDocument[],
  settings: TermIndexSettings
): TermScore[]
```

**TF-IDF Formula**:
```
TF(t, d) = count of t in d / total terms in d
IDF(t) = log(total documents / documents containing t)
TF-IDF(t, d) = TF(t, d) × IDF(t)
```

For ranking terms across the corpus, we use the sum or max of TF-IDF scores across all documents.

**Logic**:
1. Build term frequency map per document
2. Build document frequency map (how many docs contain each term)
3. Calculate TF-IDF for each term-document pair
4. Aggregate scores per term (sum across documents)
5. Filter: remove terms appearing in only 1 document
6. Filter: remove bigrams appearing in only 1 document
7. Filter: remove terms with total occurrences < minOccurrences
8. Sort by score descending
9. Take top N
10. Return with document breakdown

### 5. Index Formatting

```typescript
function formatIndex(
  terms: TermScore[],
  title: string,
  timestamp: Date
): string
```

**Logic**:
1. Group terms by first letter
2. Sort terms within each group alphabetically
3. Sort documents within each term by count descending
4. Format as markdown

**Output Template**:
```markdown
# {title}

Generated: {timestamp}

## A

- **{term}** ({totalOccurrences} references)
  - [[{docName}]] ({count})
  - [[{docName}]] ({count})
  ...

## B
...
```

## Module Structure

```
obsidian-term-index/
├── src/
│   ├── main.ts              # Plugin entry point
│   ├── settings.ts          # Settings tab
│   ├── generator.ts         # Main orchestration
│   ├── parser.ts            # Markdown parsing
│   ├── tokeniser.ts         # Tokenisation and stopwords
│   ├── scorer.ts            # TF-IDF calculation
│   ├── formatter.ts         # Markdown output
│   └── types.ts             # Shared types
├── styles.css               # (empty, no custom UI)
├── manifest.json
├── package.json
├── tsconfig.json
├── esbuild.config.mjs
└── README.md
```

## Module Specifications

### main.ts

```typescript
import { Plugin, TFolder, Notice } from 'obsidian';
import { TermIndexSettings, DEFAULT_SETTINGS } from './settings';
import { generateIndex } from './generator';
import { TermIndexSettingTab } from './settings';

export default class TermIndexPlugin extends Plugin {
  settings: TermIndexSettings;

  async onload() {
    await this.loadSettings();
    
    // Command: Generate Vault Index
    this.addCommand({
      id: 'generate-vault-index',
      name: 'Generate Vault Index',
      callback: () => this.generateVaultIndex()
    });
    
    // Command: Generate Folder Index (with picker)
    this.addCommand({
      id: 'generate-folder-index',
      name: 'Generate Folder Index',
      callback: () => this.generateFolderIndexWithPicker()
    });
    
    // Folder context menu
    this.registerEvent(
      this.app.workspace.on('file-menu', (menu, file) => {
        if (file instanceof TFolder) {
          menu.addItem((item) => {
            item
              .setTitle('Generate Index')
              .setIcon('list')
              .onClick(() => this.generateFolderIndex(file.path));
          });
        }
      })
    );
    
    // Settings tab
    this.addSettingTab(new TermIndexSettingTab(this.app, this));
  }

  async generateVaultIndex() {
    new Notice('Generating vault index...');
    try {
      await generateIndex(this.app.vault, null, this.settings);
      new Notice('Vault index generated!');
    } catch (e) {
      new Notice(`Error: ${e.message}`);
    }
  }

  async generateFolderIndexWithPicker() {
    // Use Obsidian's folder suggester or simple prompt
    // For MVP, could use a modal with folder list
  }

  async generateFolderIndex(folderPath: string) {
    new Notice(`Generating index for ${folderPath}...`);
    try {
      await generateIndex(this.app.vault, folderPath, this.settings);
      new Notice('Folder index generated!');
    } catch (e) {
      new Notice(`Error: ${e.message}`);
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
```

### settings.ts

```typescript
import { App, PluginSettingTab, Setting } from 'obsidian';
import TermIndexPlugin from './main';

export interface TermIndexSettings {
  topN: number;
  minOccurrences: number;
  excludedFolders: string[];
}

export const DEFAULT_SETTINGS: TermIndexSettings = {
  topN: 250,
  minOccurrences: 10,
  excludedFolders: []
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

    new Setting(containerEl)
      .setName('Top N terms')
      .setDesc('Maximum number of terms to include in the index')
      .addText(text => text
        .setPlaceholder('250')
        .setValue(String(this.plugin.settings.topN))
        .onChange(async (value) => {
          const num = parseInt(value);
          if (!isNaN(num) && num > 0) {
            this.plugin.settings.topN = num;
            await this.plugin.saveSettings();
          }
        }));

    new Setting(containerEl)
      .setName('Minimum occurrences')
      .setDesc('Terms must appear at least this many times to be included')
      .addText(text => text
        .setPlaceholder('10')
        .setValue(String(this.plugin.settings.minOccurrences))
        .onChange(async (value) => {
          const num = parseInt(value);
          if (!isNaN(num) && num > 0) {
            this.plugin.settings.minOccurrences = num;
            await this.plugin.saveSettings();
          }
        }));

    new Setting(containerEl)
      .setName('Excluded folders')
      .setDesc('Comma-separated list of folder paths to exclude')
      .addText(text => text
        .setPlaceholder('templates, daily-notes')
        .setValue(this.plugin.settings.excludedFolders.join(', '))
        .onChange(async (value) => {
          this.plugin.settings.excludedFolders = value
            .split(',')
            .map(s => s.trim())
            .filter(s => s.length > 0);
          await this.plugin.saveSettings();
        }));
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

export async function generateIndex(
  vault: Vault,
  folderPath: string | null,
  settings: TermIndexSettings
): Promise<void> {
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
      `No terms met the threshold (min ${settings.minOccurrences} occurrences, in 2+ files)`
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
}

async function collectFiles(
  vault: Vault,
  folderPath: string | null,
  excludedFolders: string[]
): Promise<FileInfo[]> {
  let files: TFile[];
  
  if (folderPath) {
    const folder = vault.getAbstractFileByPath(folderPath);
    if (!(folder instanceof TFolder)) {
      throw new Error(`Folder not found: ${folderPath}`);
    }
    files = vault.getMarkdownFiles().filter(f => f.path.startsWith(folderPath + '/'));
  } else {
    files = vault.getMarkdownFiles();
  }
  
  // Filter excluded folders
  files = files.filter(f => {
    return !excludedFolders.some(excluded => 
      f.path.startsWith(excluded + '/') || f.path === excluded
    );
  });
  
  // Read content
  const results: FileInfo[] = [];
  for (const file of files) {
    const content = await vault.cachedRead(file);
    results.push({
      path: file.path,
      name: file.basename,
      content
    });
  }
  
  return results;
}
```

### parser.ts

```typescript
import { FileInfo, ParsedDocument } from './types';

export function parseDocument(file: FileInfo): ParsedDocument {
  let text = file.content;
  
  // Remove YAML frontmatter
  text = removeFrontmatter(text);
  
  // Remove code blocks
  text = removeCodeBlocks(text);
  
  // Remove inline code
  text = removeInlineCode(text);
  
  // Extract link text
  text = extractLinkText(text);
  
  // Remove remaining markdown syntax
  text = stripMarkdownSyntax(text);
  
  return {
    path: file.path,
    name: file.name,
    text
  };
}

function removeFrontmatter(text: string): string {
  // Match --- at start, content, ---
  return text.replace(/^---\n[\s\S]*?\n---\n?/, '');
}

function removeCodeBlocks(text: string): string {
  // Fenced code blocks
  text = text.replace(/```[\s\S]*?```/g, '');
  // Indented code blocks (4 spaces or tab at start of line)
  text = text.replace(/^(?:    |\t).*$/gm, '');
  return text;
}

function removeInlineCode(text: string): string {
  return text.replace(/`[^`]+`/g, '');
}

function extractLinkText(text: string): string {
  // [[target|display]] -> display
  text = text.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2');
  // [[target]] -> target
  text = text.replace(/\[\[([^\]]+)\]\]/g, '$1');
  // [display](url) -> display
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  // ![[embed]] -> remove entirely
  text = text.replace(/!\[\[[^\]]+\]\]/g, '');
  return text;
}

function stripMarkdownSyntax(text: string): string {
  // Headers
  text = text.replace(/^#+\s+/gm, '');
  // Bold/italic
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  text = text.replace(/\*([^*]+)\*/g, '$1');
  text = text.replace(/__([^_]+)__/g, '$1');
  text = text.replace(/_([^_]+)_/g, '$1');
  // Strikethrough
  text = text.replace(/~~([^~]+)~~/g, '$1');
  // Highlight
  text = text.replace(/==([^=]+)==/g, '$1');
  // Block quotes
  text = text.replace(/^>\s+/gm, '');
  // List markers
  text = text.replace(/^[\s]*[-*+]\s+/gm, '');
  text = text.replace(/^[\s]*\d+\.\s+/gm, '');
  // Horizontal rules
  text = text.replace(/^[-*_]{3,}$/gm, '');
  // Tags (Obsidian)
  text = text.replace(/#[^\s#]+/g, '');
  
  return text;
}
```

### tokeniser.ts

```typescript
import { ParsedDocument, TokenizedDocument } from './types';

// Stopwords list (English)
const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought',
  'used', 'it', 'its', 'this', 'that', 'these', 'those', 'i', 'you', 'he',
  'she', 'we', 'they', 'what', 'which', 'who', 'whom', 'when', 'where',
  'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most',
  'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
  'than', 'too', 'very', 'just', 'about', 'above', 'after', 'again',
  'against', 'am', 'any', 'because', 'before', 'being', 'below', 'between',
  'cannot', 'could', 'down', 'during', 'further', 'here', 'if', 'into',
  'me', 'my', 'myself', 'now', 'off', 'once', 'our', 'ours', 'ourselves',
  'out', 'over', 'own', 'same', 'then', 'there', 'theirs', 'them',
  'themselves', 'through', 'under', 'until', 'up', 'very', 'while', 'your',
  'yours', 'yourself', 'yourselves', 'also', 'like', 'well', 'back', 'even',
  'still', 'way', 'take', 'since', 'another', 'however', 'come', 'get',
  'make', 'see', 'know', 'think', 'look', 'want', 'give', 'use', 'find',
  'tell', 'ask', 'seem', 'feel', 'try', 'leave', 'call', 'keep', 'let',
  'begin', 'show', 'hear', 'play', 'run', 'move', 'live', 'believe', 'hold',
  'bring', 'happen', 'write', 'provide', 'sit', 'stand', 'lose', 'pay',
  'meet', 'include', 'continue', 'set', 'learn', 'change', 'lead', 'understand',
  'watch', 'follow', 'stop', 'create', 'speak', 'read', 'allow', 'add',
  'spend', 'grow', 'open', 'walk', 'win', 'offer', 'remember', 'love',
  'consider', 'appear', 'buy', 'wait', 'serve', 'die', 'send', 'expect',
  'build', 'stay', 'fall', 'cut', 'reach', 'kill', 'remain', 'one', 'two',
  'first', 'new', 'good', 'long', 'great', 'little', 'own', 'old', 'right',
  'big', 'high', 'different', 'small', 'large', 'next', 'early', 'young',
  'important', 'public', 'bad', 'able', 'much', 'many', 'thing', 'things',
  'something', 'nothing', 'anything', 'everything', 'someone', 'anyone',
  'everyone', 'people', 'person', 'year', 'years', 'time', 'times', 'day',
  'days', 'week', 'weeks', 'month', 'months', 'work', 'part', 'place',
  'case', 'point', 'hand', 'state', 'number', 'home', 'world', 'area',
  'fact', 'group', 'problem', 'lot', 'note', 'notes', 'etc', 'eg', 'ie'
]);

export function tokenize(doc: ParsedDocument): TokenizedDocument {
  const text = doc.text.toLowerCase();
  
  // Split into words (alphanumeric sequences)
  const allWords = text.match(/[a-z0-9]+/g) || [];
  
  // Filter stopwords and short words
  const words = allWords.filter(w => 
    w.length > 2 && !STOPWORDS.has(w) && !/^\d+$/.test(w)
  );
  
  // Generate bigrams from adjacent words
  const bigrams: string[] = [];
  for (let i = 0; i < words.length - 1; i++) {
    bigrams.push(`${words[i]} ${words[i + 1]}`);
  }
  
  return {
    path: doc.path,
    name: doc.name,
    tokens: words,
    bigrams
  };
}
```

### scorer.ts

```typescript
import { TokenizedDocument, TermScore } from './types';
import { TermIndexSettings } from './settings';

interface TermDocEntry {
  path: string;
  name: string;
  count: number;
}

interface TermData {
  term: string;
  documents: Map<string, TermDocEntry>;
  totalCount: number;
}

export function calculateScores(
  documents: TokenizedDocument[],
  settings: TermIndexSettings
): TermScore[] {
  const termMap = new Map<string, TermData>();
  const docCount = documents.length;
  
  // 1. Build term frequency maps
  for (const doc of documents) {
    // Count unigrams
    const unigramCounts = new Map<string, number>();
    for (const token of doc.tokens) {
      unigramCounts.set(token, (unigramCounts.get(token) || 0) + 1);
    }
    
    // Count bigrams
    const bigramCounts = new Map<string, number>();
    for (const bigram of doc.bigrams) {
      bigramCounts.set(bigram, (bigramCounts.get(bigram) || 0) + 1);
    }
    
    // Add to termMap
    for (const [term, count] of unigramCounts) {
      addTermEntry(termMap, term, doc.path, doc.name, count);
    }
    for (const [term, count] of bigramCounts) {
      addTermEntry(termMap, term, doc.path, doc.name, count);
    }
  }
  
  // 2. Calculate TF-IDF scores
  const scores: TermScore[] = [];
  
  for (const [term, data] of termMap) {
    const docFreq = data.documents.size;
    
    // Filter: must appear in 2+ documents
    if (docFreq < 2) continue;
    
    // Filter: bigrams must appear in 2+ documents (already covered above)
    // But also check total occurrences for bigrams
    const isBigram = term.includes(' ');
    if (isBigram && data.totalCount < 2) continue;
    
    // Filter: minimum total occurrences
    if (data.totalCount < settings.minOccurrences) continue;
    
    // Calculate IDF
    const idf = Math.log(docCount / docFreq);
    
    // Calculate aggregate TF-IDF score (sum across documents)
    let totalScore = 0;
    for (const entry of data.documents.values()) {
      const tf = entry.count;  // Could normalize by doc length
      totalScore += tf * idf;
    }
    
    scores.push({
      term,
      score: totalScore,
      totalOccurrences: data.totalCount,
      documents: Array.from(data.documents.values())
        .sort((a, b) => b.count - a.count)  // Sort by count descending
    });
  }
  
  // 3. Sort by score and take top N
  scores.sort((a, b) => b.score - a.score);
  return scores.slice(0, settings.topN);
}

function addTermEntry(
  termMap: Map<string, TermData>,
  term: string,
  docPath: string,
  docName: string,
  count: number
): void {
  if (!termMap.has(term)) {
    termMap.set(term, {
      term,
      documents: new Map(),
      totalCount: 0
    });
  }
  
  const data = termMap.get(term)!;
  data.totalCount += count;
  
  if (!data.documents.has(docPath)) {
    data.documents.set(docPath, { path: docPath, name: docName, count: 0 });
  }
  data.documents.get(docPath)!.count += count;
}
```

### formatter.ts

```typescript
import { TermScore } from './types';

export function formatIndex(
  terms: TermScore[],
  title: string,
  timestamp: Date
): string {
  const lines: string[] = [];
  
  // Header
  lines.push(`# ${title}`);
  lines.push('');
  lines.push(`Generated: ${timestamp.toISOString().split('T')[0]} ${timestamp.toTimeString().split(' ')[0]}`);
  lines.push('');
  
  // Group by first letter
  const grouped = groupByFirstLetter(terms);
  const letters = Array.from(grouped.keys()).sort();
  
  for (const letter of letters) {
    lines.push(`## ${letter.toUpperCase()}`);
    lines.push('');
    
    const letterTerms = grouped.get(letter)!;
    // Sort alphabetically within letter
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

function groupByFirstLetter(terms: TermScore[]): Map<string, TermScore[]> {
  const groups = new Map<string, TermScore[]>();
  
  for (const term of terms) {
    const firstChar = term.term.charAt(0).toLowerCase();
    const letter = /[a-z]/.test(firstChar) ? firstChar : '#';  // Non-alpha goes to #
    
    if (!groups.has(letter)) {
      groups.set(letter, []);
    }
    groups.get(letter)!.push(term);
  }
  
  return groups;
}
```

### types.ts

```typescript
export interface FileInfo {
  path: string;
  name: string;
  content: string;
}

export interface ParsedDocument {
  path: string;
  name: string;
  text: string;
}

export interface TokenizedDocument {
  path: string;
  name: string;
  tokens: string[];
  bigrams: string[];
}

export interface TermScore {
  term: string;
  score: number;
  totalOccurrences: number;
  documents: {
    path: string;
    name: string;
    count: number;
  }[];
}
```

## Performance Considerations

### File Reading
- Use `vault.cachedRead()` instead of `vault.read()` for speed
- Process files sequentially to avoid memory spikes

### Memory
- For very large vaults, term maps could get large
- Consider streaming/chunked processing if needed
- Current design should handle 10K files without issues

### Progress Indication
- For large vaults, show a Notice with progress
- Could use `Notice` with progress percentage

## Error Handling

| Scenario | Handling |
|----------|----------|
| No files in scope | Throw with clear message |
| No terms meet threshold | Throw with threshold info |
| Folder not found | Throw with folder name |
| File read error | Skip file, continue, log warning |
| Index file write error | Throw with path info |

## Security Considerations

- Read-only access to vault (except index file)
- No external network calls
- No user data leaves the vault
