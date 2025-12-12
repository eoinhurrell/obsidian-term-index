# Term Index

An Obsidian plugin that automatically generates TF-IDF based term indexes for your vault or individual folders, helping you discover the most important concepts and topics across your notes.

## Overview

Term Index analyzes your markdown files and generates comprehensive indexes that highlight the most significant terms and phrases in your vault. Using TF-IDF (Term Frequency-Inverse Document Frequency) scoring, the plugin identifies terms that are both frequent and distinctive, filtering out common words to surface the concepts that truly matter.

The generated indexes are organized alphabetically with clickable wiki links to source documents, making it easy to explore related notes and discover connections across your knowledge base.

## Features

- **TF-IDF Scoring**: Uses statistical analysis to identify important terms, not just frequent ones
- **Unigram and Bigram Support**: Captures both single words and multi-word phrases (e.g., "machine learning", "neural network")
- **Three Ways to Generate**:
  - Command palette: Generate vault-wide index
  - Command palette: Generate folder index with picker
  - Right-click context menu: Generate index for specific folder
- **Configurable Settings**:
  - Adjust number of top terms to include
  - Set minimum occurrence threshold
  - Exclude specific folders (templates, daily notes, etc.)
- **Alphabetical Grouping**: Terms organized by first letter for easy navigation
- **Intelligent Filtering**: Automatically removes stopwords, markdown syntax, code blocks, and frontmatter

## Installation

### From Community Plugins (Coming Soon)

1. Open **Settings → Community plugins**
2. Click **Browse** and search for "Term Index"
3. Click **Install**, then **Enable**

### Manual Installation

1. Download the latest release from GitHub
2. Extract `main.js` and `manifest.json` to your vault's plugins folder:
   ```
   <YourVault>/.obsidian/plugins/obsidian-term-index/
   ```
3. Reload Obsidian or restart the app
4. Enable the plugin in **Settings → Community plugins**

### Build from Source

```bash
git clone https://github.com/yourusername/obsidian-term-index.git
cd obsidian-term-index
bun install
bun run build
```

Copy `main.js` and `manifest.json` to your vault's plugin folder.

## Usage

### Generate Vault Index

Creates a comprehensive index for your entire vault:

1. Open command palette (Cmd/Ctrl + P)
2. Type "Generate Vault Index"
3. Press Enter

The plugin will create `vault-index.md` in your vault root containing all significant terms across all notes.

### Generate Folder Index

Creates an index for a specific folder:

**Option 1: Using Command Palette**
1. Open command palette (Cmd/Ctrl + P)
2. Type "Generate Folder Index"
3. Select a folder from the picker
4. Press Enter

**Option 2: Using Context Menu**
1. Right-click on any folder in the file explorer
2. Select "Generate Term Index"

The plugin will create `folder-index.md` in the selected folder containing terms from that folder's notes.

### Using Generated Indexes

Generated indexes are standard markdown files with the following features:

- **Clickable Links**: All document references are wiki links you can click to open the source note
- **Term Frequency**: Each term shows total reference count across all documents
- **Document Counts**: Each document link shows how many times the term appears
- **Alphabetical Organization**: Terms grouped by first letter for quick scanning

## Configuration

Access settings in **Settings → Term Index**:

### Top N Terms

- **Default**: 250
- **Description**: Maximum number of terms to include in the generated index
- **Recommendation**:
  - Small vaults (50-200 files): 100-150
  - Medium vaults (200-1000 files): 200-300
  - Large vaults (1000+ files): 300-500

### Minimum Occurrences

- **Default**: 10
- **Description**: Minimum number of times a term must appear across all documents to be included
- **Recommendation**:
  - Small vaults: 2-5
  - Medium vaults: 5-10
  - Large vaults: 10-20
  - Adjust higher to reduce noise, lower to capture more terms

### Excluded Folders

- **Default**: (empty)
- **Description**: Comma-separated list of folder paths to exclude from vault-wide indexing
- **Common Exclusions**: templates, daily-notes, archive, attachments
- **Note**: Folder-specific indexes can still be generated for excluded folders

## Output Format

Generated indexes follow this structure:

```markdown
# Vault Index

Generated: 2025-01-15 14:30

## A

**artificial intelligence** (45 references)
  - [[AI Overview]] (12)
  - [[Machine Learning Basics]] (8)
  - [[Deep Learning]] (7)
  - [[Neural Networks]] (6)
  - [[AI Applications]] (5)

**attention mechanism** (23 references)
  - [[Transformers]] (10)
  - [[Deep Learning]] (7)
  - [[Neural Networks]] (6)

## B

**backpropagation** (18 references)
  - [[Neural Networks]] (9)
  - [[Training Algorithms]] (5)
  - [[Deep Learning]] (4)
```

### Format Details

