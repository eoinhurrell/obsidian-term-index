# obsidian-term-index — Product Requirements Document

## Executive Summary

obsidian-term-index is an Obsidian plugin that generates a markdown glossary/index of the most important terms in your vault (or a specific folder). It uses TF-IDF scoring to surface terms that are significant to your notes, helping you rediscover forgotten content and build connections between notes.

## Problem Statement

Large vaults become difficult to navigate. You forget what's in there. When writing new notes, you don't know what existing concepts you could link to. Backlinks help, but only if you already know the term exists.

An auto-generated term index solves this by:
1. Surfacing the vocabulary of your vault
2. Showing where each term appears
3. Acting as a glossary you can reference while writing

## Target Users

Obsidian users with medium-to-large vaults (100+ notes) who:
- Want to rediscover forgotten content
- Need a reference glossary when connecting notes
- Don't want to maintain a manual index

## Product Vision

A simple, manual-trigger plugin that generates a clean markdown index you can browse, search, and reference—no background processing, no complex UI, just a useful file.

## Success Metrics

1. Index generation completes in <10 seconds for vaults under 1000 files
2. Generated index surfaces genuinely useful terms (not noise)
3. Zero runtime overhead (manual trigger only)

## MVP Scope

### In Scope

**Index Generation**
- Full vault indexing
- Single folder indexing
- TF-IDF scoring with stopword removal
- Unigram and bigram extraction
- Alphabetically organised output

**Output Format**
```markdown
# Vault Index

Generated: 2025-01-15 10:30

## A

- **attention mechanism** (24 references)
  - [[attention-paper]] (8)
  - [[transformer-notes]] (6)
  - [[bert-deep-dive]] (5)
  - [[ml-overview]] (3)
  - [[gpt-architecture]] (2)

- **autoencoder** (15 references)
  - [[vae-notes]] (7)
  - [[generative-models]] (5)
  - [[dimensionality-reduction]] (3)

## B

- **backpropagation** (18 references)
  ...
```

**Commands**
- "Generate Vault Index" — indexes entire vault, creates `vault-index.md` in vault root
- "Generate Folder Index" — prompts for folder selection, creates `folder-index.md` in that folder
- Right-click folder → "Generate Index" — indexes selected folder

**Configuration**
- Top N terms (default: 250)
- Minimum occurrences (default: 10)
- Excluded folders (default: empty)

### Out of Scope (Future)

- Real-time/automatic index updates
- Custom output location
- Stemming/lemmatization
- Multi-language stopword lists
- Tag/link integration
- Search UI within plugin
- Block-level references (link to specific occurrence)

## User Stories

### Index Generation

1. **As a** vault owner, **I want to** generate a full vault index **so that** I can see what terms are most significant across all my notes.

2. **As a** vault owner, **I want to** generate an index for a specific folder **so that** I can see the vocabulary of a particular topic area.

3. **As a** vault owner, **I want to** right-click a folder and generate its index **so that** I don't have to navigate away from the file explorer.

### Index Usage

4. **As a** note writer, **I want to** browse the index alphabetically **so that** I can find terms I might want to link to.

5. **As a** note writer, **I want to** see which files contain a term **so that** I can read related content.

6. **As a** note writer, **I want to** see occurrence counts **so that** I know which files focus most on a term.

### Configuration

7. **As a** vault owner, **I want to** exclude certain folders (templates, daily notes) **so that** the index isn't polluted with irrelevant terms.

8. **As a** vault owner, **I want to** adjust the minimum occurrence threshold **so that** I can filter out rare terms.

9. **As a** vault owner, **I want to** control how many terms appear **so that** the index stays manageable.

## Functional Requirements

### Term Extraction

| Requirement | Detail |
|-------------|--------|
| Tokenisation | Split on whitespace and punctuation |
| Case | Case-insensitive (normalise to lowercase) |
| Stopwords | Remove English stopwords |
| N-grams | Extract unigrams and bigrams |
| Bigram filter | Bigrams must appear in 2+ files |
| Code blocks | Exclude content in code blocks |
| Frontmatter | Exclude YAML frontmatter |
| Links/embeds | Extract display text, not raw syntax |

### Scoring

| Requirement | Detail |
|-------------|--------|
| Algorithm | TF-IDF |
| TF | Term frequency within document |
| IDF | Inverse document frequency across corpus |
| Ranking | Sort by TF-IDF score descending |
| Display | Score used for ranking only, not shown |

### Filtering

| Requirement | Detail |
|-------------|--------|
| Min occurrences | Term must appear N+ times total (default: 10) |
| Min documents | Term must appear in 2+ documents |
| Top N | Only include top N terms by score (default: 250) |
| Excluded folders | Skip files in configured folders |

### Output

| Requirement | Detail |
|-------------|--------|
| Format | Markdown |
| Filename (vault) | `vault-index.md` in vault root |
| Filename (folder) | `folder-index.md` in indexed folder |
| Structure | Alphabetical by term, grouped by first letter |
| Term display | `**term** (N references)` |
| File links | `[[filename]] (count)` per line, indented |
| File ordering | By occurrence count descending |
| Timestamp | Generation timestamp at top |

## Non-Functional Requirements

### Performance
- Vault index generation: <10 seconds for 1000 files
- Folder index generation: <2 seconds for 100 files
- No background processing or file watchers

### Compatibility
- Obsidian 1.0.0+
- Desktop and mobile (if Obsidian API permits)

### Reliability
- Graceful handling of malformed markdown
- Clear error messages for edge cases
- No data loss (read-only except for index file)

## Configuration Schema

```typescript
interface TermIndexSettings {
  topN: number;           // Default: 250
  minOccurrences: number; // Default: 10
  excludedFolders: string[]; // Default: []
}
```

## Edge Cases

| Case | Handling |
|------|----------|
| Empty vault | Show message, don't create empty index |
| No terms meet threshold | Show message explaining thresholds |
| Index file already exists | Overwrite with confirmation? Or just overwrite? |
| Folder doesn't exist | Show error |
| Very large vault (10K+ files) | Show progress notice, consider chunked processing |
| Binary files in vault | Skip non-markdown files |
| Circular links | N/A (not traversing links) |
