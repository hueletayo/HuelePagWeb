import { defineConfig } from '@prisma/config';
export default defineConfig({
  earlyAccess: true,
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_YXElVT6zweZ9@ep-royal-pine-aybca0dt.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require",
  }
});
