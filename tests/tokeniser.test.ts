import { tokenize } from '../src/tokeniser';
import { ParsedDocument } from '../src/types';

describe('tokenize', () => {
	it('extracts words and removes stopwords', () => {
		const doc: ParsedDocument = {
			path: 'test.md',
			name: 'test',
			text: 'The transformer architecture is a neural network model.',
		};
		const result = tokenize(doc);

		expect(result.tokens).toContain('transformer');
		expect(result.tokens).toContain('architecture');
		expect(result.tokens).toContain('neural');
		expect(result.tokens).toContain('network');
		expect(result.tokens).toContain('model');
		expect(result.tokens).not.toContain('the');
		expect(result.tokens).not.toContain('is');
		expect(result.tokens).not.toContain('a');
	});

	it('generates bigrams from adjacent words', () => {
		const doc: ParsedDocument = {
			path: 'test.md',
			name: 'test',
			text: 'machine learning algorithms process data efficiently',
		};
		const result = tokenize(doc);

		expect(result.bigrams).toContain('machine learning');
		expect(result.bigrams).toContain('learning algorithms');
		expect(result.bigrams).toContain('algorithms process');
		expect(result.bigrams).toContain('process data');
	});

	it('lowercases all tokens', () => {
		const doc: ParsedDocument = {
			path: 'test.md',
			name: 'test',
			text: 'Python JavaScript TypeScript',
		};
		const result = tokenize(doc);

		expect(result.tokens).toContain('python');
		expect(result.tokens).toContain('javascript');
		expect(result.tokens).toContain('typescript');
		expect(result.tokens).not.toContain('Python');
		expect(result.tokens).not.toContain('JavaScript');
	});

	it('filters out short words (<=2 chars)', () => {
		const doc: ParsedDocument = {
			path: 'test.md',
			name: 'test',
			text: 'AI is an ML API for NLP',
		};
		const result = tokenize(doc);

		// Words <= 2 chars should be filtered
		expect(result.tokens).not.toContain('ai');
		expect(result.tokens).not.toContain('is');
		expect(result.tokens).not.toContain('an');
		expect(result.tokens).not.toContain('ml');
		expect(result.tokens).toContain('api');
		expect(result.tokens).toContain('nlp');
	});

	it('filters common English stopwords', () => {
		const doc: ParsedDocument = {
			path: 'test.md',
			name: 'test',
			text: 'This is the best approach for how it works with some data',
		};
		const result = tokenize(doc);

		// Should filter stopwords
		expect(result.tokens).not.toContain('this');
		expect(result.tokens).not.toContain('the');
		expect(result.tokens).not.toContain('for');
		expect(result.tokens).not.toContain('how');
		expect(result.tokens).not.toContain('it');
		expect(result.tokens).not.toContain('with');
		expect(result.tokens).not.toContain('some');

		// Should keep meaningful words
		expect(result.tokens).toContain('best');
		expect(result.tokens).toContain('approach');
		expect(result.tokens).toContain('works');
		expect(result.tokens).toContain('data');
	});

	it('handles words with numbers', () => {
		const doc: ParsedDocument = {
			path: 'test.md',
			name: 'test',
			text: 'python3 es2015 http2 ipv6',
		};
		const result = tokenize(doc);

		expect(result.tokens).toContain('python3');
		expect(result.tokens).toContain('es2015');
		expect(result.tokens).toContain('http2');
		expect(result.tokens).toContain('ipv6');
	});

	it('filters pure numbers', () => {
		const doc: ParsedDocument = {
			path: 'test.md',
			name: 'test',
			text: 'version 123 release 456',
		};
		const result = tokenize(doc);

		expect(result.tokens).toContain('version');
		expect(result.tokens).toContain('release');
		// Pure numbers should be filtered
		expect(result.tokens).not.toContain('123');
		expect(result.tokens).not.toContain('456');
	});

	it('preserves file path and name', () => {
		const doc: ParsedDocument = {
			path: 'folder/test.md',
			name: 'test',
			text: 'simple content',
		};
		const result = tokenize(doc);

		expect(result.path).toBe('folder/test.md');
		expect(result.name).toBe('test');
	});

	it('generates bigrams only from filtered words', () => {
		const doc: ParsedDocument = {
			path: 'test.md',
			name: 'test',
			text: 'the machine learning model',
		};
		const result = tokenize(doc);

		// 'the' should be filtered, so bigrams should skip it
		expect(result.bigrams).toContain('machine learning');
		expect(result.bigrams).toContain('learning model');
		// Should not create bigram with stopword
		expect(result.bigrams).not.toContain('the machine');
	});

	it('handles empty text', () => {
		const doc: ParsedDocument = {
			path: 'test.md',
			name: 'test',
			text: '',
		};
		const result = tokenize(doc);

		expect(result.tokens).toEqual([]);
		expect(result.bigrams).toEqual([]);
	});

	it('handles text with only stopwords', () => {
		const doc: ParsedDocument = {
			path: 'test.md',
			name: 'test',
			text: 'the and or but if',
		};
		const result = tokenize(doc);

		expect(result.tokens).toEqual([]);
		expect(result.bigrams).toEqual([]);
	});

	it('generates correct number of bigrams', () => {
		const doc: ParsedDocument = {
			path: 'test.md',
			name: 'test',
			text: 'alpha beta gamma delta',
		};
		const result = tokenize(doc);

		// 4 words -> 3 bigrams
		expect(result.tokens).toHaveLength(4);
		expect(result.bigrams).toHaveLength(3);
		expect(result.bigrams[0]).toBe('alpha beta');
		expect(result.bigrams[1]).toBe('beta gamma');
		expect(result.bigrams[2]).toBe('gamma delta');
	});
});
