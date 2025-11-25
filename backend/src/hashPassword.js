const bcrypt = require('bcrypt');

const password = 'Admin@123';  // Your new admin password

bcrypt.hash(password, 10, (err, hash) => {
  if (err) throw err;
  console.log('New password hash:');
  console.log(hash);
});
