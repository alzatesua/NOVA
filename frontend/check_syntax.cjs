const fs = require('fs');
const content = fs.readFileSync('src/components/FacturacionView.jsx', 'utf8');
const lines = content.split('\n');

let inString = false;
let quoteChar = '';

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    const prevChar = j > 0 ? line[j - 1] : '';

    if ((char === '"' || char === "'") && prevChar !== '\\') {
      if (!inString) {
        inString = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        inString = false;
        quoteChar = '';
      }
    }
  }

  if (inString && (i % 100 === 0)) {
    console.log(`Line ${i + 1}: In string (${quoteChar})`);
  }
}

