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

const files = walkSync(path.join(__dirname, '../src')).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  content = content.replace(/to="\/reports"/g, 'to="/intelligence"');
  content = content.replace(/to=\{\`\/reports\//g, 'to={`/intelligence/');
  content = content.replace(/navigate\('\/reports'\)/g, 'navigate(\'/intelligence\')');
  content = content.replace(/path: '\/reports'/g, 'path: \'/intelligence\'');
  
  // App.jsx path changes
  content = content.replace(/path="\/reports\/:id"/g, 'path="/intelligence/:id"');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
