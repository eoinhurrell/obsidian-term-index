# Manual Testing Guide

This guide provides step-by-step instructions for manually testing the Obsidian Term Index plugin.

## Prerequisites

- Obsidian installed (version 1.0.0 or higher)
- A test vault with at least 50-100 markdown files
- Built plugin artifacts (main.js and manifest.json)

## Setup Instructions

### 1. Build the Plugin

From the project directory:

```bash
bun install
bun run build
```

This creates `main.js` in the project root.

### 2. Install in Obsidian

1. Open your test vault in Obsidian
2. Navigate to the plugins folder:
   ```
   <YourVault>/.obsidian/plugins/obsidian-term-index/
   ```
3. If the folder doesn't exist, create it
4. Copy the following files from the project root to the plugin folder:
   - `main.js`
   - `manifest.json`

### 3. Enable the Plugin

1. Open Obsidian Settings
2. Navigate to **Settings → Community plugins**
3. Click **Reload plugins** (or restart Obsidian)
4. Enable "Term Index" in the plugin list
5. Verify console shows: `Term Index plugin loaded`

### 4. Recommended Test Vault Structure

For comprehensive testing, your vault should include:

- **50-100+ markdown files** with varied content
- **Multiple folders** (at least 3-4) with different topics
- **Some folders to exclude** (e.g., "templates", "daily-notes")
- Mix of technical and natural language content
- Files with frontmatter, code blocks, wiki links, and inline code

## Feature Testing Checklist

### Settings Configuration

1. Open **Settings → Term Index**
2. Verify all three settings are present:
   - **Top N Terms** (default: 250)
   - **Minimum Occurrences** (default: 10)
   - **Excluded Folders** (default: empty)
3. Change **Top N Terms** to 50, verify it saves
4. Add "templates" to **Excluded Folders**, verify it saves
5. Change **Minimum Occurrences** to 5, verify it saves
6. Restart Obsidian and verify settings persisted

**Expected**: All settings display correctly, changes persist across restarts.

### Generate Vault Index Command

