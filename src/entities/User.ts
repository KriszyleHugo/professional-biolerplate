import 'reflect-metadata';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('users')
@Index(['email'])
@Index(['verificationToken'], { unique: true })
@Index(['resetPasswordToken'], { unique: true })

export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255, select: false })
  password!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'int', nullable: true })
  age!: number | null;

  @Column({ default: false})
  isVerified!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true , select: false })
  verificationToken!: string | null;

  @Column({ type: 'datetime', nullable: true })
  verificationTokenExpiry!: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  resetPasswordToken!: string | null;

  @Column({ type: 'datetime', nullable: true })
  resetPasswordExpiry!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}