const fs = require('fs');

const path = 'components/HomePage.tsx';
let data = fs.readFileSync(path, 'utf8');

data = data.replace(
  "border-2 border-white shadow-sm ",
  "shadow-sm"
);

fs.writeFileSync(path, data);
