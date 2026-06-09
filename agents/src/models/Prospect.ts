import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Interaction } from './Interaction';

@Entity('prospects')
export class Prospect {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone?: string;

  @Column()
  company: string;

  @Column({ nullable: true })
  title?: string;

  @Column({ nullable: true })
  licenseNumber?: string;

  @Column({ nullable: true })
  website?: string;

  @Column({ type: 'text', array: true, default: [] })
  specializations: string[]; // e.g., ['residential', 'luxury', 'commercial']

  @Column({ type: 'int', default: 0 })
  listingsCount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  averageSalePrice: number;

  @Column({ type: 'int', default: 0 })
  yearlyTransactionVolume: number;

  @Column({ type: 'simple-array', default: [] })
  socialMediaProfiles: string[]; // URLs to LinkedIn, Facebook, Instagram, etc.

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ type: 'simple_array', default: [] })
  recentListings: string[]; // Property addresses or MLS IDs

  @Column({ type: 'simple_array', default: [] })
  recentSales: string[]; // Property addresses or MLS IDs

  @Column({ type: 'jsonb', default: {} })
  techStack: Record<string, any>; // Detected technologies used

  @Column({ type: 'simple_array', default: [] })
  painPoints: string[]; // Identified from research

  @Column({ type: 'jsonb', default: {} })
  intelligenceData: Record<string, any>; // Raw gathered intelligence

  @Column({ type: 'boolean', default: false })
  isActive: boolean;

  @Column({ type: 'boolean', default: true })
  canContact: boolean; // Opt-out status

  @Column({ type: 'timestamp', nullable: true })
  lastContactedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Interaction, interaction => interaction.prospect)
  interactions: Interaction[];
}