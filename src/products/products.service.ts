import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { User } from '../users/user.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  async create(
    createProductDto: CreateProductDto,
    user: User,
  ): Promise<Product> {
    const product = this.productsRepository.create({
      ...createProductDto,
      ownerId: user.id,
    });
    return this.productsRepository.save(product);
  }

  async findAll(): Promise<Product[]> {
    // We will add pagination, filtering, and sorting later
    return this.productsRepository.find();
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepository.findOneBy({ id });
    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }
    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    user: User,
  ): Promise<Product> {
    const product = await this.findOne(id);

    if (product.ownerId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException(
        'You are not allowed to update this product',
      );
    }

    const updatedProduct = this.productsRepository.merge(
      product,
      updateProductDto,
    );
    return this.productsRepository.save(updatedProduct);
  }

  async remove(id: string, user: User): Promise<void> {
    const product = await this.findOne(id);

    if (product.ownerId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException(
        'You are not allowed to delete this product',
      );
    }

    const result = await this.productsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }
  }
}
