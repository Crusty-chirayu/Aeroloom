import type { AeroloomExportBundle } from './persistenceAdapter';

export function validateBundle(data: unknown): { valid: boolean; error?: string; bundle?: AeroloomExportBundle } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'File content is not a valid JSON object.' };
  }

  const b = data as Partial<AeroloomExportBundle>;
  if (b.version !== '1.0') {
    return { valid: false, error: 'Unsupported bundle version. Only version "1.0" is supported.' };
  }

  if (!Array.isArray(b.watchlists) && !Array.isArray(b.savedFlights)) {
    return { valid: false, error: 'Bundle must contain at least a watchlists or savedFlights array.' };
  }

  return {
    valid: true,
    bundle: {
      version: '1.0',
      exportedAt: typeof b.exportedAt === 'number' ? b.exportedAt : Date.now(),
      savedFlights: Array.isArray(b.savedFlights) ? b.savedFlights : [],
      watchlists: Array.isArray(b.watchlists) ? b.watchlists : [],
      alerts: Array.isArray(b.alerts) ? b.alerts : [],
    },
  };
}
