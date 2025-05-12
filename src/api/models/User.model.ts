import mongoose, { Document, Schema, model } from 'mongoose';

/**
 * Interface for User document
 * Extends the Mongoose Document type
 */
export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  profilePictureUrl?: string;
  albums: mongoose.Types.ObjectId[];
}

/**
 * Mongoose schema for User
 * Defines fields, validations and relationships
 */
const userSchema = new Schema<IUser>({
  // Username: required, unique, trimmed
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
  },
  
  // Email: required, unique, trimmed, lowercase, with email validation
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    // Simple email validation regex
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address'
    ],
  },
  
  // Password: required (hashing handled before save)
  password: {
    type: String,
    required: [true, 'Password is required'],
    // Note: Password hashing should be handled in a pre-save hook or service.
  },
  
  // Profile picture URL: optional
  profilePictureUrl: {
    type: String,
    // An optional field, no required validation
  },
  
  // Albums: array of references to an Album model
  albums: [{
    type: Schema.Types.ObjectId,
    ref: 'Album',
    default: [], // Default to empty array
  }],
});

// Create and export the User model
export default model<IUser>('User', userSchema);