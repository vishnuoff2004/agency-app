const { Sequelize } = require('sequelize');
async function check() {
  const db = new Sequelize({dialect:'mysql',host:'localhost',username:'root',password:'root',database:'travel_agency',logging:false});
  await db.authenticate();
  const [rows] = await db.query("SELECT DISTINCT d.vehicleType FROM Drivers d INNER JOIN Routes r ON r.driverId=d.id WHERE r.available=1 AND r.status='active'");
  console.log('Vehicle types:', JSON.stringify(rows.map(r=>r.vehicleType)));
  const [count] = await db.query("SELECT COUNT(*) as cnt FROM Routes WHERE available=1 AND status='active'");
  console.log('Active routes:', count[0].cnt);
  await db.close();
}
check().catch(e=>console.error(e.message));
