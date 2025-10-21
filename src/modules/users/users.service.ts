import bcrypt from 'bcrypt';
import { UsersRepository } from './users.repository';
import { User } from './user.entity';

export class UsersService {
  private repository: UsersRepository;

  constructor() {
    this.repository = new UsersRepository();
  }

  async register(email: string, password: string): Promise<{ user: User; token?: string }> {
    const existingUser = await this.repository.findByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user with patient role by default
    const user = await this.repository.create({
      email,
      password: hashedPassword,
      role: 'patient',
      createdAt: new Date(),
    });

    return { user };
  }

  async login(email: string, password: string): Promise<User> {
    const user = await this.repository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    return user;
  }

  async findById(id: string): Promise<User | null> {
    return await this.repository.findById(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.repository.findByEmail(email);
  }

  async findAll(): Promise<User[]> {
    return await this.repository.findAll();
  }
}

