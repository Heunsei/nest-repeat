import { PartialType } from '@nestjs/mapped-types';
import { CreateMovieDto } from './create-movie.dto';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateMovieDto extends PartialType(CreateMovieDto) {
  @IsNotEmpty()
  @IsOptional()
  title?: string;

  @IsNotEmpty()
  @IsOptional()
  genre?: string;
}
