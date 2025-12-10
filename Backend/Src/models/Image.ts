import mongoose from 'mongoose';
const imageSchema = new mongoose.Schema({
  filename: String,
  mimetype: String,
  data: Buffer,
  uploadedBy: String,
  uploadedAt: { type: Date, default: Date.now },
});
export default mongoose.model('Image', imageSchema);
