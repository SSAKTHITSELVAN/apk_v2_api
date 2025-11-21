// // ============ FILE: src/leads/entities/lead-report.entity.ts ============
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

// export enum LeadReportStatus {
//   PENDING = 'PENDING',
//   REVIEWED = 'REVIEWED',
//   RESOLVED = 'RESOLVED',
//   DISMISSED = 'DISMISSED',
// }

// export enum LeadReportReason {
//   SPAM = 'SPAM',
//   INAPPROPRIATE = 'INAPPROPRIATE',
//   MISLEADING = 'MISLEADING',
//   DUPLICATE = 'DUPLICATE',
//   FRAUD = 'FRAUD',
//   OTHER = 'OTHER',
// }

// @Entity('lead_reports')
// export class LeadReport {
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   @Column({ type: 'uuid' })
//   leadId: string;

//   @ManyToOne(() => Lead, (lead) => lead.reports)
//   @JoinColumn({ name: 'leadId' })
//   lead: Lead;

//   @Column({ type: 'uuid', nullable: true })
//   reportedByCompanyId: string | null;

//   @ManyToOne(() => Company, { nullable: true })
//   @JoinColumn({ name: 'reportedByCompanyId' })
//   reportedByCompany: Company | null;

//   @Column({
//     type: 'enum',
//     enum: LeadReportReason,
//   })
//   reason: LeadReportReason;

//   @Column({ type: 'text' })
//   description: string;

//   @Column({
//     type: 'enum',
//     enum: LeadReportStatus,
//     default: LeadReportStatus.PENDING,
//   })
//   status: LeadReportStatus;

//   @Column({ type: 'text', nullable: true })
//   adminNotes: string | null;

//   @CreateDateColumn()
//   reportedAt: Date;

//   @Column({ type: 'timestamp', nullable: true })
//   reviewedAt: Date | null;
// }



// ============ FILE 4: src/leads/entities/lead-report.entity.ts (UPDATED WITH CASCADE) ============
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

export enum LeadReportStatus {
  PENDING = 'PENDING',
  REVIEWED = 'REVIEWED',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
}

export enum LeadReportReason {
  SPAM = 'SPAM',
  INAPPROPRIATE = 'INAPPROPRIATE',
  MISLEADING = 'MISLEADING',
  DUPLICATE = 'DUPLICATE',
  FRAUD = 'FRAUD',
  OTHER = 'OTHER',
}

@Entity('lead_reports')
export class LeadReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  leadId: string;

  @ManyToOne(() => Lead, (lead) => lead.reports, {
    onDelete: 'CASCADE' // When lead is deleted, delete all its reports
  })
  @JoinColumn({ name: 'leadId' })
  lead: Lead;

  @Column({ type: 'uuid', nullable: true })
  reportedByCompanyId: string | null;

  @ManyToOne(() => Company, { 
    nullable: true,
    onDelete: 'SET NULL' // When reporting company is deleted, set to null but keep the report
  })
  @JoinColumn({ name: 'reportedByCompanyId' })
  reportedByCompany: Company | null;

  @Column({
    type: 'enum',
    enum: LeadReportReason,
  })
  reason: LeadReportReason;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: LeadReportStatus,
    default: LeadReportStatus.PENDING,
  })
  status: LeadReportStatus;

  @Column({ type: 'text', nullable: true })
  adminNotes: string | null;

  @CreateDateColumn()
  reportedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date | null;
}