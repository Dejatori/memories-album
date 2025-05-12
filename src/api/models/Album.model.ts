import mongoose, { Document, Schema, model } from 'mongoose';

/**
 * Interface for Album document
 * Extends the Mongoose Document type
 */
export interface IAlbum extends Document {
  name: string;
  description?: string;
  owner: mongoose.Types.ObjectId;
  coverImageUrl?: string;
  mediaItems: mongoose.Types.ObjectId[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose schema for Album
 * Defines fields, validations and relationships
 */
const albumSchema = new Schema<IAlbum>(
  {
    // Name: required, trimmed
    name: {
      type: String,
      required: [true, 'Album name is required'],
      trim: true,
    },
    
    // Description: optional, trimmed
    description: {
      type: String,
      trim: true,
    },
    
    // Owner: required reference to a User model
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Album owner is required'],
    },
    
    // Cover image URL: optional
    coverImageUrl: {
      type: String,
    },
    
    // Media items: array of references to MediaItem model
    mediaItems: [{
      type: Schema.Types.ObjectId,
      ref: 'MediaItem',
      default: [], // Default to empty array
    }],
    
    // A public flag: boolean, defaults to false
    isPublic: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    // Enable timestamps for createdAt and updatedAt
    timestamps: true,
  }
);

// Create and export the Album model
export default model<IAlbum>('Album', albumSchema);