1. Open command palette (Cmd/Ctrl + P)
2. Type "Generate Vault Index"
3. Select the command
4. Wait for processing (should show progress notice)
5. Verify completion notice shows term and file counts
6. Check that `vault-index.md` was created in vault root
7. Open the index file and verify:
   - Title is "# Vault Index"
   - Timestamp is present and correct (YYYY-MM-DD HH:MM)
   - Terms are grouped alphabetically (## A, ## B, etc.)
   - Each term shows: `**term** (N references)`
   - Document links are formatted: `  - [[filename]] (count)`
   - No stopwords appear (the, and, is, etc.)
   - Bigrams appear for common phrases (e.g., "machine learning")

**Expected**: Index generated successfully, format is correct, terms are meaningful.

### Generate Folder Index Command (with Picker)

1. Open command palette (Cmd/Ctrl + P)
2. Type "Generate Folder Index"
3. Select the command
4. Verify folder picker modal appears
5. Verify all folders in vault are listed
6. Select a folder (e.g., "notes")
7. Wait for processing
8. Verify completion notice shows term and file counts
9. Check that `folder-index.md` was created in the selected folder
10. Open the index and verify:
    - Title is "# Index: foldername"
    - Only files from that folder are referenced
    - Format matches vault index

**Expected**: Folder picker works, index generated only for selected folder.

### Right-Click Folder Context Menu

1. Navigate to file explorer in Obsidian
2. Right-click on any folder
3. Verify "Generate Term Index" menu item appears with list icon
4. Click the menu item
5. Wait for processing
6. Verify `folder-index.md` created in that folder
7. Open and verify format is correct

**Expected**: Context menu works, generates folder-specific index.

### Index File Format Verification

Open a generated index file and verify:

- **Title**: Proper H1 heading (# Vault Index or # Index: foldername)
- **Timestamp**: Format is YYYY-MM-DD HH:MM
- **Alphabetical Sections**: Each letter has ## heading (## A, ## B, etc.)
- **Term Format**: `**term** (N references)` where N is total count across all docs
- **Document Links**: Indented with `  - [[filename]] (count)` format
- **Sorting**: Terms within each letter are alphabetically sorted
- **Document Sorting**: Docs within each term are sorted by count (highest first)
- **No Stopwords**: Common words (the, and, is, of, to) should NOT appear
- **Bigrams Present**: Multi-word terms should appear (e.g., "neural network")
- **Non-alphabetic Section**: If any terms start with numbers/symbols, they should appear under `## #`

**Expected**: All formatting rules followed, output is clean and readable.

## Test Scenarios

### Scenario 1: Small Vault (10-50 files)

1. Test with a small vault
2. Generate vault index
3. Verify:
   - Completes quickly (<2 seconds)
   - All files are processed
   - Term counts seem reasonable
   - No errors in console

### Scenario 2: Medium Vault (100-200 files)

1. Test with a medium-sized vault
2. Generate vault index
3. Verify:
   - Completes in reasonable time (<5 seconds)
   - Term distribution makes sense
   - Top terms reflect vault content
   - Performance is acceptable

### Scenario 3: Excluded Folders Configuration

1. Set **Excluded Folders** to ["templates", "daily-notes"]
2. Generate vault index
3. Verify:
   - Files in "templates" folder are NOT included
   - Files in "daily-notes" folder are NOT included
   - Completion notice shows reduced file count
4. Generate folder index for "templates"
5. Verify:
   - Index is still generated (exclusion only applies to vault-wide index)

### Scenario 4: Empty Vault/Folder Handling

1. Create a new empty folder in vault
2. Right-click and select "Generate Term Index"
3. Verify:
   - Error notice appears: "No markdown files found in scope"
   - No index file is created
   - Error is logged to console

### Scenario 5: Terms Not Meeting Threshold

1. Set **Minimum Occurrences** to 1000 (very high)
2. Generate vault index
3. Verify:
   - Error notice appears: "No terms met the threshold"
   - Descriptive error message explains the issue
   - No index file is created

### Scenario 6: Regeneration and Overwriting

1. Generate vault index
2. Make note of a specific term in the index
3. Add new files to vault with different content
4. Regenerate vault index
5. Verify:
   - Old `vault-index.md` is overwritten (not duplicated)
   - New terms appear in the index
   - Term counts are updated

## Expected Results

### What a Good Index Looks Like

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
  - [[Transformers]] (4)
  - [[Computer Vision]] (3)

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

### Performance Benchmarks

Expected processing times (approximate):

- **100 files**: <1 second
- **500 files**: <3 seconds
- **1000 files**: <7 seconds
- **5000 files**: <30 seconds

If performance significantly exceeds these targets, investigate:
- Console errors or warnings
- Very large individual files
- Complex markdown with heavy nesting

### Common Issues and Troubleshooting

**Issue**: Plugin doesn't appear in settings
- **Solution**: Ensure `main.js` and `manifest.json` are in correct folder, reload plugins

**Issue**: "No terms met the threshold" error
- **Solution**: Lower the **Minimum Occurrences** setting (try 2-5)

**Issue**: Too many common words in index
- **Solution**: Increase **Minimum Occurrences** to filter noise

**Issue**: Bigrams not appearing
- **Solution**: Check that multi-word phrases appear at least 2 times across 2+ documents

**Issue**: Performance is slow
- **Solution**: Check vault size, consider excluding large folders (daily notes, templates)

**Issue**: Some folders not processed
- **Solution**: Check **Excluded Folders** setting, remove unwanted exclusions

**Issue**: Index file not created
- **Solution**: Check console for errors, verify write permissions on vault

## Acceptance Criteria

Mark testing complete when:

- [ ] Plugin loads without errors in console
- [ ] All three command triggers work (vault command, folder command, context menu)
- [ ] Settings persist across restarts
- [ ] Generated indexes have correct format
- [ ] No stopwords appear in generated indexes
- [ ] Bigrams appear for common multi-word phrases
- [ ] Wiki links in indexes are clickable
- [ ] Performance is acceptable for your vault size
- [ ] Excluded folders setting works correctly
- [ ] Empty vault/folder errors are handled gracefully
- [ ] High threshold errors are handled gracefully
- [ ] Regeneration overwrites old index files
- [ ] All items in Feature Testing Checklist verified

## Reporting Issues

If you encounter problems during testing:

1. Check the Obsidian console (Ctrl+Shift+I / Cmd+Option+I)
2. Note the exact error message
3. Document steps to reproduce
4. Include vault size and settings configuration
5. Report issue with all details
