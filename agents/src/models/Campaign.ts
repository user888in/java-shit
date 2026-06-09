import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Interaction } from './Interaction';

@Entity('campaigns')
export class Campaign {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ default: 'draft' })
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';

  @Column({ type: 'int', default: 0 })
  targetProspectCount: number;

  @Column({ type: 'int', default: 0 })
  contactedCount: number;

  @Column({ type: 'int', default: 0 })
  respondedCount: number;

  @Column({ type: 'int', default: 0 })
  positiveResponseCount: number;

  @Column({ type: 'jsonb', default: {} })
  settings: Record<string, any>; // Email/LinkedIn sequencing rules, timing, etc.

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Interaction, interaction => interaction.campaign)
  interactions: Interaction[];
}