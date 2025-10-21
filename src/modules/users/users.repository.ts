import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import { User } from './user.entity';
import { toObjectId } from '../../utils/ids';

export class UsersRepository {
  private repository: Repository<User>;

  constructor() {
    this.repository = AppDataSource.getRepository(User);
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.repository.create(userData);
    return await this.repository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.repository.findOne({ where: { email } as any });
  }

  async findById(id: string): Promise<User | null> {
    return await this.repository.findOne({ where: { _id: toObjectId(id) } });
  }

  async findAll(): Promise<User[]> {
    return await this.repository.find();
  }

  async update(id: string, userData: Partial<User>): Promise<User | null> {
    await this.repository.update(id, userData as any);
    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== 0;
  }
}

