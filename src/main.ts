import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as ffmpeg from '@ffmpeg-installer/ffmpeg';
import * as ffmpegFluent from 'fluent-ffmpeg';
import * as ffprobe from 'ffprobe-static';
import * as session from 'express-session';

ffmpegFluent.setFfmpegPath(ffmpeg.path);
ffmpegFluent.setFfprobePath(ffprobe.path);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // 빌더 생성
  const config = new DocumentBuilder()
    .setTitle('document')
    .setDescription('nest 관련 swagger 테스트')
    .setVersion('1.0')
    .addBasicAuth()
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  // documentation의 prefix
  SwaggerModule.setup('doc', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false, // 기본 false, true설정 시 dto에 설정하지 않은 값들은 걸러줌
      forbidNonWhitelisted: true, // 기본 false dto에 존재하고 존재하지 않는 값을 구분 에러를 발생해줌
      transformOptions: {
        enableImplicitConversion: true, // 타입스크립트 타입을 기반으로 입력을 변경
      },
    }),
  );

  app.use(
    session({
      secret: 'secret',
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
