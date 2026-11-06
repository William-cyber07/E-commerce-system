import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import cookieParser from "cookie-parser";

async function bootstrap() {
  // src/main.ts
const app = await NestFactory.create(AppModule, { rawBody: true }); // <-- Add { rawBody: true }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );
  app.use(cookieParser());
  app.enableCors({ origin: "http://localhost:3000", credentials: true });
  app.setGlobalPrefix("api");

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 API listening on http://localhost:${port}/api`);
}
bootstrap();