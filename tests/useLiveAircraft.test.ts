import React from 'react';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { useLiveAircraft } from '../hooks/useLiveAircraft.ts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function patchReactDispatcher(r: any) {
  const mockDispatcher = {
    useState: (initial: unknown) => [typeof initial === 'function' ? (initial as () => unknown)() : initial, () => {}],
    useEffect: () => {},
    useRef: (initial: unknown) => ({ current: initial }),
    useCallback: (fn: unknown) => fn,
    useMemo: (factory: () => unknown) => factory(),
  };

  const targets = [
    r,
    r?.default,
    r?.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
    r?.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
    r?.default?.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
    r?.default?.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
  ];

  for (const t of targets) {
    if (!t) continue;
    t.H = mockDispatcher;
    if (t.ReactCurrentDispatcher) {
      t.ReactCurrentDispatcher.current = mockDispatcher;
    }
  }
}

describe('useLiveAircraft Hook Tests', () => {
  it('initializes breadcrumbsMapRef and returns array for selected trail without throwing', () => {
    patchReactDispatcher(React);

    const result = useLiveAircraft({ enabled: false });
    assert.ok(result);
    assert.strictEqual(Array.isArray(result.selectedAircraftTrail), true);
    assert.strictEqual(result.selectedAircraftTrail.length, 0);
    assert.strictEqual(result.selectedAircraftId, null);

    assert.doesNotThrow(() => {
      result.setSelectedAircraftId('a1435d');
    });
  });
});
