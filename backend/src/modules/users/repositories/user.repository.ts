import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from 'src/common/repositories/base.repository';
import { User } from 'src/modules/users/entities/user.entity';
import type { DeepPartial } from 'typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UserRepository extends BaseRepository<User> {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super(userRepository);
  }

  /**
   * Always merges data into a proper entity instance so that
   * @BeforeInsert / @BeforeUpdate hooks (e.g. password hashing) fire.
   */
  override save(data: DeepPartial<User>): Promise<User> {
    const entity = this.userRepository.create(data);
    return this.userRepository.save(entity);
  }

  findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['role', 'role.permissions'],
    });
  }

  findByIdWithRole(id: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['role', 'role.permissions'],
    });
  }
}
