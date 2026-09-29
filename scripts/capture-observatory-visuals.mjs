import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const ARTIFACT_DIR = 'C:\\Users\\Allah\\.gemini\\antigravity-ide\\brain\\dd5f0239-89c5-407a-bb7c-06ddbd4658c2';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BROWSER_BIN = existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;
const TEMP_PROFILE = 'C:\\Users\\Allah\\AppData\\Local\\Temp\\aeroloom-cdp-observatory-v2';
const CDP_PORT = 9224;

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function capture() {
  console.log(`Starting browser with WebGL flags: ${BROWSER_BIN} on port ${CDP_PORT}`);

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
      throw new Error('Failed to connect to browser CDP endpoint');
    }

    console.log('Connected to CDP endpoint');

    const newPageRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?http://localhost:3000`, {
      method: 'PUT',
    });
    const pageTarget = await newPageRes.json();

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    function sendCommand(method, params = {}) {
      return new Promise((resolve) => {
        const id = msgId++;
        const handler = (evt) => {
          const data = JSON.parse(evt.data);
          if (data.id === id) {
            ws.removeEventListener('message', handler);
            resolve(data.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await sendCommand('Page.enable');
    await sendCommand('Runtime.enable');

    ws.addEventListener('message', (evt) => {
      const data = JSON.parse(evt.data);
      if (data.method === 'Runtime.consoleAPICalled') {
        const text = data.params.args.map((a) => a.value || a.description || JSON.stringify(a)).join(' ');
        console.log(`[Browser Console ${data.params.type}]:`, text);
      }
    });

    // 1. Desktop Viewport (1440x900)
    console.log('Setting desktop metrics (1440x900)...');
    await sendCommand('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    console.log('Navigating to http://localhost:3000...');
    await sendCommand('Page.navigate', { url: 'http://localhost:3000' });

    console.log('Waiting 6s for landing page render...');
    await sleep(6000);

    // Simulate mouse movement for cursor displacement ripple
    console.log('Dispatching cursor displacement pointer events...');
    await sendCommand('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: 720,
      y: 420,
    });
    await sleep(400);

    // Capture Stage 1: 3D Landing Scene
    console.log('Capturing Stage 1: 3D Landing Scene...');
    const landingShot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const landingBuf = Buffer.from(landingShot.data, 'base64');
    const landingPath = `${ARTIFACT_DIR}\\observatory_landing_3d.png`;
    await writeFile(landingPath, landingBuf);
    console.log(`Saved landing screenshot to: ${landingPath} (${landingBuf.length} bytes)`);

    // 2. Trigger Option A Cinematic Dive into Live Map
    console.log('Triggering "ENTER LIVE AIRSPACE" dive action...');
    const diveEval = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        if (window.__aeroloomEnterAirspace) {
          window.__aeroloomEnterAirspace();
          return { success: true, method: 'windowHelper' };
        }
        const buttons = Array.from(document.querySelectorAll('button'));
        const enterBtn = buttons.find(b => b.textContent && b.textContent.includes('ENTER LIVE AIRSPACE'));
        if (enterBtn) {
          enterBtn.click();
          return { success: true, method: 'buttonClick' };
        }
        return { error: 'none found' };
      })()`,
      returnByValue: true,
    });
    console.log('Dive trigger result:', JSON.stringify(diveEval));

    // Wait for dive animation, cross-dissolve, and MapLibre vector map render
    console.log('Waiting 4s for dive transition...');
    await sleep(4000);

    // Force map resize in browser context to guarantee WebGL canvas paint
    await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        if (window.__aeroloomMap) {
          window.__aeroloomMap.resize();
        }
      })()`,
    });

    console.log('Waiting 7s for MapLibre basemap and live ADS-B positions to arrive...');
    await sleep(7000);

    // Capture Stage 2: Live Atmospheric Observatory Map with Altitude Strata
    console.log('Capturing Stage 2: Live Airspace Map with Altitude Strata...');
    const mapShot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const mapBuf = Buffer.from(mapShot.data, 'base64');
    const mapPath = `${ARTIFACT_DIR}\\observatory_live_map_strata.png`;
    await writeFile(mapPath, mapBuf);
    console.log(`Saved live map screenshot to: ${mapPath} (${mapBuf.length} bytes)`);

    // 3. Select an aircraft to test Horizon Dock Selected Target Stage
    console.log('Selecting first rendered aircraft to verify Horizon Dock Target Stage...');
    const selectRes = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const map = window.__aeroloomMap;
        let targetId = null;
        if (map) {
          const features = map.querySourceFeatures('aircraft-source');
          if (features && features.length > 0) {
            targetId = features[0].properties.id;
          }
        }
        if (!targetId) {
          // Fallback: check DOM elements or call helper
          const firstFlightBtn = document.querySelector('button[title*="target"], button');
        }
        if (window.__aeroloomSelectFlight && targetId) {
          window.__aeroloomSelectFlight(targetId);
          return { success: true, id: targetId };
        }
        return { attempted: true, targetId };
      })()`,
      returnByValue: true,
    });
    console.log('Aircraft selection result:', JSON.stringify(selectRes));
    await sleep(2500);

    // Capture Stage 3: Horizon Dock Selected Target Stage
    console.log('Capturing Stage 3: Horizon Dock Selected Target Stage...');
    const dossierShot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const dossierBuf = Buffer.from(dossierShot.data, 'base64');
    const dossierPath = `${ARTIFACT_DIR}\\observatory_selected_target_stage.png`;
    await writeFile(dossierPath, dossierBuf);
    console.log(`Saved dossier screenshot to: ${dossierPath} (${dossierBuf.length} bytes)`);

    // 4. Test Mobile Viewport (390x844)
    console.log('Setting mobile metrics (390x844)...');
    await sendCommand('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await sleep(3000);

    console.log('Capturing mobile viewport...');
    const mobileShot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const mobileBuf = Buffer.from(mobileShot.data, 'base64');
    const mobilePath = `${ARTIFACT_DIR}\\observatory_mobile.png`;
    await writeFile(mobilePath, mobileBuf);
    console.log(`Saved mobile screenshot to: ${mobilePath} (${mobileBuf.length} bytes)`);

    ws.close();
    console.log('All visual verification captures completed successfully.');
  } finally {
    browserProcess.kill('SIGKILL');
  }
}

capture().catch((err) => {
  console.error('Capture script error:', err);
  process.exit(1);
});
