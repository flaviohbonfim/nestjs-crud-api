import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, IsNumber, Min, IsOptional } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    example: 'Laptop Pro 15"',
    description: 'Name of the product',
  })
  @IsString()
  @Length(2, 120)
  name: string;

  @ApiProperty({
    example: 'A powerful laptop for professionals',
    description: 'Optional description of the product',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 1499.99, description: 'Price of the product' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @ApiProperty({ example: 50, description: 'Available stock quantity' })
  @IsNumber()
  @Min(0)
  stock: number;
}
