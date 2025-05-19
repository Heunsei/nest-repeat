import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Genre } from './entities/genre.entity';

@Injectable()
export class GenreService {
  constructor(
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
  ) {}
  async create(createGenreDto: CreateGenreDto) {
    return await this.genreRepository.save(createGenreDto);
  }

  async findAll() {
    return await this.genreRepository.find();
  }

  async findOne(id: number) {
    return await this.genreRepository.findOne({ where: { id } });
  }

  async update(id: number, updateGenreDto: UpdateGenreDto) {
    const genre = await this.genreRepository.findOne({ where: { id } });
    if (!genre) {
      throw new NotFoundException('해당 id의 장르는 존재하지 않습니다');
    }
    const newGenre = await this.genreRepository.update(
      { id },
      { ...updateGenreDto },
    );
    return newGenre;
  }

  remove(id: number) {
    return this.genreRepository.delete(id);
  }
}
