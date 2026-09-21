const fs = require('fs');

const path = 'components/MessagePage.tsx';
let data = fs.readFileSync(path, 'utf8');

// Update logic to always overwrite name/photo if a new message arrives with valid otherName/otherPhoto
const search = `
          if (
            (!existing.otherUser.name ||
              existing.otherUser.name === 'User') &&
            otherName &&
            otherName !== 'User'
          ) {
            existing.otherUser.name = otherName;
          }

          if (
            (!existing.otherUser.photo ||
              existing.otherUser.photo === '/default-avatar.png') &&
            otherPhoto &&
            otherPhoto !== '/default-avatar.png'
          ) {
            existing.otherUser.photo = otherPhoto;
          }
`;

const replace = `
          if (otherName && otherName !== 'User') {
            existing.otherUser.name = otherName;
          }

          if (otherPhoto && otherPhoto !== '/default-avatar.png') {
            existing.otherUser.photo = otherPhoto;
          }
`;

data = data.replace(search, replace);
fs.writeFileSync(path, data);
