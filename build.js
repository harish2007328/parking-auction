import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Bundle all JavaScript modules into a standalone app.bundle.js
const order = [
  'data.js',
  'audio.js',
  'supabase-client.js',
  'pricing-engine.js',
  'map.js',
  'paypal.js',
  'host.js',
  'app.js'
];

let combined = '// ParkPulse Tirunelveli Bundle (Auto-generated for zero-dependency edge deployment)\n(function() {\n';

for (const file of order) {
  let content = fs.readFileSync(path.join(__dirname, 'js', file), 'utf-8');
  // Remove multi-line or single-line import statements
  content = content.replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '');
  // Remove export { ... }
  content = content.replace(/export\s*\{[\s\S]*?\};?/g, '');
  // Replace export const / export let / export class / export function
  content = content.replace(/export\s+(const|let|var|function|class)\s+/g, (match, p1) => p1 + ' ');
  content = content.replace(/export\s+default\s+/g, '');
  
  combined += `\n// ===== ${file} =====\n` + content + '\n';
}

combined += '\n})();\n';

fs.writeFileSync(path.join(__dirname, 'app.bundle.js'), combined, 'utf-8');
console.log('✅ app.bundle.js built successfully. Size:', combined.length, 'bytes');

// 2. Embed full CSS into index.html so Vercel never serves unstyled HTML
const cssPath = path.join(__dirname, 'styles.css');
const indexPath = path.join(__dirname, 'index.html');
if (fs.existsSync(cssPath) && fs.existsSync(indexPath)) {
  const cssContent = fs.readFileSync(cssPath, 'utf-8');
  let indexHtml = fs.readFileSync(indexPath, 'utf-8');
  
  const styleBlock = `<style id="parkpulse-embedded-styles">\n${cssContent}\n</style>`;
  
  if (indexHtml.includes('id="parkpulse-embedded-styles"')) {
    indexHtml = indexHtml.replace(/<style id="parkpulse-embedded-styles">[\s\S]*?<\/style>/, styleBlock);
  } else {
    indexHtml = indexHtml.replace('</head>', `  ${styleBlock}\n</head>`);
  }
  
  fs.writeFileSync(indexPath, indexHtml, 'utf-8');
  console.log('✅ Inlined full CSS into index.html for bulletproof Vercel rendering');
}
