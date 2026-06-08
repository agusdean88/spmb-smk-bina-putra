import { launch } from 'chrome-launcher';
import puppeteer from 'puppeteer-core';
import fs from 'fs';

(async () => {
  const chrome = await launch({ chromeFlags: ['--headless'] });
  const browser = await puppeteer.connect({
    browserURL: `http://127.0.0.1:${chrome.port}`,
  });
  const page = await browser.newPage();
  
  page.on('pageerror', error => {
    console.log('PAGE_ERROR:', error.message);
  });
  page.on('console', msg => {
    console.log('CONSOLE:', msg.text());
  });
  
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: 'frontend-test.png' });
  console.log('Landing Page checked');
  
  await browser.disconnect();
  await chrome.kill();
})();
