import { Entity, ObjectIdColumn, Column, ObjectId } from 'typeorm';

@Entity('submissions')
export class Submission {
  @ObjectIdColumn()
  _id!: ObjectId;

  @Column()
  formId!: string;

  @Column()
  formVersion!: number;

  @Column()
  submittedBy!: string;

  @Column()
  data!: Record<string, any>;

  @Column()
  status!: 'in-progress' | 'done';

  @Column()
  createdAt!: Date;

  @Column({ nullable: true })
  updatedAt?: Date;
}

