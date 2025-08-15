import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../src/auth/auth.service';
import { UsersService } from '../src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException, ConflictException } from '@nestjs/common';

// Mock bcrypt functions
jest.mock('bcrypt', () => ({
  hash: jest.fn((password, _salt) => 'hashed_' + password),
  compare: jest.fn(
    (password: string, hash: string) =>
      password === hash.replace('hashed_', ''),
  ),
  genSalt: jest.fn(() => 'salt'),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUsersService = {
    create: jest.fn(),
    findOneByEmail: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(() => 'mocked_jwt_token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should successfully register a user', async () => {
      const registerDto = {
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
      };
      const createdUser = {
        id: 'uuid',
        name: 'New User',
        email: 'new@example.com',
        passwordHash: 'hashed_password123',
      };

      mockUsersService.create.mockResolvedValue(createdUser);

      const result = await service.register(registerDto);

      expect(bcrypt.genSalt).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith(
        'password123',
        'salt',
      );
      expect(usersService.create).toHaveBeenCalledWith({
        name: 'New User',
        email: 'new@example.com',
        passwordHash: 'hashed_password123',
      });
      expect(result).toEqual({
        id: 'uuid',
        name: 'New User',
        email: 'new@example.com',
      }); // passwordHash should be excluded
    });

    it('should throw ConflictException if usersService.create throws it', async () => {
      const registerDto = {
        name: 'Existing User',
        email: 'existing@example.com',
        password: 'password123',
      };
      mockUsersService.create.mockRejectedValue(
        new ConflictException('Email already exists'),
      );

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    it('should return an access token on successful login', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const user = {
        id: 'user-uuid',
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hashed_password123',
        role: 'user',
      };

      mockUsersService.findOneByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true); // Ensure bcrypt.compare returns true
      mockJwtService.sign.mockReturnValue('mocked_jwt_token');

      const result = await service.login(loginDto);

      expect(usersService.findOneByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        'hashed_password123',
      );
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'user-uuid',
        role: 'user',
      });
      expect(result).toEqual({ access_token: 'mocked_jwt_token' });
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };
      mockUsersService.findOneByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(usersService.findOneByEmail).toHaveBeenCalledWith(
        'nonexistent@example.com',
      );
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };
      const user = {
        id: 'user-uuid',
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hashed_correctpassword',
        role: 'user',
      };

      mockUsersService.findOneByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false); // Ensure bcrypt.compare returns false

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(usersService.findOneByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'wrongpassword',
        'hashed_correctpassword',
      );
    });
  });
});
