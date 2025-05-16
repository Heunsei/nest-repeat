import { Module } from '@nestjs/common';
import { MovieModule } from './movie/movie.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { Movie } from './movie/entity/movie.entity';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        ENV: Joi.string().valid('dev', 'prod').required(),
        DB_TYPE: Joi.string().valid('postgres').required(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),
      }),
    }),
    // config module가 생성후 값을 주입받아야해서 async로 실행
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: configService.get<string>('DB_TYPE') as 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [Movie],
        synchronize: true, // 자동으로 켜질때마다 db와 동기화
      }),
      inject: [ConfigService],
    }),
    MovieModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
