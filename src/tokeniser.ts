import { ParsedDocument, TokenizedDocument } from './types';

/**
 * Common English stopwords to filter out.
 * Extended list covering common words that don't carry meaning.
 */
const STOPWORDS = new Set([
	// Articles, conjunctions, prepositions
	'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
	'of', 'with', 'by', 'from', 'as', 'into', 'through', 'during', 'before',
	'after', 'above', 'below', 'between', 'under', 'over', 'out', 'off',
	'up', 'down', 'about', 'against', 'among', 'throughout', 'despite',
	'towards', 'upon', 'within', 'without', 'according', 'alongside',

	// Pronouns
	'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you',
	'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself',
	'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them',
	'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this',
	'that', 'these', 'those', 'there', 'here', 'where', 'when', 'why', 'how',

	// Common verbs
	'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
	'having', 'do', 'does', 'did', 'doing', 'will', 'would', 'could', 'should',
	'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used',
	'get', 'gets', 'got', 'getting', 'make', 'makes', 'made', 'making',
	'go', 'goes', 'went', 'gone', 'going', 'take', 'takes', 'took', 'taken',
	'come', 'comes', 'came', 'coming', 'see', 'sees', 'saw', 'seen', 'seeing',
	'know', 'knows', 'knew', 'known', 'think', 'thinks', 'thought', 'thinking',
	'want', 'wants', 'wanted', 'give', 'gives', 'gave', 'given', 'find',
	'use', 'uses', 'using', 'say', 'says', 'said',

	// Quantifiers and determiners
	'all', 'any', 'both', 'each', 'every', 'few', 'more', 'most', 'other',
	'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than',
	'too', 'very', 'just', 'also', 'even', 'still', 'already', 'always',
	'never', 'ever', 'often', 'usually', 'sometimes', 'again', 'further',
	'then', 'once', 'much', 'many', 'another', 'several', 'enough',

	// Common nouns (too generic)
	'thing', 'things', 'something', 'nothing', 'anything', 'everything',
	'someone', 'anyone', 'everyone', 'nobody', 'people', 'person', 'way',
	'ways', 'time', 'times', 'year', 'years', 'day', 'days', 'part', 'parts',
	'place', 'case', 'cases', 'point', 'points', 'fact', 'facts', 'example',
	'lot', 'lots', 'kind', 'type', 'number', 'set', 'different', 'following',
	'note', 'notes', 'page', 'section',

	// Miscellaneous
	'however', 'therefore', 'thus', 'hence', 'although', 'though', 'while',
	'whereas', 'whether', 'because', 'since', 'unless', 'until', 'if',
	'well', 'back', 'like', 'now', 'new', 'first', 'last', 'long', 'great',
	'little', 'good', 'right', 'big', 'high', 'small', 'large', 'next',
	'early', 'young', 'old', 'important', 'able', 'bad', 'etc', 'eg', 'ie',
	'via', 'per', 'based', 'related', 'include', 'includes', 'including',
]);

/**
 * Tokenize a parsed document into unigrams and bigrams.
 */
export function tokenize(doc: ParsedDocument): TokenizedDocument {
	const text = doc.text.toLowerCase();

	// Extract words: sequences of letters and numbers
	const allWords = text.match(/[a-z][a-z0-9]*/g) || [];

	// Filter: remove stopwords, very short words, and pure numbers
	const words = allWords.filter(
		(w) => w.length > 2 && !STOPWORDS.has(w) && !/^\d+$/.test(w)
	);

	// Generate bigrams from adjacent filtered words
	const bigrams: string[] = [];
	for (let i = 0; i < words.length - 1; i++) {
		bigrams.push(`${words[i]} ${words[i + 1]}`);
	}

	return {
		path: doc.path,
		name: doc.name,
		tokens: words,
		bigrams,
	};
}
