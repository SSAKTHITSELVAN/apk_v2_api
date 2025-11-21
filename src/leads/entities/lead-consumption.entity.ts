
// // ============ FILE 3: src/leads/entities/lead-consumption.entity.ts ============
// import {
//   Entity,
//   PrimaryGeneratedColumn,
//   Column,
//   CreateDateColumn,
//   ManyToOne,
//   JoinColumn,
// } from 'typeorm';
// import { Company } from '../../company/entities/company.entity';
// import { Lead } from './lead.entity';

// export enum LeadConsumptionType {
//   FREE = 'FREE',
//   BONUS = 'BONUS',
// }

// @Entity('lead_consumptions')
// export class LeadConsumption {
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   @Column({ type: 'uuid' })
//   companyId: string;

//   @ManyToOne(() => Company, (company) => company.leadConsumptions)
//   @JoinColumn({ name: 'companyId' })
//   company: Company;

//   @Column({ type: 'uuid' })
//   leadId: string;

//   @ManyToOne(() => Lead, (lead) => lead.consumptions)
//   @JoinColumn({ name: 'leadId' })
//   lead: Lead;

//   @Column({
//     type: 'enum',
//     enum: LeadConsumptionType,
//   })
//   consumptionType: LeadConsumptionType;

//   @Column({ type: 'text', nullable: true })
//   notes: string | null;

//   @CreateDateColumn()
//   consumedAt: Date;
// }



// ============ FILE 3: src/leads/entities/lead-consumption.entity.ts (UPDATED WITH CASCADE) ============
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Company } from '../../company/entities/company.entity';
import { Lead } from './lead.entity';

export enum LeadConsumptionType {
  FREE = 'FREE',
  BONUS = 'BONUS',
}

@Entity('lead_consumptions')
export class LeadConsumption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  companyId: string;

  @ManyToOne(() => Company, (company) => company.leadConsumptions, {
    onDelete: 'CASCADE' // When company is deleted, delete all its consumptions
  })
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column({ type: 'uuid' })
  leadId: string;

  @ManyToOne(() => Lead, (lead) => lead.consumptions, {
    onDelete: 'CASCADE' // When lead is deleted, delete all its consumptions
  })
  @JoinColumn({ name: 'leadId' })
  lead: Lead;

  @Column({
    type: 'enum',
    enum: LeadConsumptionType,
  })
  consumptionType: LeadConsumptionType;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  consumedAt: Date;
}