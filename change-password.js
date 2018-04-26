const fs = require('fs');
const bcrypt = require('bcrypt');

const content = fs.readFileSync('.env', 'utf8');
let newContent = '';
if (!process.argv[2] || process.argv[2] === '') {
    newContent = content.replace(/PASSWORD_HASH=.*/, `PASSWORD_HASH=`);
} else {
    newContent = content.replace(/PASSWORD_HASH=.*/, `PASSWORD_HASH=${bcrypt.hashSync(process.argv[2], 10)}`);
}
fs.writeFileSync('.env', newContent);

console.log('Password changed! Please restart the server');

