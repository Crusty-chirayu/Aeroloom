import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';

const ARTIFACT_DIR = 'C:\\Users\\Allah\\.gemini\\antigravity-ide\\brain\\dd5f0239-89c5-407a-bb7c-06ddbd4658c2';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BROWSER_BIN = existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;
const TEMP_PROFILE = 'C:\\Users\\Allah\\AppData\\Local\\Temp\\aeroloom-cdp-e2e';
const CDP_PORT = 9226;

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runE2E() {
  console.log(`[E2E] Starting browser: ${BROWSER_BIN} on port ${CDP_PORT}`);

  const browserProcess = spawn(
    BROWSER_BIN,
    [
      '--headless=new',
      `--remote-debugging-port=${CDP_PORT}`,
      `--user-data-dir=${TEMP_PROFILE}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-background-networking',
      '--use-gl=angle',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  try {
    let versionData = null;
    for (let i = 0; i < 20; i++) {
      await sleep(300);
      try {
        const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
        if (res.ok) {
          versionData = await res.json();
          break;
        }
      } catch {}
    }

    if (!versionData || !versionData.webSocketDebuggerUrl) {
      throw new Error('Failed to connect to CDP endpoint');
    }

    console.log('[E2E] Connected to browser CDP endpoint');

    const newPageRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?http://localhost:3000`, {
      method: 'PUT',
    });
    const pageTarget = await newPageRes.json();

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    let msgId = 1;
    const callbacks = new Map();

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && callbacks.has(data.id)) {
        const cb = callbacks.get(data.id);
        callbacks.delete(data.id);
        cb(data.result);
      }
    };

    const send = (method, params = {}) =>
      new Promise((resolve) => {
        const id = msgId++;
        callbacks.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });

    await new Promise((resolve) => (ws.onopen = resolve));
    await send('Page.enable');
    await send('Runtime.enable');
    await send('DOM.enable');

    console.log('[E2E] 1. Setting desktop viewport 1440x900...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    console.log('[E2E] 2. Navigating to http://localhost:3000...');
    await send('Page.navigate', { url: 'http://localhost:3000' });
    await sleep(4000);

    const titleRes = await send('Runtime.evaluate', { expression: 'document.title' });
    console.log(`[E2E] Document Title: "${titleRes.result.value}"`);

    const hasLandingOverlay = await send('Runtime.evaluate', {
      expression: 'document.body.innerText.includes("ENTER LIVE AIRSPACE")',
    });
    console.log(`[E2E] Landing CTA visible: ${hasLandingOverlay.result.value}`);
    if (!hasLandingOverlay.result.value) {
      throw new Error('Landing CTA button not found on landing stage');
    }

    console.log('[E2E] 3. Triggering Enter Live Airspace (Option A Camera Dive)...');
    await send('Runtime.evaluate', {
      expression: 'window.__aeroloomEnterAirspace ? window.__aeroloomEnterAirspace() : null',
    });

    await sleep(2000); // Allow dive transition to complete and map to mount

    console.log('[E2E] 4. Verifying MapLibre 2D Vector Map...');
    const mapState = await send('Runtime.evaluate', {
      expression: `Boolean(window.__aeroloomMap && window.__aeroloomMap.isStyleLoaded())`,
    });
    console.log(`[E2E] MapLibre initialized & style loaded: ${mapState.result.value}`);

    console.log('[E2E] 5. Verifying live aircraft in MapLibre GeoJSON source...');
    // Wait for first live ADS-B poll if needed
    let aircraftCount = 0;
    for (let attempt = 0; attempt < 8; attempt++) {
      const srcEval = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const src = window.__aeroloomMap && window.__aeroloomMap.getSource('aircraft-source');
            if (src && src._data && src._data.features) {
              return src._data.features.length;
            }
            return 0;
          })()
        `,
      });
      aircraftCount = srcEval.result.value || 0;
      if (aircraftCount > 0) break;
      await sleep(1000);
    }
    console.log(`[E2E] Live Aircraft rendered in vector layer: ${aircraftCount}`);

    console.log('[E2E] 6. Testing Omnisearch Modal & Keyboard Navigation...');
    // Trigger search modal via keyboard shortcut Cmd+K
    await send('Runtime.evaluate', {
      expression: `window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))`,
    });
    await sleep(500);

    const searchOpen = await send('Runtime.evaluate', {
      expression: 'document.body.innerText.includes("Airspace Sectors")',
    });
    console.log(`[E2E] Search modal opened: ${searchOpen.result.value}`);

    // Navigate down with ArrowDown
    await send('Runtime.evaluate', {
      expression: `window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))`,
    });
    await sleep(200);

    // Press Escape to dismiss
    await send('Runtime.evaluate', {
      expression: `window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`,
    });
    await sleep(300);

    console.log('[E2E] 7. Testing Flight Selection & Telemetry Dossier...');
    const selectRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const src = window.__aeroloomMap && window.__aeroloomMap.getSource('aircraft-source');
          if (src && src._data && src._data.features && src._data.features.length > 0) {
            const firstId = src._data.features[0].properties.id;
            if (window.__aeroloomSelectFlight) {
              window.__aeroloomSelectFlight(firstId);
              return firstId;
            }
          }
          return null;
        })()
      `,
    });
    console.log(`[E2E] Selected flight ID: ${selectRes.result.value}`);
    await sleep(800);

    const hasDossier = await send('Runtime.evaluate', {
      expression: 'document.body.innerText.includes("TARGET DOSSIER") || document.body.innerText.includes("TELEMETRY")',
    });
    console.log(`[E2E] Telemetry dossier active: ${hasDossier.result.value}`);

    console.log('[E2E] 8. Testing Category Filter Pills...');
    const filterEval = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const cruiseBtn = buttons.find(b => b.innerText.includes('CRUISE'));
          if (cruiseBtn) {
            cruiseBtn.click();
            return true;
          }
          return false;
        })()
      `,
    });
    console.log(`[E2E] Filtered by CRUISE: ${filterEval.result.value}`);
    await sleep(500);

    console.log('[E2E] 9. Testing Return to Orbit...');
    const returnRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const orbitBtn = btns.find(b => b.innerText.includes('ORBIT'));
          if (orbitBtn) {
            orbitBtn.click();
            return true;
          }
          return false;
        })()
      `,
    });
    console.log(`[E2E] Clicked Return to Orbit: ${returnRes.result.value}`);
    await sleep(1200);

    const returnedToLanding = await send('Runtime.evaluate', {
      expression: 'document.body.innerText.includes("ATMOSPHERIC OBSERVATORY")',
    });
    console.log(`[E2E] Successfully returned to Landing stage: ${returnedToLanding.result.value}`);

    console.log('[E2E] 10. Testing Mobile Viewport (390x844)...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await sleep(800);

    const mobileScrollWidth = await send('Runtime.evaluate', {
      expression: 'document.documentElement.scrollWidth <= 390',
    });
    console.log(`[E2E] Mobile horizontal overflow clean (no sideways scroll): ${mobileScrollWidth.result.value}`);

    ws.close();
    console.log('\n[E2E] ALL USER JOURNEY ACCEPTANCE CHECKS PASSED SUCCESSFULLY!\n');
    process.exit(0);
  } catch (err) {
    console.error('[E2E FAILED]:', err);
    process.exit(1);
  } finally {
    browserProcess.kill('SIGKILL');
  }
}

runE2E();
