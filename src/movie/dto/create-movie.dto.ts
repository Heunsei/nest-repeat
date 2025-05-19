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
  title: string;

  @IsNotEmpty()
  @IsNumber()
  directorId: number;

  @IsNotEmpty()
  @IsString()
  detail: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  genreIds: number[];
}
