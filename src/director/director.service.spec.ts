import { Test, TestingModule } from '@nestjs/testing';
import { DirectorService } from './director.service';
import { Repository } from 'typeorm';
import { Director } from './entity/director.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateDirectorDto } from './dto/create-director.dto';
import { NotFoundException } from '@nestjs/common';

const mockDirectorRepository = {
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

describe('DirectorService', () => {
  let directorService: DirectorService;
  let directorRepository: Repository<Director>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DirectorService,
        {
          provide: getRepositoryToken(Director),
          useValue: mockDirectorRepository,
        },
      ],
    }).compile();

    directorService = module.get<DirectorService>(DirectorService);
    directorRepository = module.get<Repository<Director>>(
      getRepositoryToken(Director),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(directorService).toBeDefined();
  });

  describe('create', () => {
    it('should creat new director', async () => {
      const createDirectorDto = {
        name: 'test',
      };
      jest
        .spyOn(mockDirectorRepository, 'save')
        .mockResolvedValue(createDirectorDto);

      const result = await directorService.create(
        createDirectorDto as CreateDirectorDto,
      );

      expect(directorRepository.save).toHaveBeenCalledWith(createDirectorDto);
      expect(result).toEqual(createDirectorDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of directors', async () => {
      const searchResult = [
        {
          id: 1,
          name: 'test1',
        },
      ];

      jest
        .spyOn(mockDirectorRepository, 'find')
        .mockResolvedValue(searchResult);

      const result = await directorService.findAll();
      expect(directorRepository.find).toHaveBeenCalled();
      expect(result).toEqual(searchResult);
    });
  });

  describe('findOne', () => {
    it('should return director by id', async () => {
      const director = { id: 1, name: 'test' };

      jest
        .spyOn(mockDirectorRepository, 'findOne')
        .mockResolvedValue(director as Director);

      const result = await directorService.findOne(director.id);

      expect(directorRepository.findOne).toHaveBeenCalledWith({
        where: { id: director.id },
      });
      expect(result).toEqual(director);
    });
    it('should throw error director is not exist', async () => {
      const directorId = 1;

      jest.spyOn(mockDirectorRepository, 'findOne').mockResolvedValue(null);

      await expect(() => directorService.findOne(directorId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a director', async () => {
      const updateDirectorDto = { name: 'test2' };
      const existingDirector = { id: 1, name: 'test1' };
      const updatedDirector = { id: 1, name: 'test2' };
      jest
        .spyOn(mockDirectorRepository, 'find')
        .mockResolvedValueOnce(existingDirector);

      jest
        .spyOn(mockDirectorRepository, 'find')
        .mockResolvedValueOnce(updatedDirector);

      const res = await directorService.update(1, updateDirectorDto);

      expect(directorRepository.find).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(directorRepository.update).toHaveBeenCalledWith(
        { id: 1 },
        updateDirectorDto,
      );
      expect(res).toEqual(updatedDirector);
    });

    it('should throw NotFoundException if director does not exits', async () => {
      jest.spyOn(mockDirectorRepository, 'find').mockResolvedValue(null);
      await expect(directorService.update(1, { name: 'test' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove director by id', async () => {
      const director = { id: 1, name: 'test1' };

      jest.spyOn(mockDirectorRepository, 'findOne').mockResolvedValue(director);

      const res = await directorService.remove(director.id);

      expect(directorRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(directorRepository.delete).toHaveBeenCalledWith(1);
      expect(res).toEqual(1);
    });

    it('should throw NotFoundException wher director not exist', async () => {
      jest.spyOn(mockDirectorRepository, 'findOne').mockResolvedValue(null);
      await expect(directorService.remove(1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
