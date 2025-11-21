// // ============ FILE 1: src/company/entities/company.entity.ts ============
// import {
//   Entity,
//   Column,
//   PrimaryGeneratedColumn,
//   CreateDateColumn,
//   UpdateDateColumn,
//   OneToOne,
//   JoinColumn,
//   OneToMany,
//   ManyToOne,
// } from 'typeorm';
// import { User } from '../../auth/entities/user.entity';
// import { Lead } from '../../leads/entities/lead.entity';
// import { Referral } from './referral.entity';
// import { LeadConsumption } from '../../leads/entities/lead-consumption.entity';

// @Entity('companies')
// export class Company {
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   @Column({ type: 'varchar', unique: true })
//   gstin: string;

//   @Column({ type: 'varchar' })
//   legalName: string;

//   @Column({ type: 'varchar', nullable: true })
//   tradeName: string | null;

//   @Column({ type: 'varchar', default: 'Active' })
//   status: string;

//   @Column({ type: 'varchar', nullable: true })
//   registrationDate: string | null;

//   @Column({ type: 'varchar', nullable: true })
//   businessType: string | null;

//   @Column({ type: 'varchar', nullable: true })
//   constitutionOfBusiness: string | null;

//   @Column('simple-array', { nullable: true })
//   natureOfBusinessActivity: string[] | null;

//   @Column({ type: 'varchar', nullable: true })
//   centerJurisdiction: string | null;

//   @Column({ type: 'varchar', nullable: true })
//   stateJurisdiction: string | null;

//   @Column('jsonb', { nullable: true })
//   principalAddress: object | null;

//   @Column('jsonb', { nullable: true, default: [] })
//   additionalAddresses: object | null;

//   @Column({ type: 'varchar', nullable: true })
//   profileImage: string | null;

//   @Column({ type: 'varchar', nullable: true })
//   companyLogo: string | null;

//   // ============ REFERRAL SYSTEM ============
//   @Column({ type: 'varchar', unique: true, length: 6 })
//   referralCode: string;

//   @Column({ type: 'int', default: 10 })
//   monthlyFreeLeads: number; // Resets every month

//   @Column({ type: 'int', default: 0 })
//   bonusLeads: number; // From referrals, doesn't reset

//   @Column({ type: 'int', default: 10 })
//   currentMonthFreeLeads: number; // Tracks remaining free leads this month

//   @Column({ type: 'date', nullable: true })
//   lastLeadResetDate: Date | null; // Track when leads were last reset

//   // Referral tracking
//   @Column({ type: 'uuid', nullable: true })
//   referredByCompanyId: string | null;

//   @ManyToOne(() => Company, (company) => company.referredCompanies, { nullable: true })
//   @JoinColumn({ name: 'referredByCompanyId' })
//   referredBy: Company | null;

//   @OneToMany(() => Company, (company) => company.referredBy)
//   referredCompanies: Company[];

//   @OneToMany(() => Referral, (referral) => referral.referrer)
//   referralsGiven: Referral[];

//   @OneToMany(() => Referral, (referral) => referral.referee)
//   referralsReceived: Referral[];

//   // ============ EXISTING RELATIONS ============
//   @OneToOne(() => User, (user) => user.company)
//   @JoinColumn()
//   user: User;

//   @OneToMany(() => Lead, (lead) => lead.company)
//   leads: Lead[];

//   @OneToMany(() => LeadConsumption, (consumption) => consumption.company)
//   leadConsumptions: LeadConsumption[];

//   @CreateDateColumn()
//   createdAt: Date;

//   @UpdateDateColumn()
//   updatedAt: Date;
// }



// ============ FILE 1: src/company/entities/company.entity.ts (UPDATED WITH CASCADE) ============
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Lead } from '../../leads/entities/lead.entity';
import { Referral } from './referral.entity';
import { LeadConsumption } from '../../leads/entities/lead-consumption.entity';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  gstin: string;

  @Column({ type: 'varchar' })
  legalName: string;

  @Column({ type: 'varchar', nullable: true })
  tradeName: string | null;

  @Column({ type: 'varchar', default: 'Active' })
  status: string;

  @Column({ type: 'varchar', nullable: true })
  registrationDate: string | null;

  @Column({ type: 'varchar', nullable: true })
  businessType: string | null;

  @Column({ type: 'varchar', nullable: true })
  constitutionOfBusiness: string | null;

  @Column('simple-array', { nullable: true })
  natureOfBusinessActivity: string[] | null;

  @Column({ type: 'varchar', nullable: true })
  centerJurisdiction: string | null;

  @Column({ type: 'varchar', nullable: true })
  stateJurisdiction: string | null;

  @Column('jsonb', { nullable: true })
  principalAddress: object | null;

  @Column('jsonb', { nullable: true, default: [] })
  additionalAddresses: object | null;

  @Column({ type: 'varchar', nullable: true })
  profileImage: string | null;

  @Column({ type: 'varchar', nullable: true })
  companyLogo: string | null;

  // ============ REFERRAL SYSTEM ============
  @Column({ type: 'varchar', unique: true, length: 6 })
  referralCode: string;

  @Column({ type: 'int', default: 10 })
  monthlyFreeLeads: number;

  @Column({ type: 'int', default: 0 })
  bonusLeads: number;

  @Column({ type: 'int', default: 10 })
  currentMonthFreeLeads: number;

  @Column({ type: 'date', nullable: true })
  lastLeadResetDate: Date | null;

  // Referral tracking
  @Column({ type: 'uuid', nullable: true })
  referredByCompanyId: string | null;

  @ManyToOne(() => Company, (company) => company.referredCompanies, { 
    nullable: true,
    onDelete: 'SET NULL' // When referrer is deleted, set this to null
  })
  @JoinColumn({ name: 'referredByCompanyId' })
  referredBy: Company | null;

  @OneToMany(() => Company, (company) => company.referredBy)
  referredCompanies: Company[];

  @OneToMany(() => Referral, (referral) => referral.referrer, {
    cascade: true, // Cascade delete referrals when company is deleted
  })
  referralsGiven: Referral[];

  @OneToMany(() => Referral, (referral) => referral.referee, {
    cascade: true, // Cascade delete referrals when company is deleted
  })
  referralsReceived: Referral[];

  // ============ EXISTING RELATIONS ============
  @OneToOne(() => User, (user) => user.company, {
    onDelete: 'CASCADE' // When user is deleted, delete company (shouldn't happen in practice)
  })
  @JoinColumn()
  user: User;

  @OneToMany(() => Lead, (lead) => lead.company, {
    cascade: true, // Cascade delete leads when company is deleted
  })
  leads: Lead[];

  @OneToMany(() => LeadConsumption, (consumption) => consumption.company, {
    cascade: true, // Cascade delete lead consumptions when company is deleted
  })
  leadConsumptions: LeadConsumption[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}