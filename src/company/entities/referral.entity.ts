
// // ============ FILE 2: src/company/entities/referral.entity.ts ============
// import {
//   Entity,
//   PrimaryGeneratedColumn,
//   Column,
//   CreateDateColumn,
//   ManyToOne,
//   JoinColumn,
// } from 'typeorm';
// import { Company } from './company.entity';

// @Entity('referrals')
// export class Referral {
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   @Column({ type: 'uuid' })
//   referrerId: string;

//   @ManyToOne(() => Company, (company) => company.referralsGiven)
//   @JoinColumn({ name: 'referrerId' })
//   referrer: Company;

//   @Column({ type: 'uuid' })
//   refereeId: string;

//   @ManyToOne(() => Company, (company) => company.referralsReceived)
//   @JoinColumn({ name: 'refereeId' })
//   referee: Company;

//   @Column({ type: 'varchar', length: 6 })
//   referralCode: string;

//   @Column({ type: 'int', default: 3 })
//   bonusLeadsAwarded: number;

//   @Column({ type: 'boolean', default: true })
//   isActive: boolean;

//   @CreateDateColumn()
//   createdAt: Date;
// }



// ============ FILE 5: src/company/entities/referral.entity.ts (UPDATED WITH CASCADE) ============
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Company } from './company.entity';

@Entity('referrals')
export class Referral {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  referrerId: string;

  @ManyToOne(() => Company, (company) => company.referralsGiven, {
    onDelete: 'CASCADE' // When referrer company is deleted, delete the referral record
  })
  @JoinColumn({ name: 'referrerId' })
  referrer: Company;

  @Column({ type: 'uuid' })
  refereeId: string;

  @ManyToOne(() => Company, (company) => company.referralsReceived, {
    onDelete: 'CASCADE' // When referee company is deleted, delete the referral record
  })
  @JoinColumn({ name: 'refereeId' })
  referee: Company;

  @Column({ type: 'varchar', length: 6 })
  referralCode: string;

  @Column({ type: 'int', default: 3 })
  bonusLeadsAwarded: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}