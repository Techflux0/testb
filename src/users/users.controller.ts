import { Controller, Get, Param, Put, Body, Delete, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get('profile')
  async getProfile(@Req() req) {
    return this.usersService.findOne(req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findOne(id);
  }

  @Put('profile')
  async updateProfile(@Req() req, @Body() updateData: Partial<User>): Promise<User> {
    return this.usersService.update(req.user.id, updateData);
  }

  @Put('stats')
  async updateStats(@Req() req, @Body() stats: any): Promise<User> {
    return this.usersService.updateStats(req.user.id, stats);
  }

  @Delete('profile')
  async deleteProfile(@Req() req): Promise<{ message: string }> {
    await this.usersService.delete(req.user.id);
    return { message: 'User account deleted successfully' };
  }
}