import { DataSource } from 'typeorm';
import { env } from './env';
import { User } from '../modules/users/user.entity';
import { Form } from '../modules/forms/form.entity';
import { Submission } from '../modules/submissions/submission.entity';

export const AppDataSource = new DataSource({
  type: 'mongodb',
  url: env.mongoUrl,
  synchronize: env.nodeEnv === 'development',
  logging: env.nodeEnv === 'development',
  entities: [User, Form, Submission],
  migrations: [],
  subscribers: [],
});

