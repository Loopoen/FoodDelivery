import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors()
  app.setGlobalPrefix('api')
  const port = process.env.PORT ?? 3000
  await app.listen(port)

  console.log(`API chay ${port}`)

}
void  bootstrap();
