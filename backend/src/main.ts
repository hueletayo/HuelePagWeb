import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      "https://hueletayo.github.io",
      "https://www.3erroundfit.com",
      "https://3erroundfit.com",
      "http://localhost",
      "http://127.0.0.1",
      "http://localhost:5500",
      "http://127.0.0.1:5500",
      "http://localhost:8899",
      "http://127.0.0.1:8899",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    // Authorization sustituye a x-athlete-id
    allowedHeaders: ["Content-Type", "Authorization"],
  });
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
