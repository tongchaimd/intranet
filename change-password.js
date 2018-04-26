if (!process.argv[2]) {
    console.log('ERROR: an argument is required!');
    return;
}
const fs = require('fs');
const bcrypt = require('bcrypt');

const content = fs.readFileSync('.env', 'utf8');
const newContent = content.replace(/PASSWORD_HASH=.+/, `PASSWORD_HASH=${bcrypt.hashSync(process.argv[2], 10)}`);
fs.writeFileSync('.env', newContent);

console.log('Password changed! Please restart the server');

