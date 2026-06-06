import "reflect-metadata";
import { DataSource } from "typeorm";
import * as bcrypt from "bcrypt";
import { config } from "dotenv";

config();
const ds = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: ["src/**/*.entity.ts"],
  synchronize: false,
});
async function seed() {
  await ds.initialize();
  const db = ds.createQueryRunner();
  await db.connect();
  // 1. Hotel
  const [hotel] = await db.query(`
INSERT INTO hotels (name, city, country_code, whatsapp_number, star_rating)
VALUES ('Grand RestHalf Malang', 'Malang', 'ID', '+6281234567890', 3)
ON CONFLICT DO NOTHING RETURNING id`);
  const hotelId = hotel?.id;
  if (!hotelId) {
    console.log("Hotel already seeded");
    await ds.destroy();
    return;
  }
  console.log(`Hotel: ${hotelId}`);
  // 2. Ring-fenced rooms
  const rooms = [
    { number: "101", type: "Deluxe", floor: 1, p12: 250000, p24: 450000 },
    { number: "102", type: "Deluxe", floor: 1, p12: 250000, p24: 450000 },
    { number: "201", type: "Suite", floor: 2, p12: 400000, p24: 700000 },
  ];
  for (const r of rooms) {
    const [room] = await db.query(
      `
INSERT INTO rooms
(hotel_id, room_number, room_type, floor,
base_price_12h, base_price_24h, currency, is_ring_fenced)
VALUES ($1,$2,$3,$4,$5,$6,'IDR',true)
RETURNING id`,
      [hotelId, r.number, r.type, r.floor, r.p12, r.p24],
    );
    console.log(`Room ${r.number}: ${room.id}`);
  }
  // 3. Staff account (manager)
  const hash = await bcrypt.hash("resthalf123", 12);
  await db.query(
    `
INSERT INTO staff (hotel_id, name, phone, role, password_hash)
VALUES ($1, 'Hotel Manager', '+6281234567891', 'manager', $2)`,
    [hotelId, hash],
  );
  // 4. Test guest
  const guestHash = await bcrypt.hash("guest123", 12);
  await db.query(
    `
INSERT INTO guests (full_name, phone, password_hash)
VALUES ('Test Guest', '+6289876543210', $1)`,
    [guestHash],
  );
  console.log("\nSeed complete.");
  console.log("Staff login: phone=+6281234567891 password=resthalf123");
  console.log("Guest login: phone=+6289876543210 password=guest123");
  await db.release();
  await ds.destroy();
}
seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
