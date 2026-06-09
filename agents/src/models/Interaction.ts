import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Prospect } from './Prospect';
import { Campaign } from './Campaign';

@Entity('interactions')
export class Interaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  type: 'email' | 'linkedin' | 'call' | 'meeting';

  @Column()
  direction: 'inbound' | 'outbound';

  @Column()
  subject: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ nullable: true })
  sentAt?: Date;

  @Column({ nullable: true })
  receivedAt?: Date;

  @Column({ nullable: true })
  openedAt?: Date;

  @Column({ nullable: true })
  clickedAt?: Date;

  @Column({ nullable: true })
  repliedAt?: Date;

  @Column({ default: 'neutral' })
  sentiment: 'positive' | 'neutral' | 'negative';

  @Column({ nullable: true })
  outcome: string; // e.g., 'demo_scheduled', 'not_interested', 'follow_up_needed'

  @ManyToOne(() => Prospect, prospect => prospect.interactions)
  prospect: Prospect;

  @ManyToOne(() => Campaign, campaign => campaign.interactions, { nullable: true })
  campaign: Campaign;

  @CreateDateColumn()
  createdAt: Date;
}