import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  displayName: String,
  email: String,
  points: { type: Number, default: 0 },
  levelProgress: { type: Object, default: {} },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
export default User;
