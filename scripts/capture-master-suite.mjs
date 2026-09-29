import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const ARTIFACT_DIR = 'C:\\Users\\Allah\\.gemini\\antigravity-ide\\brain\\dd5f0239-89c5-407a-bb7c-06ddbd4658c2';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BROWSER_BIN = existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;
const TEMP_PROFILE = 'C:\\Users\\Allah\\AppData\\Local\\Temp\\aeroloom-cdp-master';
const CDP_PORT = 9228;

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

class CdpConnection {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.callbacks = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    };
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.id;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async screenshot(filename) {
    const { data } = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(data, 'base64');
    await writeFile(`${ARTIFACT_DIR}\\${filename}`, buffer);
    console.log(`[E2E] Saved screenshot: ${filename} (${buffer.length} bytes)`);
  }
}

async function runMasterAcceptance() {
  console.log(`[Master Suite] Launching browser: ${BROWSER_BIN} on port ${CDP_PORT}`);

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

    console.log('[Master Suite] Connected to CDP endpoint');

    const newPageRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?http://localhost:3000/?stage=observatory`, {
      method: 'PUT',
    });
    const pageTarget = await newPageRes.json();
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    const cdp = new CdpConnection(ws);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    // 1. Desktop Observatory Live Map with Enriched Telemetry
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    console.log('[Master Suite] Waiting for map and telemetry stream...');
    await sleep(4000);

    // Click first aircraft if available
    await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          if (window.__aeroloomSelectAircraft) {
            // Select known aircraft
            window.__aeroloomSelectAircraft('a38d95');
          }
        })()
      `,
    });
    await sleep(1500);
    await cdp.screenshot('master_observatory_live_map.png');

    // 2. Flight Dossier Detail Page
    console.log('[Master Suite] Navigating to /flight/jbu277...');
    await cdp.send('Page.navigate', { url: 'http://localhost:3000/flight/jbu277' });
    await sleep(2500);
    await cdp.screenshot('master_flight_dossier.png');

    // 3. Global Airports Directory
    console.log('[Master Suite] Navigating to /airports...');
    await cdp.send('Page.navigate', { url: 'http://localhost:3000/airports' });
    await sleep(2000);
    await cdp.screenshot('master_airports_directory.png');

    // 4. Airport Terminal Radar
    console.log('[Master Suite] Navigating to /airport/jfk...');
    await cdp.send('Page.navigate', { url: 'http://localhost:3000/airport/jfk' });
    await sleep(2500);
    await cdp.screenshot('master_airport_terminal_jfk.png');

    // 5. Operations Dashboard
    console.log('[Master Suite] Navigating to /dashboard...');
    await cdp.send('Page.navigate', { url: 'http://localhost:3000/dashboard' });
    await sleep(2000);
    await cdp.screenshot('master_dashboard_operations.png');

    // 6. Mobile Layout Live Map (390 x 844 iPhone viewport)
    console.log('[Master Suite] Testing mobile responsive viewport 390x844...');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await cdp.send('Page.navigate', { url: 'http://localhost:3000/?stage=observatory' });
    await sleep(3000);
    await cdp.screenshot('master_mobile_observatory.png');

    console.log('[Master Suite] ALL SCREENSHOTS SUCCESSFULLY CAPTURED!');
    ws.close();
  } finally {
    browserProcess.kill();
  }
}

runMasterAcceptance().catch((err) => {
  console.error('[Master Suite Error]', err);
  process.exit(1);
});
