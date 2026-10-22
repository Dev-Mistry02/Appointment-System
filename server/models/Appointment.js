import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, required: true, trim: true, maxlength: 24 },
    service: { type: String, required: true, maxlength: 60 },
    date: { type: String, required: true },
    time: { type: String, required: true },
    message: { type: String, trim: true, maxlength: 500, default: '' },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'declined', 'completed'],
      default: 'pending',
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

appointmentSchema.index(
  { date: 1, time: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['pending', 'confirmed', 'completed'] } },
  },
);

export default mongoose.model('Appointment', appointmentSchema);
