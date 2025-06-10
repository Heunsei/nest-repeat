import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';

export class CreateMovieDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: '영화 제목',
  })
  title: string;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    description: '감독 ID',
  })
  directorId: number;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: '영화 설명',
  })
  detail: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  @ApiProperty({
    description: '장르 Ids',
    example: [1, 2, 3],
  })
  genreIds: number[];

  @IsString()
  @ApiProperty({
    description: '영화 파일 이름',
  })
  movieFileName: string;
}
