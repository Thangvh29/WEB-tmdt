import { Schema, model, Document, Types } from 'mongoose';

export interface IConversation extends Document {
  participants: Types.ObjectId[];   // tối thiểu 2
  isGroup: boolean;                // true nếu group chat
  title?: string | null;           // tên group nếu có
  avatar?: string | null;          // avatar group
  lastMessage?: Types.ObjectId | null; // ref Message
  meta?: Record<string, any>;      // mở rộng (ví dụ: pinned, tags)
  createdAt: Date;
  updatedAt: Date;

  // methods
  addParticipant(userId: Types.ObjectId): Promise<IConversation>;
  removeParticipant(userId: Types.ObjectId): Promise<IConversation>;
}

const ConversationSchema = new Schema<IConversation>(
  {
    participants: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      validate: {
        validator: (arr: Types.ObjectId[]) => Array.isArray(arr) && arr.length >= 2,
        message: 'A conversation must have at least 2 participants',
      },
      index: true,
    },
    isGroup: { type: Boolean, default: false, index: true },
    title: { type: String, trim: true, maxlength: 200, default: null },
    avatar: { type: String, trim: true, default: null },
    lastMessage: { type: Schema.Types.ObjectId, ref: 'Message', default: null, index: true },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/** Index để tránh duplicate 1:1 conversation giữa 2 user (unordered pair)
 *  - Lưu ý: compound unique index cho mảng không trực tiếp work; dùng normalized key for 2-person chat.
 *  - Implement: for 1:1 chat set `isGroup=false` và thêm `participantsKey` (sorted joined ids) để unique.
 */
ConversationSchema.add({
  participantsKey: { type: String, required: false, index: true, unique: false },
});

// Pre-validate: set participantsKey for non-group 1:1 conversations
ConversationSchema.pre<IConversation>('validate', function (next) {
  try {
    // normalize participants (remove duplicates) and sort
    if (Array.isArray(this.participants)) {
      const uniqueIds = Array.from(new Set(this.participants.map(id => id.toString())));
      this.participants = uniqueIds.map(s => new Types.ObjectId(s));
    }

    if (!this.isGroup && this.participants.length === 2) {
      // create stable key "id1_id2" sorted lexicographically to enforce uniqueness easily
      const sorted = this.participants.map(id => id.toString()).sort();
      // @ts-ignore
      this.participantsKey = sorted.join('_');
    } else {
      // group chats: participantsKey optional (could be used for dedupe if you want)
      // @ts-ignore
      this.participantsKey = null;
    }
    next();
  } catch (err) {
    next(err as any);
  }
});

/** Unique index on participantsKey for 1:1 conversations */
ConversationSchema.index({ participantsKey: 1 }, { unique: true, sparse: true });

/** Virtual: memberCount */
ConversationSchema.virtual('memberCount').get(function (this: IConversation) {
  return Array.isArray(this.participants) ? this.participants.length : 0;
});

/** Methods */
ConversationSchema.methods.addParticipant = async function (userId: Types.ObjectId) {
  const uid = userId.toString();
  if (!this.participants.some((p: Types.ObjectId) => p.toString() === uid)) {
    this.participants.push(userId);
    // if participants > 2 then it's a group
    if (this.participants.length > 2) this.isGroup = true;
    await this.save();
  }
  return this;
};

ConversationSchema.methods.removeParticipant = async function (userId: Types.ObjectId) {
  const uid = userId.toString();
  this.participants = this.participants.filter((p: Types.ObjectId) => p.toString() !== uid) as Types.ObjectId[];
  if (this.participants.length <= 2) this.isGroup = false;
  await this.save();
  return this;
};

export const Conversation = model<IConversation>('Conversation', ConversationSchema);
