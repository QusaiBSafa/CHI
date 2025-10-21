import { Entity, ObjectIdColumn, Column, ObjectId } from 'typeorm';

@Entity('users')
export class User {
  @ObjectIdColumn()
  _id!: ObjectId;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column()
  role!: 'admin' | 'patient';

  @Column()
  createdAt!: Date;
}

