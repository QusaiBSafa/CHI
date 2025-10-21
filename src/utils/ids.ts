import { ObjectId } from 'mongodb';

export function generateId(): string {
  return new ObjectId().toString();
}

export function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id);
}

export function toObjectId(id: string): ObjectId {
  return new ObjectId(id);
}

