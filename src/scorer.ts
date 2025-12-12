import { TfIdf } from 'natural';
import { TokenizedDocument, TermScore, DocumentReference } from './types';
import { TermIndexSettings } from './settings';

interface TermData {
	documents: Map<string, DocumentReference>;
	totalCount: number;
}

/**
 * Calculate TF-IDF scores for all terms across documents.
 */
export function calculateScores(
	documents: TokenizedDocument[],
	settings: TermIndexSettings
): TermScore[] {
	if (documents.length === 0) {
		return [];
	}

	const termMap = new Map<string, TermData>();
	const docCount = documents.length;

	// Build natural's TfIdf instance
	const tfidf = new TfIdf();

	// Add all documents to TfIdf
	for (const doc of documents) {
		// Combine tokens and bigrams for this document
		const allTerms = [...doc.tokens, ...doc.bigrams];
		tfidf.addDocument(allTerms);
	}

	// Build term frequency data and collect all unique terms
	for (let docIndex = 0; docIndex < documents.length; docIndex++) {
		const doc = documents[docIndex];

		// Count unigrams
		const counts = new Map<string, number>();
		for (const token of doc.tokens) {
			counts.set(token, (counts.get(token) || 0) + 1);
		}
		for (const bigram of doc.bigrams) {
			counts.set(bigram, (counts.get(bigram) || 0) + 1);
		}

		// Add to global term map
		for (const [term, count] of counts) {
			if (!termMap.has(term)) {
				termMap.set(term, { documents: new Map(), totalCount: 0 });
			}
			const data = termMap.get(term)!;
			data.totalCount += count;
			data.documents.set(doc.path, {
				path: doc.path,
				name: doc.name,
				count,
			});
		}
	}

	// Calculate scores and filter
	const scores: TermScore[] = [];

	for (const [term, data] of termMap) {
		const docFreq = data.documents.size;

		// Must appear in 2+ documents
		if (docFreq < 2) continue;

		// Must meet minimum occurrences
		if (data.totalCount < settings.minOccurrences) continue;

		// Bigrams need extra filtering (must appear in 2+ docs, already covered)
		const isBigram = term.includes(' ');
		if (isBigram && data.totalCount < 2) continue;

		// Calculate aggregate TF-IDF score
		// We sum the TF-IDF scores across all documents where the term appears
		let totalScore = 0;
		for (let docIndex = 0; docIndex < documents.length; docIndex++) {
			const doc = documents[docIndex];
			const docRef = data.documents.get(doc.path);
			if (docRef) {
				// Get TF-IDF score from natural's TfIdf
				const tfidfScore = tfidf.tfidf(term, docIndex);
				totalScore += tfidfScore;
			}
		}

		scores.push({
			term,
			score: totalScore,
			totalOccurrences: data.totalCount,
			documents: Array.from(data.documents.values()).sort(
				(a, b) => b.count - a.count
			),
		});
	}

	// Sort by score descending and take top N
	scores.sort((a, b) => b.score - a.score);
	return scores.slice(0, settings.topN);
}
