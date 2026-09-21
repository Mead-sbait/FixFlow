import { Schema, model } from 'mongoose'

export const issueStatuses = ['open', 'assigned', 'in_progress', 'completed', 'cancelled'] as const
const ref = (name: string, required = true) => ({ type: Schema.Types.ObjectId, ref: name, required })
const options = {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform(_doc: unknown, ret: Record<string, unknown>) {
      delete ret._id
      delete ret.__v
      delete ret.passwordHash
      return ret
    }
  }
}

const userSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['user', 'technician', 'admin'], default: 'user', required: true }
}, options)

const categorySchema = new Schema({
  name: { type: String, required: true, unique: true, trim: true, maxlength: 100 }
}, options)

const issueSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true, maxlength: 200 },
  status: { type: String, enum: issueStatuses, default: 'open', required: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium', required: true },
  reporterId: ref('User'),
  technicianId: { ...ref('User', false), default: null },
  categoryId: ref('Category')
}, options)
for (const field of ['reporterId', 'technicianId', 'status', 'priority', 'categoryId', 'createdAt']) {
  issueSchema.index({ [field]: 1 })
}

const commentSchema = new Schema({
  issueId: ref('Issue'),
  userId: ref('User'),
  message: { type: String, required: true, trim: true },
  isInternal: { type: Boolean, default: false, required: true }
}, options)
commentSchema.index({ issueId: 1, createdAt: 1 })

const historySchema = new Schema({
  issueId: ref('Issue'),
  changedBy: ref('User'),
  fromStatus: { type: String, enum: [...issueStatuses, null], default: null },
  toStatus: { type: String, enum: issueStatuses, required: true },
  changedAt: { type: Date, default: Date.now, required: true }
}, options)
historySchema.index({ issueId: 1, changedAt: 1 })

const notificationSchema = new Schema({
  userId: ref('User'),
  issueId: ref('Issue', false),
  type: { type: String, required: true, maxlength: 50 },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false, required: true }
}, options)
notificationSchema.index({ userId: 1, isRead: 1 })

export const User = model('User', userSchema)
export const Category = model('Category', categorySchema)
export const Issue = model('Issue', issueSchema)
export const Comment = model('Comment', commentSchema)
export const IssueStatusHistory = model('IssueStatusHistory', historySchema)
export const Notification = model('Notification', notificationSchema)
