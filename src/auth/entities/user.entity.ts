// // File: src/auth/entities/user.entity.ts

// import {
//   Entity,
//   Column,
//   PrimaryGeneratedColumn,
//   CreateDateColumn,
//   UpdateDateColumn,
//   OneToOne,
// } from 'typeorm';
// import { Company } from '../../company/entities/company.entity';

// @Entity('users')
// export class User {
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   @Column({ type: 'varchar', unique: true })
//   mobileNumber: string;

//   @Column({ type: 'varchar', nullable: true })
//   lastOtp: string | null;

//   @Column({ type: 'timestamp', nullable: true })
//   otpExpiresAt: Date | null;

//   @Column({ default: false })
//   isVerified: boolean;

//   @Column({ default: true })
//   isActive: boolean;

//   @OneToOne(() => Company, (company) => company.user, { nullable: true })
//   company: Company;

//   @CreateDateColumn()
//   createdAt: Date;

//   @UpdateDateColumn()
//   updatedAt: Date;
// }



// ============ FILE 6: src/auth/entities/user.entity.ts (UPDATED WITH CASCADE) ============
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';
import { Company } from '../../company/entities/company.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  mobileNumber: string;

  @Column({ type: 'varchar', nullable: true })
  lastOtp: string | null;

  @Column({ type: 'timestamp', nullable: true })
  otpExpiresAt: Date | null;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: true })
  isActive: boolean;

  @OneToOne(() => Company, (company) => company.user, { 
    nullable: true,
    cascade: true, // When user is deleted, cascade delete company
  })
  company: Company;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}