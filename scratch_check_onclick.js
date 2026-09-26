const fs = require('fs');
const html = fs.readFileSync('static/index.html', 'utf-8');
const js = fs.readFileSync('static/app.js', 'utf-8');

const regex = /onclick="([a-zA-Z0-9_]+)\(/g;
let match;
const usedFns = new Set();
while ((match = regex.exec(html)) !== null) {
    usedFns.add(match[1]);
}

const missing = [];
for (const fn of usedFns) {
    if (!js.includes('function ' + fn) && !js.includes(fn + ' =') && !js.includes(fn + ':') && !js.includes('function  ' + fn)) {
        missing.push(fn);
    }
}
console.log('Total unique onclick functions in index.html:', usedFns.size);
console.log('Used functions:', Array.from(usedFns));
console.log('Missing functions:', missing);
if (missing.length > 0) {
    process.exit(1);
} else {
    console.log('ALL HTML ONCLICK FUNCTIONS EXIST IN APP.JS!');
}

