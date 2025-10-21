import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import { Submission } from './submission.entity';
import { toObjectId } from '../../utils/ids';

export class SubmissionsRepository {
  private repository: Repository<Submission>;

  constructor() {
    this.repository = AppDataSource.getRepository(Submission);
  }

  async create(submission: Partial<Submission>): Promise<Submission> {
    const newSubmission = this.repository.create(submission);
    return await this.repository.save(newSubmission);
  }

  async findById(id: string): Promise<Submission | null> {
    return await this.repository.findOne({
      where: { _id: toObjectId(id) }
    });
  }

  async findByFormId(formId: string): Promise<Submission[]> {
    return await this.repository.find({
      where: { formId },
      order: { createdAt: 'DESC' }
    });
  }

  // Assumption that user can submit the same for multiple times, we can limit this in the future if needed, the user might want to submit a form every month or every year
  async findByFormIdAndUser(formId: string, submittedBy: string): Promise<Submission[]> {
    return await this.repository.find({
      where: { formId, submittedBy },
      order: { createdAt: 'DESC' }
    });
  }

  async findByUser(submittedBy: string): Promise<Submission[]> {
    return await this.repository.find({
      where: { submittedBy },
      order: { createdAt: 'DESC' }
    });
  }

  async findByStatus(status: 'in-progress' | 'done'): Promise<Submission[]> {
    return await this.repository.find({
      where: { status },
      order: { createdAt: 'DESC' }
    });
  }

  async update(id: string, updates: Partial<Submission>): Promise<Submission | null> {
    const result = await this.repository.update(
      { _id: toObjectId(id) },
      { ...updates, updatedAt: new Date() }
    );
    
    if (result.affected === 0) {
      return null;
    }
    
    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete({ _id:toObjectId(id) });
    return result.affected !== 0;
  }

  async findInProgressByFormIdAndUser(formId: string, submittedBy: string): Promise<Submission | null> {
    return await this.repository.findOne({
      where: { 
        formId,
        submittedBy, 
        status: 'in-progress' 
      },
      order: { createdAt: 'DESC' }
    });
  }

  async findCompletedByFormIdAndUser(id: string, submittedBy: string): Promise<Submission[]> {
    return await this.repository.find({
      where: { 
        _id: toObjectId(id), 
        submittedBy, 
        status: 'done' 
      },
      order: { createdAt: 'DESC' }
    });
  }

  async getAllSubmissions(): Promise<Submission[]> {
    return await this.repository.find({
      order: { createdAt: 'DESC' }
    });
  }

 
}
