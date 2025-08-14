import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  findAll(): Promise<User[]> {
    // Note: In a real app, you'd likely want to return a DTO
    // to avoid exposing entity fields like passwordHash, even if excluded.
    // For this project, a ClassSerializerInterceptor will handle this later.
    return this.usersService.findAll();
  }
}
