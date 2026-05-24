import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import * as bcrypt from 'bcrypt';

export const ANALYTICS_DIGEST_FREQUENCIES = ['off', 'hourly', 'daily', 'weekly', 'monthly'] as const;
export type AnalyticsDigestFrequency = (typeof ANALYTICS_DIGEST_FREQUENCIES)[number];

export type UserDocument = HydratedDocument<User>;

@Schema({ collection: 'users' })
export class User {
  @Prop({ unique: true, minLength: 3, required: true })
  username: string;

  @Prop({ unique: true, sparse: true, lowercase: true, trim: true })
  email?: string;

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop()
  emailVerificationToken?: string;

  @Prop()
  emailVerificationExpires?: Date;

  @Prop()
  passwordResetToken?: string;

  @Prop()
  passwordResetExpires?: Date;

  @Prop({ minLength: 6, required: true })
  password: string;

  @Prop({
    type: String,
    enum: ANALYTICS_DIGEST_FREQUENCIES,
    default: 'off',
  })
  analyticsDigestFrequency: AnalyticsDigestFrequency;

  @Prop({ type: Date })
  analyticsDigestLastSentAt?: Date;

  async verifyPassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.verifyPassword = function (
  password: string,
): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};
