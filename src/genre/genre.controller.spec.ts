import { Test, TestingModule } from '@nestjs/testing';
import { GenreController } from './genre.controller';
import { GenreService } from './genre.service';
import { CreateGenreDto } from './dto/create-genre.dto';
import { Genre } from './entity/genre.entity';
import { UpdateGenreDto } from './dto/update-genre.dto';

const mockGenreService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('GenreController', () => {
  let controller: GenreController;
  let service: GenreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GenreController],
      providers: [
        GenreService,
        {
          provide: GenreService,
          useValue: mockGenreService,
        },
      ],
    }).compile();

    controller = module.get<GenreController>(GenreController);
    service = module.get<GenreService>(GenreService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(true).toBeDefined();
  });

  describe('create', () => {
    it('should call genreService.create with correct parameter', async () => {
      const createGenreDto = {
        name: 'test',
      };
      const result = { id: 1, ...createGenreDto };

      jest
        .spyOn(service, 'create')
        .mockResolvedValue(result as CreateGenreDto & Genre);
      expect(controller.create(createGenreDto)).resolves.toEqual(result);
      expect(service.create).toHaveBeenCalledWith(createGenreDto);
    });
  });

  describe('findAll', () => {
    it('should call genreService.findAll', async () => {
      const genres = [
        {
          id: 1,
          name: 'test',
        },
      ];

      jest.spyOn(service, 'findAll').mockResolvedValue(genres as Genre[]);

      await expect(controller.findAll()).resolves.toEqual(genres);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should call genreService.findOne with exist id', async () => {
      const result = { id: 1, name: 'test' };
      const calledId = 1;
      jest.spyOn(service, 'findOne').mockResolvedValue(result as Genre);

      await expect(controller.findOne(calledId)).resolves.toEqual(result);
      expect(service.findOne).toHaveBeenCalledWith(calledId);
    });
  });

  describe('update', () => {
    it('should call genreService.update with correct GenreUpdateDto', async () => {
      const id = 1;
      const updateGenreDto = { name: 'test2' };
      const updatedGenre = { id: 1, ...updateGenreDto };

      jest.spyOn(service, 'update').mockResolvedValue(updatedGenre as Genre);
      await expect(controller.update(id, updateGenreDto)).resolves.toEqual(
        updatedGenre,
      );
      expect(service.update).toHaveBeenCalledWith(id, updateGenreDto);
    });
  });

  describe('remove', () => {
    it('should call genreService.remove with correct id', async () => {
      const id = 1;

      jest.spyOn(service, 'remove').mockResolvedValue(id);

      await expect(controller.remove(id)).resolves.toBe(id);
      expect(service.remove).toHaveBeenCalledWith(id);
    });
  });
});
