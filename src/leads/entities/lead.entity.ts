// // ============ FILE: src/leads/entities/lead.entity.ts (UPDATED) ============
// import { 
//   Entity, 
//   PrimaryGeneratedColumn, 
//   Column, 
//   CreateDateColumn, 
//   UpdateDateColumn, 
//   ManyToOne,
//   OneToMany,
// } from 'typeorm';
// import { Company } from '../../company/entities/company.entity';
// import { LeadConsumption } from './lead-consumption.entity';
// import { LeadReport } from './lead-report.entity';

// @Entity('leads')
// export class Lead {
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   @Column()
//   title: string;

//   @Column('text')
//   description: string;

//   @Column({ nullable: true })
//   imageKey: string;

//   @Column({ nullable: true })
//   imageName: string;

//   @Column({ nullable: true })
//   imageSize: number;

//   @Column({ nullable: true })
//   imageMimeType: string;

//   @Column({ nullable: true })
//   budget: string;

//   @Column({ nullable: true })
//   quantity: string;

//   @Column({ nullable: true })
//   location: string;

//   @Column({ default: true })
//   isActive: boolean;

//   @Column({ nullable: true })
//   reasonForDeactivation?: string;

//   @Column({ default: 0 })
//   viewCount: number;

//   @Column({ default: 0 })
//   consumptionCount: number;

//   @Column({ default: 0 })
//   reportCount: number;

//   @Column({ default: false })
//   isDeleted: boolean;

//   @CreateDateColumn()
//   createdAt: Date;

//   @UpdateDateColumn()
//   updatedAt: Date;

//   @ManyToOne(() => Company, (company) => company.leads)
//   company: Company;

//   @Column()
//   companyId: string;

//   @OneToMany(() => LeadConsumption, (consumption) => consumption.lead)
//   consumptions: LeadConsumption[];

//   @OneToMany(() => LeadReport, (report) => report.lead)
//   reports: LeadReport[];
// }


// ============ FILE 2: src/leads/entities/lead.entity.ts (UPDATED WITH CASCADE) ============
import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn, 
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Company } from '../../company/entities/company.entity';
import { LeadConsumption } from './lead-consumption.entity';
import { LeadReport } from './lead-report.entity';

@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ nullable: true })
  imageKey: string;

  @Column({ nullable: true })
  imageName: string;

  @Column({ nullable: true })
  imageSize: number;

  @Column({ nullable: true })
  imageMimeType: string;

  @Column({ nullable: true })
  budget: string;

  @Column({ nullable: true })
  quantity: string;

  @Column({ nullable: true })
  location: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  reasonForDeactivation?: string;

  @Column({ default: 0 })
  viewCount: number;

  @Column({ default: 0 })
  consumptionCount: number;

  @Column({ default: 0 })
  reportCount: number;

  @Column({ default: false })
  isDeleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  companyId: string;

  @ManyToOne(() => Company, (company) => company.leads, {
    onDelete: 'CASCADE' // When company is deleted, delete all its leads
  })
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @OneToMany(() => LeadConsumption, (consumption) => consumption.lead, {
    cascade: true, // Cascade delete consumptions when lead is deleted
  })
  consumptions: LeadConsumption[];

  @OneToMany(() => LeadReport, (report) => report.lead, {
    cascade: true, // Cascade delete reports when lead is deleted
  })
  reports: LeadReport[];
}