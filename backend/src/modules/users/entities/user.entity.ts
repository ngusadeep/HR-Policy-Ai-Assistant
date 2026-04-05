import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { Role } from 'src/modules/roles/entities/role.entity';
import { BasicEntity } from 'src/common/entities/base.entity';
import * as crypto from 'crypto';

export enum UserGender {
  MALE = 'male',
  FEMALE = 'female',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say',
}

export enum UserStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
}

@Entity('users')
export class User extends BasicEntity {
  @Column({ length: 100, name: 'first_name' })
  firstName: string;

  @Column({ length: 100, name: 'last_name' })
  lastName: string;

  @Column({ length: 100, name: 'email', unique: true })
  email: string;

  @Column({ type: 'enum', enum: UserGender, name: 'gender' })
  gender: UserGender;

  @Column({ length: 150, name: 'title' })
  title: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    name: 'status',
    default: UserStatus.PENDING,
  })
  status: UserStatus;

  @Column({ length: 255 })
  password: string;

  @ManyToOne(() => Role, role => role.users, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'role_id' })
  role: Role | null;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPasswordBeforeInsertOrUpdate() {
    if (this.password && !this.password.includes(':')) {
      this.password = await this.#hashPassword(this.password);
    }
  }
  async #hashPassword(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const salt = crypto.randomBytes(16).toString('hex');
      crypto.scrypt(password, salt, 64, (err, derivedKey) => {
        if (err) reject(err);
        resolve(salt + ':' + derivedKey.toString('hex'));
      });
    });
  }

  async comparePassword(candidatePassword: string): Promise<boolean> {
    const [salt, storedHash] = this.password.split(':');
    if (!salt || !storedHash) {
      return false;
    }

    return new Promise((resolve, reject) => {
      crypto.scrypt(candidatePassword, salt, 64, (err, derivedKey) => {
        if (err) reject(err);
        resolve(storedHash === derivedKey.toString('hex'));
      });
    });
  }
}
