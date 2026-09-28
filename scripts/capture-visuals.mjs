import { spawn } from 'node:child_process';
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const ARTIFACT_DIR = 'C:\\Users\\Allah\\.gemini\\antigravity-ide\\brain\\a447b709-03f7-428f-b9cb-8ff7d665f8d6';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BROWSER_BIN = existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;
const TEMP_PROFILE = 'C:\\Users\\Allah\\AppData\\Local\\Temp\\aeroloom-cdp-profile';
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
    // Wait for CDP endpoint to be available
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
        // still starting
      }
    }

    if (!versionData || !versionData.webSocketDebuggerUrl) {
      throw new Error('Failed to connect to browser CDP endpoint');
    }

    console.log('Connected to CDP endpoint:', versionData.webSocketDebuggerUrl);

    // Create a new target page
    const newPageRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?http://localhost:3000`, {
      method: 'PUT',
    });
    const pageTarget = await newPageRes.json();
    console.log('Opened page target:', pageTarget.id);

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

    // Wait for WebGL canvas and tiles to settle
    console.log('Waiting 6s for MapLibre basemap tiles to render on desktop...');
    await sleep(6000);

    // Capture desktop screenshot
    console.log('Capturing desktop screenshot...');
    const desktopScreenshot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const desktopBuffer = Buffer.from(desktopScreenshot.data, 'base64');
    const desktopPath = `${ARTIFACT_DIR}\\aerocraft_desktop_map.png`;
    await writeFile(desktopPath, desktopBuffer);
    console.log(`Saved desktop screenshot to: ${desktopPath} (${desktopBuffer.length} bytes)`);

    // 2. Interactive Sector Switch: Fly to SoCal Tracon
    console.log('Testing sector switch to SoCal Tracon...');
    await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const sectorBtn = buttons.find(b => b.textContent && b.textContent.includes('SECTOR:'));
        if (sectorBtn) sectorBtn.click();
      })()`,
    });
    await sleep(400);

    await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const socalBtn = buttons.find(b => b.textContent && b.textContent.includes('SoCal Tracon'));
        if (socalBtn) socalBtn.click();
      })()`,
    });

    console.log('Waiting 4s for camera flyTo to SoCal and tiles to settle...');
    await sleep(4000);

    const socalScreenshot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const socalBuffer = Buffer.from(socalScreenshot.data, 'base64');
    const socalPath = `${ARTIFACT_DIR}\\aerocraft_socal_map.png`;
    await writeFile(socalPath, socalBuffer);
    console.log(`Saved SoCal sector screenshot to: ${socalPath} (${socalBuffer.length} bytes)`);

    // 3. Basemap Toggle: Switch to OpenFreeMap Dark
    console.log('Testing Basemap Switcher toggle...');
    await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const basemapBtn = buttons.find(b => b.textContent && b.textContent.includes('CARTO Dark Matter'));
        if (basemapBtn) basemapBtn.click();
      })()`,
    });

    console.log('Waiting 4s for fallback basemap style to load...');
    await sleep(4000);

    const ofmScreenshot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const ofmBuffer = Buffer.from(ofmScreenshot.data, 'base64');
    const ofmPath = `${ARTIFACT_DIR}\\aerocraft_openfreemap_map.png`;
    await writeFile(ofmPath, ofmBuffer);
    console.log(`Saved OpenFreeMap screenshot to: ${ofmPath} (${ofmBuffer.length} bytes)`);

    // 4. Mobile Viewport (390x844)
    console.log('Setting mobile metrics (390x844)...');
    await sendCommand('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });

    await sleep(2000);

    console.log('Capturing mobile screenshot...');
    const mobileScreenshot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const mobileBuffer = Buffer.from(mobileScreenshot.data, 'base64');
    const mobilePath = `${ARTIFACT_DIR}\\aerocraft_mobile_map.png`;
    await writeFile(mobilePath, mobileBuffer);
    console.log(`Saved mobile screenshot to: ${mobilePath} (${mobileBuffer.length} bytes)`);

    ws.close();
    console.log('All verification captures completed successfully.');
  } finally {
    browserProcess.kill('SIGKILL');
  }
}

capture().catch((err) => {
  console.error('Capture failed:', err);
  process.exit(1);
});
