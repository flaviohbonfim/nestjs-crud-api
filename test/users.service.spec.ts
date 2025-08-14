import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../src/users/users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/users/user.entity';
import { Repository } from 'typeorm';
import { ConflictException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: Repository<User>;

  const mockUsersRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOneBy: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUsersRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create a user', async () => {
      const createUserDto = {
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
      };
      const expectedUser = { id: 'uuid', ...createUserDto };

      mockUsersRepository.findOneBy.mockResolvedValue(null);
      mockUsersRepository.create.mockReturnValue(expectedUser);
      mockUsersRepository.save.mockResolvedValue(expectedUser);

      const result = await service.create(createUserDto);
      expect(result).toEqual(expectedUser);
      expect(mockUsersRepository.findOneBy).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
      expect(mockUsersRepository.create).toHaveBeenCalledWith({
        ...createUserDto,
        email: 'test@example.com',
      });
      expect(mockUsersRepository.save).toHaveBeenCalledWith(expectedUser);
    });

    it('should throw ConflictException if email already exists', async () => {
      const createUserDto = {
        name: 'Test User',
        email: 'existing@example.com',
        passwordHash: 'hashedpassword',
      };
      const existingUser = { id: 'uuid', ...createUserDto };

      mockUsersRepository.findOneBy.mockResolvedValue(existingUser);

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockUsersRepository.findOneBy).toHaveBeenCalledWith({
        email: 'existing@example.com',
      });
      expect(mockUsersRepository.create).not.toHaveBeenCalled();
      expect(mockUsersRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findOneByEmail', () => {
    it('should return a user if found by email', async () => {
      const user = {
        id: 'uuid',
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
      };
      mockUsersRepository.findOneBy.mockResolvedValue(user);

      const result = await service.findOneByEmail('test@example.com');
      expect(result).toEqual(user);
      expect(mockUsersRepository.findOneBy).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
    });

    it('should return null if user not found by email', async () => {
      mockUsersRepository.findOneBy.mockResolvedValue(null);

      const result = await service.findOneByEmail('nonexistent@example.com');
      expect(result).toBeNull();
    });
  });

  describe('findOneById', () => {
    it('should return a user if found by id', async () => {
      const user = {
        id: 'uuid',
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
      };
      mockUsersRepository.findOneBy.mockResolvedValue(user);

      const result = await service.findOneById('uuid');
      expect(result).toEqual(user);
      expect(mockUsersRepository.findOneBy).toHaveBeenCalledWith({ id: 'uuid' });
    });

    it('should return null if user not found by id', async () => {
      mockUsersRepository.findOneBy.mockResolvedValue(null);

      const result = await service.findOneById('nonexistent-uuid');
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const users = [
        {
          id: 'uuid1',
          name: 'User 1',
          email: 'user1@example.com',
          passwordHash: 'hash1',
        },
        {
          id: 'uuid2',
          name: 'User 2',
          email: 'user2@example.com',
          passwordHash: 'hash2',
        },
      ];
      mockUsersRepository.find.mockResolvedValue(users);

      const result = await service.findAll();
      expect(result).toEqual(users);
      expect(mockUsersRepository.find).toHaveBeenCalled();
    });

    it('should return an empty array if no users are found', async () => {
      mockUsersRepository.find.mockResolvedValue([]);

      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });
});
