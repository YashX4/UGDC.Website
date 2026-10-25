import { defineConfig } from '@playwright/test';

/* Visual regression for the approved screens.
   Baselines in tests/baseline/ were captured from the original no build prototype, so a pass means the real site
   still looks exactly like it.
     npm run test:visual                                  builds the site, serves it and compares
     BASE_URL=http://localhost:8080 npm run test:visual -- --update-snapshots   (re)capture baselines from any running server */
const external = process.env.BASE_URL;

export default defineConfig({
  testDir: 'tests',
  snapshotPathTemplate: '{testDir}/baseline/{projectName}/{arg}{ext}',
  timeout: 90000,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.002, animations: 'disabled' } },
  use: {
    baseURL: external || 'http://localhost:4173',
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] },
    serviceWorkers: 'block'
  },
  webServer: external ? undefined : { command: 'npm run build && npm run preview', url: 'http://localhost:4173', reuseExistingServer: true, timeout: 120000 },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 } },
    { name: 'phone', use: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } }
  ]
});
