import { formatIndex } from '../src/formatter';
import { TermScore } from '../src/types';

describe('formatIndex', () => {
	it('includes title as H1', () => {
		const terms: TermScore[] = [];
		const result = formatIndex(terms, 'Vault Index', new Date());

		expect(result).toContain('# Vault Index');
	});

	it('includes timestamp in correct format', () => {
		const terms: TermScore[] = [];
		const date = new Date('2025-01-15T10:30:00');
		const result = formatIndex(terms, 'Test', date);

		expect(result).toMatch(/Generated: 2025-01-15 \d{2}:\d{2}/);
	});

	it('groups terms by first letter', () => {
		const terms: TermScore[] = [
			{
				term: 'apple',
				score: 10,
				totalOccurrences: 5,
				documents: [{ path: 'doc.md', name: 'doc', count: 5 }],
			},
			{
				term: 'banana',
				score: 9,
				totalOccurrences: 4,
				documents: [{ path: 'doc.md', name: 'doc', count: 4 }],
			},
		];
		const result = formatIndex(terms, 'Test', new Date());

		expect(result).toContain('## A');
		expect(result).toContain('## B');
	});

	it('sorts terms alphabetically within groups', () => {
		const terms: TermScore[] = [
			{
				term: 'zebra',
				score: 10,
				totalOccurrences: 5,
				documents: [{ path: 'doc.md', name: 'doc', count: 5 }],
			},
			{
				term: 'apple',
				score: 9,
				totalOccurrences: 4,
				documents: [{ path: 'doc.md', name: 'doc', count: 4 }],
			},
		];
		const result = formatIndex(terms, 'Test', new Date());

		const appleIndex = result.indexOf('apple');
		const zebraIndex = result.indexOf('zebra');
		expect(appleIndex).toBeLessThan(zebraIndex);
	});

	it('formats terms with correct markdown', () => {
		const terms: TermScore[] = [
			{
				term: 'machine learning',
				score: 15,
				totalOccurrences: 12,
				documents: [
					{ path: 'doc1.md', name: 'doc1', count: 7 },
					{ path: 'doc2.md', name: 'doc2', count: 5 },
				],
			},
		];
		const result = formatIndex(terms, 'Test', new Date());

		expect(result).toContain('- **machine learning** (12 references)');
		expect(result).toContain('  - [[doc1]] (7)');
		expect(result).toContain('  - [[doc2]] (5)');
	});

	it('groups non-alphabetic terms under #', () => {
		const terms: TermScore[] = [
			{
				term: '3d-modeling',
				score: 10,
				totalOccurrences: 5,
				documents: [{ path: 'doc.md', name: 'doc', count: 5 }],
			},
			{
				term: 'alpha',
				score: 9,
				totalOccurrences: 4,
				documents: [{ path: 'doc.md', name: 'doc', count: 4 }],
			},
		];
		const result = formatIndex(terms, 'Test', new Date());

		expect(result).toContain('## #');
		expect(result).toContain('## A');
	});

	it('includes term count in header', () => {
		const terms: TermScore[] = [
			{
				term: 'test',
				score: 10,
				totalOccurrences: 5,
				documents: [{ path: 'doc.md', name: 'doc', count: 5 }],
			},
		];
		const result = formatIndex(terms, 'Test', new Date());

		expect(result).toMatch(/\*\*1 terms?\*\*/);
	});

	it('handles multiple documents per term sorted by count', () => {
		const terms: TermScore[] = [
			{
				term: 'popular',
				score: 20,
				totalOccurrences: 15,
				documents: [
					{ path: 'doc1.md', name: 'doc1', count: 1 },
					{ path: 'doc2.md', name: 'doc2', count: 10 },
					{ path: 'doc3.md', name: 'doc3', count: 4 },
				],
			},
		];
		const result = formatIndex(terms, 'Test', new Date());

		// Documents should appear in order: doc2 (10), doc3 (4), doc1 (1)
		const doc2Index = result.indexOf('[[doc2]]');
		const doc3Index = result.indexOf('[[doc3]]');
		const doc1Index = result.indexOf('[[doc1]]');

		expect(doc2Index).toBeLessThan(doc3Index);
		expect(doc3Index).toBeLessThan(doc1Index);
	});

	it('handles empty terms list', () => {
		const terms: TermScore[] = [];
		const result = formatIndex(terms, 'Empty Index', new Date());

		expect(result).toContain('# Empty Index');
		expect(result).toContain('**0 terms**');
	});

	it('formats timestamp with leading zeros', () => {
		const terms: TermScore[] = [];
		const date = new Date('2025-03-05T08:09:00');
		const result = formatIndex(terms, 'Test', date);

		expect(result).toContain('2025-03-05');
		expect(result).toMatch(/08:09|08:0\d/);
	});

	it('preserves case in term display', () => {
		const terms: TermScore[] = [
			{
				term: 'JavaScript',
				score: 10,
				totalOccurrences: 5,
				documents: [{ path: 'doc.md', name: 'doc', count: 5 }],
			},
		];
		const result = formatIndex(terms, 'Test', new Date());

		expect(result).toContain('**JavaScript**');
	});
});
