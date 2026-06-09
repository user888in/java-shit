import { DataSource } from 'typeorm';
import { Prospect } from './Prospect';
import { Interaction } from './Interaction';
import { Campaign } from './Campaign';
import { MessageTemplate } from './MessageTemplate';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'real_estate_agent',
  synchronize: true, // Set to false in production
  logging: false,
  entities: [Prospect, Interaction, Campaign, MessageTemplate],
  subscribers: [],
  migrations: [],
});