import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import { Form } from './form.entity';
import { toObjectId } from '../../utils/ids';

export class FormsRepository {
  private repository: Repository<Form>;

  constructor() {
    this.repository = AppDataSource.getRepository(Form);
  }

  async create(formData: Partial<Form>): Promise<Form> {
    const form = this.repository.create(formData);
    return await this.repository.save(form);
  }

  async findById(id: string): Promise<Form | null> {
    return await this.repository.findOne({ where: { _id: toObjectId(id) } });
  }

  async findByFormId(formId: string): Promise<Form[]> {
    return await this.repository.find({ 
      where: { formId } as any,
      order: { version: 'DESC' } as any
    });
  }

  async findLatestPublished(formId: string): Promise<Form | null> {
    const forms = await this.repository.find({
      where: { formId, status: 'published' } as any,
      order: { version: 'DESC' } as any,
      take: 1,
    });
    return forms[0] || null;
  }

  async findByStatus(status: 'draft' | 'published' | 'archived'): Promise<Form[]> {
    return await this.repository.find({
      where: { status } as any,
      order: { createdAt: 'DESC' } as any,
    });
  }

  async findDraftByFormId(formId: string): Promise<Form | null> {
    return await this.repository.findOne({
      where: { formId, status: 'draft' } as any,
    });
  }

  async findLatestDraft(formId: string): Promise<Form | null> {
    const forms = await this.repository.find({
      where: { formId, status: 'draft' } as any,
      order: { version: 'DESC' } as any,
      take: 1,
    });
    return forms[0] || null;
  }

  async update(id: string, formData: Partial<Form>): Promise<Form | null> {
    await this.repository.update(id, formData as any);
    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== 0;
  }

  async countByFormId(formId: string): Promise<number> {
    return await this.repository.count({ where: { formId } as any });
  }
}

