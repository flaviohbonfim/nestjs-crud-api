import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: "User's email address",
  })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'S3cureP@ssw0rd!', description: "User's password" })
  @IsString()
  password: string;
}
