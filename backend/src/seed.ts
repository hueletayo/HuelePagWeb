import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import * as bcrypt from "bcryptjs";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter } as any);

  const existing = await prisma.athlete.findUnique({ where: { email: "3erroundfit@gmail.com" } });
  if (existing) {
    console.log("Admin ya existe. Nada que hacer.");
    await prisma.$disconnect();
    return;
  }

  const hashed = await bcrypt.hash("mipfyJInIN\$MkUbY", 10);
  const admin = await prisma.athlete.create({
    data: {
      nombre: "Grey Admin",
      cedula: "ADMIN001",
      email: "3erroundfit@gmail.com",
      password: hashed,
      role: "ADMIN",
      perfilCompletado: true,
    },
  });
  console.log("Admin creado con ID:", admin.id);
  await prisma.$disconnect();
}
main().catch(console.error);
