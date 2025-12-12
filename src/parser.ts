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
