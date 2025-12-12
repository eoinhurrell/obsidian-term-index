import { calculateScores } from '../src/scorer';
import { TokenizedDocument } from '../src/types';
import { TermIndexSettings } from '../src/settings';

describe('calculateScores', () => {
	const settings: TermIndexSettings = {
		topN: 10,
		minOccurrences: 2,
		excludedFolders: [],
	};

	it('calculates TF-IDF scores for terms', () => {
		const docs: TokenizedDocument[] = [
			{
				path: 'doc1.md',
				name: 'doc1',
				tokens: ['machine', 'learning', 'algorithm'],
				bigrams: ['machine learning'],
			},
			{
				path: 'doc2.md',
				name: 'doc2',
				tokens: ['machine', 'learning', 'data'],
				bigrams: ['machine learning'],
			},
		];

		const scores = calculateScores(docs, settings);

		expect(scores.length).toBeGreaterThan(0);
		// machine learning appears in both docs, should have score
		const mlTerm = scores.find((s) => s.term === 'machine learning');
		expect(mlTerm).toBeDefined();
		expect(mlTerm!.score).toBeGreaterThan(0);
	});

	it('filters out single-document terms', () => {
		const docs: TokenizedDocument[] = [
			{
				path: 'doc1.md',
				name: 'doc1',
				tokens: ['unique', 'common'],
				bigrams: [],
			},
			{
				path: 'doc2.md',
				name: 'doc2',
				tokens: ['common', 'another'],
				bigrams: [],
			},
		];

		const scores = calculateScores(docs, settings);

		// 'unique' and 'another' appear in only 1 doc, should be filtered
		expect(scores.find((s) => s.term === 'unique')).toBeUndefined();
		expect(scores.find((s) => s.term === 'another')).toBeUndefined();
		// 'common' appears in 2 docs, should be included
		expect(scores.find((s) => s.term === 'common')).toBeDefined();
	});

	it('filters terms below minOccurrences threshold', () => {
		const settingsHighMin: TermIndexSettings = {
			topN: 10,
			minOccurrences: 5,
			excludedFolders: [],
		};

		const docs: TokenizedDocument[] = [
			{
				path: 'doc1.md',
				name: 'doc1',
				tokens: ['rare', 'rare', 'common', 'common', 'common'],
				bigrams: [],
			},
			{
				path: 'doc2.md',
				name: 'doc2',
				tokens: ['rare', 'common', 'common', 'common'],
				bigrams: [],
			},
		];

		const scores = calculateScores(docs, settingsHighMin);

		// 'rare' appears 3 times total (< 5), should be filtered
		expect(scores.find((s) => s.term === 'rare')).toBeUndefined();
		// 'common' appears 6 times total (>= 5), should be included
		expect(scores.find((s) => s.term === 'common')).toBeDefined();
	});

	it('filters bigrams appearing in only one document', () => {
		const docs: TokenizedDocument[] = [
			{
				path: 'doc1.md',
				name: 'doc1',
				tokens: ['alpha', 'beta'],
				bigrams: ['alpha beta'],
			},
			{
				path: 'doc2.md',
				name: 'doc2',
				tokens: ['gamma', 'delta'],
				bigrams: ['gamma delta'],
			},
		];

		const scores = calculateScores(docs, settings);

		// Both bigrams appear in only 1 doc, should be filtered
		expect(scores.find((s) => s.term === 'alpha beta')).toBeUndefined();
		expect(scores.find((s) => s.term === 'gamma delta')).toBeUndefined();
	});

	it('enforces top N limit', () => {
		const settingsLowN: TermIndexSettings = {
			topN: 2,
			minOccurrences: 2,
			excludedFolders: [],
		};

		const docs: TokenizedDocument[] = [
			{
				path: 'doc1.md',
				name: 'doc1',
				tokens: ['alpha', 'beta', 'gamma'],
				bigrams: [],
			},
			{
				path: 'doc2.md',
				name: 'doc2',
				tokens: ['alpha', 'beta', 'gamma'],
				bigrams: [],
			},
		];

		const scores = calculateScores(docs, settingsLowN);

		// Should return at most 2 terms
		expect(scores.length).toBeLessThanOrEqual(2);
	});

	it('sorts scores in descending order', () => {
		const docs: TokenizedDocument[] = [
			{
				path: 'doc1.md',
				name: 'doc1',
				tokens: ['alpha', 'alpha', 'beta'],
				bigrams: [],
			},
			{
				path: 'doc2.md',
				name: 'doc2',
				tokens: ['alpha', 'beta', 'beta'],
				bigrams: [],
			},
			{
				path: 'doc3.md',
				name: 'doc3',
				tokens: ['alpha', 'beta'],
				bigrams: [],
			},
		];

		const scores = calculateScores(docs, settings);

		// Scores should be in descending order
		for (let i = 0; i < scores.length - 1; i++) {
			expect(scores[i].score).toBeGreaterThanOrEqual(scores[i + 1].score);
		}
	});

	it('sorts documents within terms by count descending', () => {
		const docs: TokenizedDocument[] = [
			{
				path: 'doc1.md',
				name: 'doc1',
				tokens: ['term', 'term', 'term'],
				bigrams: [],
			},
			{
				path: 'doc2.md',
				name: 'doc2',
				tokens: ['term'],
				bigrams: [],
			},
			{
				path: 'doc3.md',
				name: 'doc3',
				tokens: ['term', 'term'],
				bigrams: [],
			},
		];

		const scores = calculateScores(docs, settings);
		const termScore = scores.find((s) => s.term === 'term');

		expect(termScore).toBeDefined();
		expect(termScore!.documents).toHaveLength(3);
		// Should be sorted: doc1 (3), doc3 (2), doc2 (1)
		expect(termScore!.documents[0].count).toBe(3);
		expect(termScore!.documents[1].count).toBe(2);
		expect(termScore!.documents[2].count).toBe(1);
	});

	it('calculates totalOccurrences correctly', () => {
		const docs: TokenizedDocument[] = [
			{
				path: 'doc1.md',
				name: 'doc1',
				tokens: ['word', 'word', 'word'],
				bigrams: [],
			},
			{
				path: 'doc2.md',
				name: 'doc2',
				tokens: ['word', 'word'],
				bigrams: [],
			},
		];

		const scores = calculateScores(docs, settings);
		const wordScore = scores.find((s) => s.term === 'word');

		expect(wordScore).toBeDefined();
		expect(wordScore!.totalOccurrences).toBe(5);
	});

	it('handles empty document list', () => {
		const docs: TokenizedDocument[] = [];
		const scores = calculateScores(docs, settings);

		expect(scores).toEqual([]);
	});

	it('processes both unigrams and bigrams', () => {
		const docs: TokenizedDocument[] = [
			{
				path: 'doc1.md',
				name: 'doc1',
				tokens: ['machine', 'learning'],
				bigrams: ['machine learning'],
			},
			{
				path: 'doc2.md',
				name: 'doc2',
				tokens: ['machine', 'learning'],
				bigrams: ['machine learning'],
			},
		];

		const scores = calculateScores(docs, settings);

		// Should have both unigrams and bigram
		expect(scores.find((s) => s.term === 'machine')).toBeDefined();
		expect(scores.find((s) => s.term === 'learning')).toBeDefined();
		expect(scores.find((s) => s.term === 'machine learning')).toBeDefined();
	});
});
