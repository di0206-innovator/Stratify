const fs = require('fs');
let code = fs.readFileSync('src/components/BentoCard.jsx', 'utf8');
code = code.replace('<div className="flex-auto flex flex-col">', '<div className="flex flex-col h-full w-full">');
fs.writeFileSync('src/components/BentoCard.jsx', code);
