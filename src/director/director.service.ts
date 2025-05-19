import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDirectorDto } from './dto/create-director.dto';
import { UpdateDirectorDto } from './dto/update-director.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Director } from './entity/director.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DirectorService {
  constructor(
    @InjectRepository(Director)
    private readonly directorRepository: Repository<Director>,
  ) {}

  async create(createDirectorDto: CreateDirectorDto) {
    return this.directorRepository.save(createDirectorDto);
  }

  findAll() {
    return this.directorRepository.find();
  }

  async findOne(id: number) {
    const director = await this.directorRepository.findOne({
      where: { id },
    });
    if (!director) {
      throw new NotFoundException('해당 감독은 존재하지 않습니다');
    }
    return director;
  }

  async update(id: number, updateDirectorDto: UpdateDirectorDto) {
    const director = await this.directorRepository.find({
      where: { id },
    });
    if (!director) {
      throw new NotFoundException('해당 id의 감독은 존재하지 않습니다');
    }
    const newDirector = await this.directorRepository.update(
      {
        id,
      },
      { ...updateDirectorDto },
    );
    return newDirector;
  }

  async remove(id: number) {
    return await this.directorRepository.delete(id);
  }
}
