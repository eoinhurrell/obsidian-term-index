import { DEFAULT_SETTINGS, TermIndexSettings } from '../src/settings';

describe('Settings', () => {
	it('should have correct default values', () => {
		expect(DEFAULT_SETTINGS.topN).toBe(250);
		expect(DEFAULT_SETTINGS.minOccurrences).toBe(10);
		expect(DEFAULT_SETTINGS.excludedFolders).toEqual([]);
	});

	it('should have proper types', () => {
		expect(typeof DEFAULT_SETTINGS.topN).toBe('number');
		expect(typeof DEFAULT_SETTINGS.minOccurrences).toBe('number');
		expect(Array.isArray(DEFAULT_SETTINGS.excludedFolders)).toBe(true);
	});

	it('should validate positive numbers', () => {
		const settings: TermIndexSettings = { ...DEFAULT_SETTINGS };

		// Valid values
		settings.topN = 100;
		expect(settings.topN).toBeGreaterThan(0);

		settings.minOccurrences = 5;
		expect(settings.minOccurrences).toBeGreaterThan(0);
	});

	it('should handle excluded folders as array of strings', () => {
		const settings: TermIndexSettings = {
			...DEFAULT_SETTINGS,
			excludedFolders: ['templates', 'daily'],
		};

		expect(settings.excludedFolders).toHaveLength(2);
		expect(settings.excludedFolders[0]).toBe('templates');
		expect(settings.excludedFolders[1]).toBe('daily');
	});
});
