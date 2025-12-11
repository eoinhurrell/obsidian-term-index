# Testing Plan

## Overview

Testing covers:
1. **Unit tests** — Parser, tokeniser, scorer, formatter
2. **Integration tests** — Full pipeline with test fixtures
3. **Manual tests** — In Obsidian with real vault

## Unit Tests

### Parser Tests (`tests/parser.test.ts`)

| Test Case | Input | Expected Output |
|-----------|-------|-----------------|
| Remove frontmatter | `---\ntitle: X\n---\nContent` | `Content` |
| Remove fenced code | `Text\n\`\`\`js\ncode\n\`\`\`\nMore` | `Text More` |
| Remove indented code | `Text\n    code line\nMore` | `Text More` |
| Remove inline code | `Use \`func\` here` | `Use here` |
| Wiki link with alias | `[[target\|display]]` | `display` |
| Wiki link plain | `[[some note]]` | `some note` |
| Markdown link | `[text](url)` | `text` |
| Remove embeds | `![[image.png]]` | (empty) |
| Remove headers | `# Title\nContent` | `Title Content` |
| Remove bold | `**bold text**` | `bold text` |
| Remove tags | `#tag content` | `content` |
| Remove HTML | `<div>text</div>` | `text` |

### Tokeniser Tests (`tests/tokeniser.test.ts`)

| Test Case | Input | Expected |
|-----------|-------|----------|
| Basic tokenisation | `"machine learning"` | tokens: `["machine", "learning"]` |
| Stopword removal | `"the quick brown fox"` | tokens: `["quick", "brown", "fox"]` |
| Short word filter | `"AI is an ML tool"` | filters `ai`, `is`, `an`, `ml` |
| Lowercase | `"Python JavaScript"` | `["python", "javascript"]` |
| Bigram generation | `"neural network model"` | bigrams: `["neural network", "network model"]` |
| Numbers filtered | `"version 2 release"` | tokens: `["version", "release"]` |
| Mixed alphanumeric | `"python3 es2015"` | tokens: `["python3", "es2015"]` |

### Scorer Tests (`tests/scorer.test.ts`)

| Test Case | Setup | Expected |
|-----------|-------|----------|
| Basic TF-IDF | 3 docs, term in 2 | Score > 0, IDF applied |
| Single-doc filter | Term in only 1 doc | Excluded |
| Min occurrences | Term with 5 occurrences, min=10 | Excluded |
| Bigram filter | Bigram in 1 doc only | Excluded |
| Top N limit | 300 terms, topN=250 | Returns 250 |
| Score ordering | Multiple terms | Sorted by score desc |
| Document ordering | Term in multiple docs | Docs sorted by count desc |

### Formatter Tests (`tests/formatter.test.ts`)

| Test Case | Input | Expected Output Contains |
|-----------|-------|--------------------------|
| Title | title="Vault Index" | `# Vault Index` |
| Timestamp | date object | `Generated: YYYY-MM-DD HH:MM` |
| Letter grouping | terms starting a, b | `## A`, `## B` |
| Alphabetical sort | terms "zoo", "apple" | "apple" before "zoo" |
| Term format | term with 15 refs | `**term** (15 references)` |
| Doc links | doc "notes" with 3 | `[[notes]] (3)` |
| Non-alpha terms | term "3d-model" | Under `## #` section |

## Integration Tests

### Full Pipeline Test

Create test fixtures in `tests/fixtures/`:

```
tests/fixtures/
├── doc1.md
├── doc2.md
├── doc3.md
└── expected-index.md
```

**doc1.md**:
```markdown
---
title: Machine Learning Basics
---

# Machine Learning

Machine learning is a subset of artificial intelligence.
Neural networks are a type of machine learning model.
```

**doc2.md**:
```markdown
# Neural Networks

Neural networks use layers of neurons.
Deep learning uses deep neural networks.
Machine learning encompasses neural networks.
```

**doc3.md**:
```markdown
# Deep Learning

Deep learning is a subset of machine learning.
Transformers are a type of neural network.
Attention mechanisms power transformers.
```

