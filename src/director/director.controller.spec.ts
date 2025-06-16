import { Test, TestingModule } from '@nestjs/testing';
import { DirectorController } from './director.controller';
import { DirectorService } from './director.service';
import { CreateDirectorDto } from './dto/create-director.dto';

const mockDirectorService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('DirectorController', () => {
  let controller: DirectorController;
  let service: DirectorService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DirectorController],
      providers: [
        DirectorService,
        {
          provide: DirectorService,
          useValue: mockDirectorService,
        },
      ],
    }).compile();
    controller = module.get<DirectorController>(DirectorController);
    service = module.get<DirectorService>(DirectorService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call findAll method from DirectorService', () => {
      const res = [{ id: 1, name: 'test' }];
      jest.spyOn(mockDirectorService, 'findAll').mockResolvedValue(res);
      expect(controller.findAll()).resolves.toEqual(res);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should call findOne method from DirectorService', () => {
      const res = { id: 1, name: 'test' };
      jest.spyOn(mockDirectorService, 'findOne').mockResolvedValue(res);

      expect(controller.findOne(1)).resolves.toEqual(res);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('create', () => {
    it('should call create method form DirectorService with Correct DTO', () => {
      const createDirectorDto = { name: 'test' };
      const res = { id: 1, name: 'test' };

      jest.spyOn(mockDirectorService, 'create').mockResolvedValue(res);

      expect(
        controller.create(createDirectorDto as CreateDirectorDto),
      ).resolves.toEqual(res);

      expect(service.create).toHaveBeenCalledWith(createDirectorDto);
    });
  });

  describe('update', () => {
    it('should call update method from DirectorService with Correct id and DTO', async () => {
      const updateDirectorDto = { name: 'test' };
      const res = {
        id: 1,
        name: 'test',
      };
      jest.spyOn(mockDirectorService, 'update').mockResolvedValue(res);
      await expect(controller.update(1, updateDirectorDto)).resolves.toEqual(
        res,
      );
    });
  });

  describe('remove', () => {
    it('should call remove method from DirectorService with id', async () => {
      const result = 1;
      jest.spyOn(mockDirectorService, 'remove').mockResolvedValue(result);
      await expect(controller.remove(1)).resolves.toEqual(result);
      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });
});
