const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const src = path.join(root, 'src/home');
for (const destination of ['site', 'dist']) {
  const dest = path.join(root, destination);
  fs.mkdirSync(dest, { recursive: true });
  for (const name of ['index.html', 'home.css', 'home.js', 'favicon.svg']) {
    fs.copyFileSync(path.join(src, name), path.join(dest, name));
  }
  fs.cpSync(path.join(src, 'assets'), path.join(dest, 'home-assets'), { recursive: true });
}
const html = fs.readFileSync(path.join(src, 'index.html'), 'utf8');
for (const match of html.matchAll(/(?:src|href)="(home-assets\/[^"#]+)"/g)) {
  if (!fs.existsSync(path.join(root, 'dist', match[1]))) throw new Error(`Missing asset: ${match[1]}`);
}
console.log('INU home page built. All referenced assets exist.');
