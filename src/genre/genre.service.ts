import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Genre } from './entity/genre.entity';
import { PrismaService } from 'src/common/prisma.service';

@Injectable()
export class GenreService {
  constructor(
    // @InjectRepository(Genre)
    // private readonly genreRepository: Repository<Genre>,
    private readonly prisma: PrismaService,
  ) {}
  async create(createGenreDto: CreateGenreDto) {
    const genre = await this.prisma.genre.findUnique({
      where: { name: createGenreDto.name },
    });

    // const genre = await this.genreRepository.findOne({
    //   where: { name: createGenreDto.name },
    // });

    if (genre) {
      throw new BadRequestException('이미 존재하는 장르입니다');
    }

    return this.prisma.genre.create({
      data: createGenreDto,
    });
    // return await this.genreRepository.save(createGenreDto);
  }

  async findAll() {
    return await this.prisma.genre.findMany();
    // return await this.genreRepository.find();
  }

  async findOne(id: number) {
    const genre = await this.prisma.genre.findUnique({
      where: { id },
    });
    // const genre = await this.genreRepository.findOne({ where: { id } });
    if (!genre) {
      throw new NotFoundException('해당 id의 장르는 존재하지 않습니다');
    }
    return await this.prisma.genre.findUnique({
      where: { id },
    });
    // return await this.genreRepository.findOne({ where: { id } });
  }

  async update(id: number, updateGenreDto: UpdateGenreDto) {
    const genre = await this.prisma.genre.findUnique({
      where: { id },
    });
    // const genre = await this.genreRepository.findOne({ where: { id } });
    if (!genre) {
      throw new NotFoundException('해당 id의 장르는 존재하지 않습니다');
    }

    await this.prisma.genre.update({
      where: { id },
      data: {
        ...updateGenreDto,
      },
    });

    // await this.genreRepository.update(
    //   { id },
    //   {
    //     ...updateGenreDto,
    //   },
    // );

    const newGenre = await this.prisma.genre.findUnique({
      where: { id },
    });
    // const newGenre = this.genreRepository.findOne({ where: { id } });
    return newGenre;
  }

  async remove(id: number) {
    const genre = await this.prisma.genre.findUnique({
      where: { id },
    });
    // const genre = await this.genreRepository.findOne({ where: { id } });

    if (!genre) {
      throw new NotFoundException('존재하지 않는 장르입니다');
    }
    await this.prisma.genre.delete({ where: { id } });
    // await this.genreRepository.delete(id);
    return id;
  }
}
