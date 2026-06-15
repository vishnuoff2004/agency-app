/**
 * Script to reset demo agency admin passwords to known values
 * Run: node scripts/reset-demo-passwords.js
 */
require('dotenv').config();
const bcrypt = require('bcrypt');
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  { host: process.env.DB_HOST, dialect: 'mysql', logging: false }
);

async function main() {
  await sequelize.authenticate();

  const demos = [
    { email: 'hari@gmail.com', password: 'Hari@123' },
    { email: 'agency@example.com', password: 'Agency@123' },
    { email: 'john@gmail.com', password: 'John@123' },
  ];

  for (const demo of demos) {
    const hash = await bcrypt.hash(demo.password, 10);
    const [count] = await sequelize.query(
      `UPDATE Users SET password=? WHERE email=?`,
      { replacements: [hash, demo.email] }
    );
    console.log(`Reset password for ${demo.email}: ${demo.password}`);
  }

  await sequelize.close();
  console.log('Done!');
}

main().catch(console.error);