- **Title**: `# Vault Index` or `# Index: foldername`
- **Timestamp**: ISO date and time when index was generated
- **Alphabetical Sections**: Each letter has its own `## Heading`
- **Term Lines**: `**term** (N references)` where N is total count across all documents
- **Document Links**: Indented with `  - [[filename]] (count)` showing per-document frequency
- **Non-Alphabetic Terms**: Grouped under `## #` section

## Performance

Expected index generation times (approximate):

| Vault Size | Expected Time |
|------------|---------------|
| 100 files  | < 1 second    |
| 500 files  | < 3 seconds   |
| 1000 files | < 7 seconds   |
| 5000 files | < 30 seconds  |

Performance depends on:
- Average file size
- Complexity of markdown (heavy use of code blocks, links, etc.)
- System resources

The plugin uses efficient caching and processing to minimize vault scanning time.

## Development

### Prerequisites

- [Bun](https://bun.sh) (1.0.0 or higher)
- Node.js compatible environment
- Obsidian (1.0.0 or higher)

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/obsidian-term-index.git
cd obsidian-term-index

# Install dependencies
bun install
```

### Development Build

```bash
# Start development build with watch mode
bun run dev
```

This will watch for changes and automatically rebuild `main.js`.

### Production Build

```bash
# Create optimized production build
bun run build
```

### Testing

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run tests with coverage
bun test --coverage
```

### Project Structure

```
obsidian-term-index/
├── src/
│   ├── main.ts           # Plugin entry point, lifecycle management
│   ├── types.ts          # TypeScript interfaces and types
│   ├── settings.ts       # Settings interface and UI
│   ├── parser.ts         # Markdown parsing and cleaning
│   ├── tokeniser.ts      # Text tokenization and bigram generation
│   ├── scorer.ts         # TF-IDF scoring using natural library
│   ├── formatter.ts      # Index markdown generation
│   └── generator.ts      # Pipeline orchestration
├── tests/
│   ├── __mocks__/        # Obsidian API mocks
│   ├── fixtures/         # Test data
│   └── *.test.ts         # Test files
├── docs/
│   └── MANUAL_TESTING.md # Manual testing guide
├── manifest.json         # Plugin metadata
├── package.json          # Dependencies and scripts
├── esbuild.config.mjs    # Build configuration
└── tsconfig.json         # TypeScript configuration
```

### Architecture

The plugin uses a pipeline architecture:

1. **Collection**: Gather markdown files from vault, apply exclusions
2. **Parsing**: Remove frontmatter, code blocks, extract link text, strip markdown syntax
3. **Tokenization**: Split text into words, remove stopwords, generate bigrams
4. **Scoring**: Calculate TF-IDF scores, filter by thresholds, rank terms
5. **Formatting**: Generate alphabetically organized markdown index
6. **Output**: Write index file to vault

### Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for new functionality
4. Ensure all tests pass (`bun test`)
5. Commit your changes with descriptive messages
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Style

- Use TypeScript with strict mode
- Follow existing code organization patterns
- Write tests for new features (TDD preferred)
- Keep functions focused and modular
- Document complex logic with comments

## Troubleshooting

### Plugin Not Loading

- Verify `main.js` and `manifest.json` are in the correct plugin folder
- Check Obsidian console (Ctrl+Shift+I / Cmd+Option+I) for errors
- Try reloading plugins or restarting Obsidian

### No Terms Generated

- Error: "No terms met the threshold"
- **Solution**: Lower the "Minimum Occurrences" setting to 2-5
- **Cause**: Vault may not have enough repeated terms to meet the default threshold

### Too Many Common Words

- **Solution**: Increase "Minimum Occurrences" to filter noise
- **Alternative**: Reduce "Top N Terms" to focus on most important terms

### Slow Performance

- **Check**: Vault size and excluded folders setting
- **Solution**: Add high-volume folders (daily notes, templates) to exclusions
- **Note**: Performance should still be reasonable for vaults under 5000 files

### Bigrams Not Appearing

- **Requirement**: Multi-word phrases must appear at least 2 times across 2+ documents
- **Solution**: Check that phrases actually repeat in multiple documents
- **Note**: Rare phrases will be filtered out by design

### Index File Not Created

- **Check**: Console for specific error messages
- **Verify**: Vault has write permissions
- **Try**: Generating index for a smaller folder first

## License

MIT License - see LICENSE file for details

## Support

- **Issues**: Report bugs and request features on [GitHub Issues](https://github.com/yourusername/obsidian-term-index/issues)
- **Discussions**: Ask questions on [GitHub Discussions](https://github.com/yourusername/obsidian-term-index/discussions)

## Acknowledgments

- Built with [Obsidian API](https://docs.obsidian.md)
- TF-IDF implementation using [natural](https://github.com/NaturalNode/natural) library
- Inspired by the need to surface important concepts in large knowledge bases
