const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    filelist = fs.statSync(path.join(dir, file)).isDirectory()
      ? walkSync(path.join(dir, file), filelist)
      : filelist.concat(path.join(dir, file));
  });
  return filelist;
}

const files = walkSync(path.join(__dirname, '../src')).filter(f => f.endsWith('.jsx') || f.endsWith('.js'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace neo- classes with os- classes
  content = content.replace(/neo-card/g, 'os-card');
  content = content.replace(/neo-btn-primary/g, 'os-btn-primary');
  content = content.replace(/neo-btn-secondary/g, 'os-btn');
  content = content.replace(/neo-btn/g, 'os-btn');
  content = content.replace(/neo-input/g, 'os-input');
  content = content.replace(/neo-badge/g, 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium');

  // Remove brutalist border and shadow utilities
  content = content.replace(/border-\[3px\] border-black/g, '');
  content = content.replace(/border-\[4px\] border-black/g, '');
  content = content.replace(/shadow-\[.*?\]/g, '');
  content = content.replace(/shadow-neo-button/g, '');
  content = content.replace(/shadow-neo/g, '');
  
  // Replace absolute brutalist colors
  content = content.replace(/bg-\[\#EF4444\]/g, 'bg-red-500');
  content = content.replace(/bg-\[\#A3E635\]/g, 'bg-emerald-500');
  content = content.replace(/bg-\[\#FCD34D\]/g, 'bg-yellow-400');
  content = content.replace(/bg-\[\#3B82F6\]/g, 'bg-blue-600');
  content = content.replace(/bg-\[\#C084FC\]/g, 'bg-purple-600');
  
  // Clean up multiple spaces that might have resulted from stripping classes
  content = content.replace(/ +/g, ' ');
  content = content.replace(/ \)/g, ')');
  content = content.replace(/ \"/g, '"');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
