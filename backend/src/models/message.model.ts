import { Schema, model, Document, Types } from 'mongoose';

export type MessageType = 'text' | 'image' | 'system' | 'product' | 'order' | 'file';

export interface IMessage extends Document {
  conversation: Types.ObjectId;
  sender: Types.ObjectId;
  type: MessageType;
  content?: string; // text content (optional for non-text)
  attachments?: {
    url: string;
    name?: string;
    mimeType?: string;
    size?: number;
  }[];
  meta?: Record<string, any>; // e.g. { productId, orderId, quickReply }
  readBy?: Types.ObjectId[];  // read receipts (user ids)
  deletedFor?: Types.ObjectId[]; // per-user soft delete
  createdAt: Date;
  updatedAt: Date;

  // methods
  markRead(userId: Types.ObjectId): Promise<IMessage>;
  addAttachment(att: { url: string; name?: string; mimeType?: string; size?: number }): Promise<IMessage>;
}

const AttachmentSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    name: { type: String, trim: true, default: '' },
    mimeType: { type: String, trim: true, default: '' },
    size: { type: Number, default: 0 },
  },
  { _id: false }
);

const MessageSchema = new Schema<IMessage>(
  {
    conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['text', 'image', 'system', 'product', 'order', 'file'], default: 'text', index: true },
    content: { type: String, trim: true, default: '' },
    attachments: { type: [AttachmentSchema], default: [] },
    meta: { type: Schema.Types.Mixed, default: {} },
    readBy: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [], index: true },
    deletedFor: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [], index: true },
  },
  {
    timestamps: true, // createdAt & updatedAt
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/** Indexes for common queries (conversation messages, unread) */
MessageSchema.index({ conversation: 1, createdAt: -1 });
MessageSchema.index({ conversation: 1, _id: -1 }); // for pagination by _id
MessageSchema.index({ conversation: 1, readBy: 1 });

/**
 * Hook: after saving a message, update Conversation.lastMessage to this message
 * (useful so conversation list shows preview + lastActivity).
 * Use dynamic require to avoid circular deps; chỉnh đường dẫn 'Conversation' nếu cần.
 */
MessageSchema.post('save', async function (doc: IMessage) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ConversationModel = require('./Conversation').Conversation;
    await ConversationModel.findByIdAndUpdate(
      doc.conversation,
      { lastMessage: doc._id, updatedAt: new Date() },
      { new: true }
    ).exec();
  } catch (err) {
    // fail silently (do not block message save)
    // console.error('Failed to update conversation.lastMessage', err);
  }
});

/** Instance method: mark message read by user */
MessageSchema.methods.markRead = async function (userId: Types.ObjectId) {
  const uid = userId.toString();
  if (!this.readBy) this.readBy = [];
  if (!this.readBy.some((id: Types.ObjectId) => id.toString() === uid)) {
    this.readBy.push(userId);
    await this.save();
  }
  return this as IMessage;
};

/** Instance method: add attachment */
MessageSchema.methods.addAttachment = async function (att: { url: string; name?: string; mimeType?: string; size?: number }) {
  if (!this.attachments) this.attachments = [];
  this.attachments.push(att as any);
  await this.save();
  return this as IMessage;
};

/** Static helper idea (not implemented here): fetch messages with cursor pagination:
 *  - query: { conversation, before?: messageId, limit }
 *  - if before provided: find messages with _id < before sorted desc
 */

/** Virtual: preview text for conversation list (first non-empty content or '[image]' etc.) */
MessageSchema.virtual('preview').get(function () {
  if (this.type === 'text' && this.content) return this.content.slice(0, 200);
  if (this.type === 'image') return '[Image]';
  if (this.type === 'file') return '[File]';
  if (this.type === 'product') return '[Product]';
  return '[Message]';
});

export const Message = model<IMessage>('Message', MessageSchema);
