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
			// Ensure documents are sorted by count descending
			const sortedDocs = [...term.documents].sort((a, b) => b.count - a.count);
			for (const doc of sortedDocs) {
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
