import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reportId: { type: String, required: true, unique: true },
  type: String,
  platform: String,
  city: String,
  description: String,
  url: String,
  phone: String,
  financial_loss: Number,
  timestamp: { type: Date, default: Date.now },
  status: { type: String, default: 'Submitted' }, // Submitted, Verified, Dismissed
  reportedBy: String, // UID of user
});

const Report = mongoose.model('Report', reportSchema);
export default Report;
