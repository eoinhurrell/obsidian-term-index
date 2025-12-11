/**
 * Shared type definitions for the term index plugin.
 */

/** Raw file information from vault */
export interface FileInfo {
	path: string;     // Full path from vault root
	name: string;     // Filename without extension
	content: string;  // Raw markdown content
}

/** Document after markdown parsing */
export interface ParsedDocument {
	path: string;
	name: string;
	text: string;     // Clean text for tokenisation
}

/** Document after tokenisation */
export interface TokenizedDocument {
	path: string;
	name: string;
	tokens: string[];   // Unigrams
	bigrams: string[];  // Bigrams
}

/** Document reference within a term */
export interface DocumentReference {
	path: string;
	name: string;
	count: number;
}

/** Scored term with document references */
export interface TermScore {
	term: string;
	score: number;              // TF-IDF score (for ranking)
	totalOccurrences: number;   // Sum of counts across all docs
	documents: DocumentReference[];
}
