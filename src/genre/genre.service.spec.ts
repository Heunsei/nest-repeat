import { Test, TestingModule } from '@nestjs/testing';
import { GenreService } from './genre.service';
import { Repository } from 'typeorm';
import { Genre } from './entities/genre.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const mockGenreRepository = {
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

describe('GenreService', () => {
  let service: GenreService;
  let repository: Repository<Genre>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenreService,
        {
          provide: getRepositoryToken(Genre),
          useValue: mockGenreRepository,
        },
      ],
    }).compile();

    service = module.get<GenreService>(GenreService);
    repository = module.get<Repository<Genre>>(getRepositoryToken(Genre));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('shold creat genre with correct dto', async () => {
      const createGenreDto = { name: 'genre' };
      const savedGenre = { id: 1, ...createGenreDto };

      jest.spyOn(repository, 'save').mockResolvedValue(savedGenre as Genre);
      const res = await service.create(createGenreDto);

      expect(res).toEqual(savedGenre);
      expect(mockGenreRepository.findOne).toHaveBeenCalledWith({
        where: { name: createGenreDto.name },
      });
    });

    it('should throw BadRequestException with exist genre name', async () => {
      const genre = { name: 'test' };
      jest.spyOn(mockGenreRepository, 'findOne').mockResolvedValue(genre);
      await expect(service.create(genre)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return an array of genres', async () => {
      const genres = [
        {
          id: 1,
          name: 'test1',
        },
        {
          id: 2,
          name: 'test2',
        },
      ];

      jest
        .spyOn(mockGenreRepository, 'find')
        .mockResolvedValue(genres as Genre[]);
      const res = await service.findAll();

      expect(res).toEqual(genres);
      expect(repository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a genre if found', async () => {
      const genre = { id: 1, name: 'test' };
      jest.spyOn(repository, 'findOne').mockResolvedValue(genre as Genre);

      const res = await service.findOne(genre.id);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: genre.id },
      });
      expect(res).toEqual(genre);
    });
    it('should throw NotFoundException when genre not exist', async () => {
      jest.spyOn(mockGenreRepository, 'findOne').mockResolvedValue(null);
      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update with Genreupdate DTO', async () => {
      const updateGenreDto = { name: 'test2' };
      const existingGenre = { id: 1, name: 'test1' };
      const updatedGenre = { id: 1, ...updateGenreDto };

      jest
        .spyOn(mockGenreRepository, 'findOne')
        .mockResolvedValue(existingGenre);
      jest.spyOn(mockGenreRepository, 'update').mockResolvedValue(updatedGenre);

      const res = await service.update(1, updateGenreDto);

      expect(res).toEqual(updatedGenre);
      expect(mockGenreRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
    it('should throw NotFoundException when genre not exist', async () => {
      jest.spyOn(mockGenreRepository, 'findOne').mockResolvedValue(null);
      await expect(service.update(1, { name: 'test' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove exist genre', async () => {
      const genre = { id: 1, name: 'test' };
      jest.spyOn(mockGenreRepository, 'findOne').mockResolvedValue(genre);
      const res = await service.remove(genre.id);
      expect(res).toEqual(genre.id);
    });

    it('should thorw NotFoundException when genre does not exist', async () => {
      jest.spyOn(mockGenreRepository, 'findOne').mockResolvedValue(null);
      await expect(service.remove(1)).rejects.toThrow(NotFoundException);
    });
  });
});