**Test expectations**:
- "machine learning" appears as bigram (high score)
- "neural networks" appears as bigram
- "deep learning" appears as bigram
- All three docs should be referenced

### Edge Case Tests

| Case | Setup | Expected |
|------|-------|----------|
| Empty vault | No markdown files | Error: "No markdown files found" |
| No qualifying terms | All terms < minOccurrences | Error with threshold info |
| Large file | 100KB markdown | Processes without error |
| Unicode content | Japanese/emoji text | Skipped (only a-z tokens) |
| Nested code blocks | Code in blockquote | Properly removed |
| Malformed frontmatter | `---` without closing | Handles gracefully |

## Manual Testing Checklist

### Plugin Installation
- [ ] Plugin appears in Community Plugins list
- [ ] Plugin enables without error
- [ ] Settings tab appears with correct defaults

### Settings
- [ ] Can change Top N value
- [ ] Can change Min Occurrences
- [ ] Can add excluded folders (comma-separated)
- [ ] Settings persist after reload

### Generate Vault Index
- [ ] Command appears in Command Palette
- [ ] Shows "Generating..." notice
- [ ] Creates `vault-index.md` in vault root
- [ ] Shows completion notice with term/file count
- [ ] Index file has correct format
- [ ] Wiki links work (clicking navigates)

### Generate Folder Index
- [ ] Command appears in Command Palette
- [ ] Folder picker modal opens
- [ ] Can select a folder
- [ ] Creates `folder-index.md` in selected folder
- [ ] Only indexes files in that folder

### Folder Context Menu
- [ ] Right-click folder shows "Generate Term Index"
- [ ] Clicking generates index for that folder
- [ ] Index created in clicked folder

### Index Content
- [ ] Terms are alphabetically grouped
- [ ] Terms within groups are alphabetical
- [ ] Document references sorted by count
- [ ] Counts are accurate
- [ ] No stopwords in index
- [ ] Bigrams appear appropriately

### Error Handling
- [ ] Empty folder shows error notice
- [ ] No qualifying terms shows error with threshold info
- [ ] Console shows detailed error for debugging

### Performance
- [ ] Small vault (<100 files): < 2 seconds
- [ ] Medium vault (100-500 files): < 5 seconds
- [ ] Large vault (500-1000 files): < 10 seconds

### Regeneration
- [ ] Running again overwrites existing index
- [ ] No duplicate files created

### Exclusions
- [ ] Excluded folders are skipped
- [ ] Index files themselves are excluded
- [ ] Daily notes folder exclusion works

## Test Fixtures

### Minimal Test Vault

Create a test vault with controlled content:

```
test-vault/
├── folder-a/
│   ├── note1.md      # Contains: transformer, attention (5x each)
│   └── note2.md      # Contains: transformer, bert (3x each)
├── folder-b/
│   ├── note3.md      # Contains: attention, bert (4x each)
│   └── note4.md      # Contains: gpt, transformer (2x each)
├── templates/
│   └── template.md   # Should be excluded
└── daily/
    └── 2025-01-01.md # Should be excluded if configured
```

### Expected Results

With default settings (top 250, min 10), expected terms:
- "transformer" — appears in 3 files, ~10 occurrences
- "attention" — appears in 2 files, ~9 occurrences
- "bert" — appears in 2 files, ~7 occurrences

Terms that should NOT appear:
- "gpt" — only 2 occurrences (below threshold)
- Anything from templates/ (if excluded)

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
      - run: npm run build
```

## Performance Benchmarks

Target performance on reference hardware (M1 MacBook):

| Vault Size | Files | Expected Time |
|------------|-------|---------------|
| Small | 100 | < 1s |
| Medium | 500 | < 3s |
| Large | 1000 | < 7s |
| Very Large | 5000 | < 30s |

If performance degrades significantly, consider:
- Chunked processing with progress updates
- Web Worker for background processing (if Obsidian supports)
- Caching tokenised documents
