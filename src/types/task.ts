import { Types } from 'mongoose';

export interface IUser {
  _id: Types.ObjectId | string;
  name: string;
  email: string;
  phone?: string;
  rating?: number;
  isVerified?: boolean;
}

export interface ITask {
  _id: Types.ObjectId | string;
  title: string;
  description: string;
  category: string;
  location: string;
  startDate: Date;
  startTime: string;
  endDate?: Date;
  endTime?: string;
  budget: number;
  status: string;
  posterId: IUser | Types.ObjectId | string;
  assignedTo?: IUser | Types.ObjectId | string;
  payment?: {
    status: string;
    releasedAt?: Date;
  };
  workerCompletedAt?: Date;
  employerCompletedAt?: Date;
  employerApprovedAt?: Date;
  completedAt?: Date;
  completedBy?: Types.ObjectId | string;
  save: () => Promise<any>;
}