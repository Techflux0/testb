import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async update(id: string, updateData: Partial<User>): Promise<User> {
    await this.usersRepository.update(id, updateData);
    return this.findOne(id);
  }

  async updateStats(id: string, stats: {
    xp?: number;
    level?: number;
    gamesPlayed?: number;
    currentStreak?: number;
    winRate?: number;
    totalPoints?: number;
  }): Promise<User> {
    const user = await this.findOne(id);
    
    if (stats.xp !== undefined) user.xp = stats.xp;
    if (stats.level !== undefined) user.level = stats.level;
    if (stats.gamesPlayed !== undefined) user.gamesPlayed = stats.gamesPlayed;
    if (stats.currentStreak !== undefined) user.currentStreak = stats.currentStreak;
    if (stats.winRate !== undefined) user.winRate = stats.winRate;
    if (stats.totalPoints !== undefined) user.totalPoints = stats.totalPoints;

    return this.usersRepository.save(user);
  }

  async delete(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }
}