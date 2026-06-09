import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('message_templates')
export class MessageTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  type: 'email' | 'linkedin_connection' | 'linkedin_message';

  @Column({ type: 'text' })
  subject: string; // For emails; for LinkedIn, this might be the connection note or message prefix

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'jsonb', default: {} })
  variables: Record<string, any>; // Available variables for personalization (e.g., {firstName, company, recentSale})

  @Column({ type: 'simple_array', default: [] })
  tags: string[]; // e.g., ['intro', 'follow_up', 'value_prop', 'breakup']

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  usageCount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.0 })
  averageResponseRate: number; // Track performance

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}