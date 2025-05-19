import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateMovieDto {
  @IsNotEmpty()
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  genreIds?: number[];

  @IsNotEmpty()
  @IsOptional()
  @IsString()
  detail?: string;

  @IsNotEmpty()
  @IsOptional()
  @IsNumber()
  directorId?: number;
}
