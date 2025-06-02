import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false, // 기본 false, true설정 시 dto에 설정하지 않은 값들은 걸러줌
      forbidNonWhitelisted: true, // 기본 false dto에 존재하고 존재하지 않는 값을 구분 에러를 발생해줌
      transformOptions: {
        enableImplicitConversion: true, // 타입스크립트 타입을 기반으로 입력을 변경
      },
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
