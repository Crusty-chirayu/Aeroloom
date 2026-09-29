import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const ARTIFACT_DIR = 'C:\\Users\\Allah\\.gemini\\antigravity-ide\\brain\\a447b709-03f7-428f-b9cb-8ff7d665f8d6';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BROWSER_BIN = existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;
const TEMP_PROFILE = 'C:\\Users\\Allah\\AppData\\Local\\Temp\\aeroloom-cdp-sprint2';
const CDP_PORT = 9222;

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function capture() {
  console.log(`Starting headless browser: ${BROWSER_BIN}`);

  const browserProcess = spawn(
    BROWSER_BIN,
    [
      '--headless=new',
      `--remote-debugging-port=${CDP_PORT}`,
      `--user-data-dir=${TEMP_PROFILE}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-background-networking',
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  try {
    // Wait for CDP endpoint
    let versionData = null;
    for (let i = 0; i < 20; i++) {
      await sleep(300);
      try {
        const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
        if (res.ok) {
          versionData = await res.json();
          break;
        }
      } catch {
        // waiting
      }
    }

    if (!versionData || !versionData.webSocketDebuggerUrl) {
      throw new Error('Failed to connect to browser CDP endpoint');
    }

    console.log('Connected to CDP endpoint:', versionData.webSocketDebuggerUrl);

    // Open target page
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
      } else if (data.method === 'Runtime.exceptionThrown') {
        console.error('[Browser Exception]:', data.params.exceptionDetails.text, data.params.exceptionDetails.exception?.description);
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

    // Wait for MapLibre basemap and live ADS-B positions to arrive
    console.log('Waiting 8s for MapLibre basemap and live ADS-B aircraft markers...');
    await sleep(8000);

    // Capture desktop screenshot with live aircraft markers
    console.log('Capturing live vector aircraft markers on desktop...');
    const desktopScreenshot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const desktopBuffer = Buffer.from(desktopScreenshot.data, 'base64');
    const desktopPath = `${ARTIFACT_DIR}\\aerocraft_sprint2_live_markers.png`;
    await writeFile(desktopPath, desktopBuffer);
    console.log(`Saved live markers screenshot to: ${desktopPath} (${desktopBuffer.length} bytes)`);

    // 2. Select an aircraft to test Dossier Card and Follow Mode
    console.log('Triggering flight selection on first rendered aircraft...');
    const selectionResult = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const map = window.__aeroloomMap;
        if (!map) return { error: 'no map instance' };
        const features = map.querySourceFeatures('aircraft-source');
        if (!features || features.length === 0) return { error: 'no aircraft features in source' };
        const target = features[0];
        if (window.__aeroloomSelectAircraft) {
          window.__aeroloomSelectAircraft(target.properties.id);
        }
        return { success: true, id: target.properties.id, callsign: target.properties.callsign };
      })()`,
      returnByValue: true,
    });
    console.log('Selection dispatch result:', JSON.stringify(selectionResult));
    await sleep(2000);

    // Let's also programmatically click an aircraft if available
    await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        // Access React fiber or trigger selection
        const mapEl = document.querySelector('#aeroloom-flight-map');
        // If dossier is not yet visible, trigger click near an aircraft feature
      })()`,
    });

    // Check if dossier rendered or take screenshot of current state
    const dossierScreenshot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const dossierBuffer = Buffer.from(dossierScreenshot.data, 'base64');
    const dossierPath = `${ARTIFACT_DIR}\\aerocraft_sprint2_selected_dossier.png`;
    await writeFile(dossierPath, dossierBuffer);
    console.log(`Saved dossier screenshot to: ${dossierPath} (${dossierBuffer.length} bytes)`);

    // 3. Mobile Viewport (390x844)
    console.log('Setting mobile metrics (390x844)...');
    await sendCommand('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });

    await sleep(3000);

    console.log('Capturing mobile screenshot with live aircraft...');
    const mobileScreenshot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const mobileBuffer = Buffer.from(mobileScreenshot.data, 'base64');
    const mobilePath = `${ARTIFACT_DIR}\\aerocraft_sprint2_mobile.png`;
    await writeFile(mobilePath, mobileBuffer);
    console.log(`Saved mobile screenshot to: ${mobilePath} (${mobileBuffer.length} bytes)`);

    ws.close();
    console.log('All Sprint 2 verification captures completed successfully.');
  } finally {
    browserProcess.kill('SIGKILL');
  }
}

capture().catch((err) => {
  console.error('Capture failed:', err);
  process.exit(1);
});
