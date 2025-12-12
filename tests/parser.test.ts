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

	it('removes indented code blocks', () => {
		const file: FileInfo = {
			path: 'test.md',
			name: 'test',
			content: 'Text\n    indented code\nMore text',
		};
		const result = parseDocument(file);
		expect(result.text).not.toContain('indented code');
		expect(result.text).toContain('Text');
		expect(result.text).toContain('More text');
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

	it('extracts display text from wiki links with aliases', () => {
		const file: FileInfo = {
			path: 'test.md',
			name: 'test',
			content: 'See [[target|display text]] for more.',
		};
		const result = parseDocument(file);
		expect(result.text).toContain('display text');
		expect(result.text).not.toContain('target|');
		expect(result.text).not.toContain('[[');
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

	it('removes embeds', () => {
		const file: FileInfo = {
			path: 'test.md',
			name: 'test',
			content: 'Text ![[image.png]] more text',
		};
		const result = parseDocument(file);
		expect(result.text).not.toContain('image.png');
		expect(result.text).not.toContain('![[');
		expect(result.text).toContain('Text');
		expect(result.text).toContain('more text');
	});

	it('extracts display text from markdown links', () => {
		const file: FileInfo = {
			path: 'test.md',
			name: 'test',
			content: 'Visit [my site](https://example.com) for info.',
		};
		const result = parseDocument(file);
		expect(result.text).toContain('my site');
		expect(result.text).not.toContain('https://');
		expect(result.text).not.toContain('[');
	});

	it('removes headers keeping the text', () => {
		const file: FileInfo = {
			path: 'test.md',
			name: 'test',
			content: '# Title\n## Subtitle\nContent',
		};
		const result = parseDocument(file);
		expect(result.text).toContain('Title');
		expect(result.text).toContain('Subtitle');
		expect(result.text).not.toContain('#');
	});

	it('removes bold formatting', () => {
		const file: FileInfo = {
			path: 'test.md',
			name: 'test',
			content: '**bold text** and __also bold__',
		};
		const result = parseDocument(file);
		expect(result.text).toContain('bold text');
		expect(result.text).toContain('also bold');
		expect(result.text).not.toContain('**');
		expect(result.text).not.toContain('__');
	});

	it('removes italic formatting', () => {
		const file: FileInfo = {
			path: 'test.md',
			name: 'test',
			content: '*italic text* and _also italic_',
		};
		const result = parseDocument(file);
		expect(result.text).toContain('italic text');
		expect(result.text).toContain('also italic');
	});

	it('removes strikethrough formatting', () => {
		const file: FileInfo = {
			path: 'test.md',
			name: 'test',
			content: '~~strikethrough text~~',
		};
		const result = parseDocument(file);
		expect(result.text).toContain('strikethrough text');
		expect(result.text).not.toContain('~~');
	});

	it('removes highlight formatting', () => {
		const file: FileInfo = {
			path: 'test.md',
			name: 'test',
			content: '==highlighted text==',
		};
		const result = parseDocument(file);
		expect(result.text).toContain('highlighted text');
		expect(result.text).not.toContain('==');
	});

	it('removes block quotes', () => {
		const file: FileInfo = {
			path: 'test.md',
			name: 'test',
			content: '> This is a quote\n> Second line',
		};
		const result = parseDocument(file);
		expect(result.text).toContain('This is a quote');
		expect(result.text).not.toContain('>');
	});

	it('removes list markers', () => {
		const file: FileInfo = {
			path: 'test.md',
			name: 'test',
			content: '- Item 1\n* Item 2\n+ Item 3\n1. Numbered',
		};
		const result = parseDocument(file);
		expect(result.text).toContain('Item 1');
		expect(result.text).toContain('Item 2');
		expect(result.text).toContain('Numbered');
	});

	it('removes tags', () => {
		const file: FileInfo = {
			path: 'test.md',
			name: 'test',
			content: 'This is #tag content',
		};
		const result = parseDocument(file);
		expect(result.text).toContain('This is');
		expect(result.text).toContain('content');
		expect(result.text).not.toContain('#tag');
	});

	it('removes HTML comments', () => {
		const file: FileInfo = {
			path: 'test.md',
			name: 'test',
			content: 'Text <!-- comment --> more text',
		};
		const result = parseDocument(file);
		expect(result.text).not.toContain('comment');
		expect(result.text).toContain('Text');
		expect(result.text).toContain('more text');
	});

	it('removes HTML tags', () => {
		const file: FileInfo = {
			path: 'test.md',
			name: 'test',
			content: '<div>text content</div>',
		};
		const result = parseDocument(file);
		expect(result.text).toContain('text content');
		expect(result.text).not.toContain('<div>');
		expect(result.text).not.toContain('</div>');
	});

	it('handles malformed frontmatter gracefully', () => {
		const file: FileInfo = {
			path: 'test.md',
			name: 'test',
			content: '---\ntitle: Test\nContent without closing',
		};
		const result = parseDocument(file);
		// Should not crash, just process as-is
		expect(result).toBeDefined();
		expect(result.path).toBe('test.md');
	});

	it('preserves file path and name', () => {
		const file: FileInfo = {
			path: 'folder/test.md',
			name: 'test',
			content: 'Simple content',
		};
		const result = parseDocument(file);
		expect(result.path).toBe('folder/test.md');
		expect(result.name).toBe('test');
	});

	it('handles complex nested markdown', () => {
		const file: FileInfo = {
			path: 'test.md',
			name: 'test',
			content: `---
title: Complex
---

# Header

Text with **bold** and *italic* and [[link|display]].

\`\`\`javascript
code here
\`\`\`

> Quote with **formatting**

- List item with \`code\`
`,
		};
		const result = parseDocument(file);
		expect(result.text).toContain('Header');
		expect(result.text).toContain('Text with');
		expect(result.text).toContain('bold');
		expect(result.text).toContain('italic');
		expect(result.text).toContain('display');
		expect(result.text).not.toContain('code here');
		expect(result.text).not.toContain('title: Complex');
	});
});
