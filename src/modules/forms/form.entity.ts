import { Entity, ObjectIdColumn, Column, ObjectId } from 'typeorm';

@Entity('forms')
export class Form {
  @ObjectIdColumn()
  _id!: ObjectId;

  @Column()
  formId!: string;

  @Column()
  name!: string;

  @Column()
  version!: number;

  @Column()
  status!: 'draft' | 'published' | 'archived';

  @Column()
  definition!: any;

  @Column()
  createdBy!: string;

  @Column()
  createdAt!: Date;

  @Column({ nullable: true })
  publishedAt?: Date;

  @Column({ nullable: true })
  updatedAt?: Date;

  @Column({ nullable: true })
  updatedBy?: string;
}

