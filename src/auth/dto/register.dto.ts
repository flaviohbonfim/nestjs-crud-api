import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe', description: "User's full name" })
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: "User's email address",
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'S3cureP@ssw0rd!',
    description: "User's password (min 8 characters)",
  })
  @IsString()
  @MinLength(8)
  password: string;
}
