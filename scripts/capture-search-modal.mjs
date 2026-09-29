import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const ARTIFACT_DIR = 'C:\\Users\\Allah\\.gemini\\antigravity-ide\\brain\\dd5f0239-89c5-407a-bb7c-06ddbd4658c2';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BROWSER_BIN = existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;
const TEMP_PROFILE = 'C:\\Users\\Allah\\AppData\\Local\\Temp\\aeroloom-cdp-search';
const CDP_PORT = 9225;

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function capture() {
  console.log(`Starting browser for search verification on port ${CDP_PORT}`);

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

    await sendCommand('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    await sendCommand('Page.navigate', { url: 'http://localhost:3000' });
    await sleep(4000);

    // Enter airspace
    await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        if (window.__aeroloomEnterAirspace) window.__aeroloomEnterAirspace();
      })()`,
    });
    await sleep(4000);

    // Open search modal via Cmd+K or clicking search button
    console.log('Opening Omnisearch Modal...');
    await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const searchBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Search Flight'));
        if (searchBtn) searchBtn.click();
      })()`,
    });
    await sleep(1000);

    // Type query "JFK" into the search input
    console.log('Typing search query "JFK"...');
    await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const input = document.querySelector('input[placeholder*="Search live callsign"]');
        if (input) {
          input.value = 'JFK';
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      })()`,
    });
    await sleep(1500);

    // Capture Omnisearch modal screenshot
    console.log('Capturing Omnisearch modal screenshot...');
    const searchShot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const searchBuf = Buffer.from(searchShot.data, 'base64');
    const searchPath = `${ARTIFACT_DIR}\\observatory_omnisearch_modal.png`;
    await writeFile(searchPath, searchBuf);
    console.log(`Saved search screenshot to: ${searchPath} (${searchBuf.length} bytes)`);

    ws.close();
  } finally {
    browserProcess.kill('SIGKILL');
  }
}

capture().catch((err) => {
  console.error('Search capture error:', err);
  process.exit(1);
});
