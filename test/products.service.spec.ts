import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from '../src/products/products.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from '../src/products/product.entity';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { User } from '../src/users/user.entity';

describe('ProductsService', () => {
  let service: ProductsService;
  let productsRepository: Repository<Product>;

  const mockProductsRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOneBy: jest.fn(),
    delete: jest.fn(),
    merge: jest.fn(),
  };

  const mockUser: User = {
    id: 'user-uuid',
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: 'hashedpassword',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAdminUser: User = {
    id: 'admin-uuid',
    name: 'Admin User',
    email: 'admin@example.com',
    passwordHash: 'hashedpassword',
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductsRepository,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    productsRepository = module.get<Repository<Product>>(
      getRepositoryToken(Product),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create a product', async () => {
      const createProductDto = {
        name: 'New Product',
        description: 'Desc',
        price: 100,
        stock: 10,
      };
      const expectedProduct = {
        id: 'product-uuid',
        ...createProductDto,
        ownerId: mockUser.id,
      };

      mockProductsRepository.create.mockReturnValue(expectedProduct);
      mockProductsRepository.save.mockResolvedValue(expectedProduct);

      const result = await service.create(createProductDto, mockUser);
      expect(result).toEqual(expectedProduct);
      expect(mockProductsRepository.create).toHaveBeenCalledWith({
        ...createProductDto,
        ownerId: mockUser.id,
      });
      expect(mockProductsRepository.save).toHaveBeenCalledWith(expectedProduct);
    });
  });

  describe('findAll', () => {
    it('should return an array of products', async () => {
      const products = [
        { id: 'p1', name: 'Product 1', ownerId: 'u1' },
        { id: 'p2', name: 'Product 2', ownerId: 'u2' },
      ];
      mockProductsRepository.find.mockResolvedValue(products);

      const result = await service.findAll();
      expect(result).toEqual(products);
      expect(mockProductsRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a product if found', async () => {
      const product = { id: 'p1', name: 'Product 1', ownerId: 'u1' };
      mockProductsRepository.findOneBy.mockResolvedValue(product);

      const result = await service.findOne('p1');
      expect(result).toEqual(product);
      expect(mockProductsRepository.findOneBy).toHaveBeenCalledWith({ id: 'p1' });
    });

    it('should throw NotFoundException if product not found', async () => {
      mockProductsRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateProductDto = { name: 'Updated Product' };
    const existingProduct = {
      id: 'p1',
      name: 'Old Product',
      ownerId: mockUser.id,
    };

    it('should update a product if user is owner', async () => {
      mockProductsRepository.findOneBy.mockResolvedValue(existingProduct);
      mockProductsRepository.merge.mockReturnValue({
        ...existingProduct,
        ...updateProductDto,
      });
      mockProductsRepository.save.mockResolvedValue({
        ...existingProduct,
        ...updateProductDto,
      });

      const result = await service.update('p1', updateProductDto, mockUser);
      expect(result.name).toBe('Updated Product');
      expect(mockProductsRepository.merge).toHaveBeenCalledWith(
        existingProduct,
        updateProductDto,
      );
      expect(mockProductsRepository.save).toHaveBeenCalled();
    });

    it('should update a product if user is admin', async () => {
      mockProductsRepository.findOneBy.mockResolvedValue(existingProduct);
      mockProductsRepository.merge.mockReturnValue({
        ...existingProduct,
        ...updateProductDto,
      });
      mockProductsRepository.save.mockResolvedValue({
        ...existingProduct,
        ...updateProductDto,
      });

      const result = await service.update('p1', updateProductDto, mockAdminUser);
      expect(result.name).toBe('Updated Product');
    });

    it('should throw ForbiddenException if user is not owner or admin', async () => {
      const anotherUser: User = { ...mockUser, id: 'another-user-uuid' };
      mockProductsRepository.findOneBy.mockResolvedValue(existingProduct);

      await expect(
        service.update('p1', updateProductDto, anotherUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if product to update not found', async () => {
      mockProductsRepository.findOneBy.mockResolvedValue(null); // Simulate product not found by findOne

      await expect(
        service.update('nonexistent', updateProductDto, mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    const existingProduct = {
      id: 'p1',
      name: 'Product to delete',
      ownerId: mockUser.id,
    };

    it('should remove a product if user is owner', async () => {
      mockProductsRepository.findOneBy.mockResolvedValue(existingProduct);
      mockProductsRepository.delete.mockResolvedValue({ affected: 1 });

      await expect(service.remove('p1', mockUser)).resolves.toBeUndefined();
      expect(mockProductsRepository.delete).toHaveBeenCalledWith('p1');
    });

    it('should remove a product if user is admin', async () => {
      mockProductsRepository.findOneBy.mockResolvedValue(existingProduct);
      mockProductsRepository.delete.mockResolvedValue({ affected: 1 });

      await expect(service.remove('p1', mockAdminUser)).resolves.toBeUndefined();
    });

    it('should throw ForbiddenException if user is not owner or admin', async () => {
      const anotherUser: User = { ...mockUser, id: 'another-user-uuid' };
      mockProductsRepository.findOneBy.mockResolvedValue(existingProduct);

      await expect(service.remove('p1', anotherUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if product to remove not found', async () => {
      mockProductsRepository.findOneBy.mockResolvedValue(null); // Simulate product not found by findOne

      await expect(service.remove('nonexistent', mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if delete operation affects 0 rows', async () => {
      mockProductsRepository.findOneBy.mockResolvedValue(existingProduct);
      mockProductsRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove('p1', mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
