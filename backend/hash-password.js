import bcrypt from 'bcryptjs';

const password = 'admin123';
bcrypt.hash(password, 10).then(hash => {
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('\nEjecuta en MySQL:');
  console.log(`UPDATE usuarios SET password = '${hash}' WHERE username = 'admin';`);
  process.exit(0);
});