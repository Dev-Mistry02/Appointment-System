import 'dotenv/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import mongoose from 'mongoose';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Appointment from './models/Appointment.js';

const app = express();
const port = Number(process.env.PORT) || 5000;
const services = [
  'Preventive cleaning',
  'Teeth whitening',
  'Orthodontics',
  'Dental implants',
  'General consultation',
];
const appointmentTimes = [
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '01:00 PM',
  '01:30 PM',
  '02:00 PM',
  '02:30 PM',
  '03:00 PM',
  '03:30 PM',
];
const adminCookieName = 'dentalcare_admin';
const adminSessionDuration = 8 * 60 * 60 * 1000;
const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD;
const adminCredentialsConfigured = Boolean(adminEmail && adminPassword && adminPassword.length >= 16);
const adminSessionSecret = process.env.ADMIN_SESSION_SECRET || adminPassword;
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: 'Too many sign-in attempts. Please wait 15 minutes and try again.' },
});

function signAdminSession(payload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', adminSessionSecret).update(encodedPayload).digest('base64url');
  return `${encodedPayload}.${signature}`;
}

function readAdminSession(req) {
  const cookie = req.headers.cookie
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${adminCookieName}=`));
  if (!cookie) return null;

  const token = cookie.slice(adminCookieName.length + 1);
  const separator = token.lastIndexOf('.');
  if (separator < 1) return null;

  const encodedPayload = token.slice(0, separator);
  const receivedSignature = Buffer.from(token.slice(separator + 1), 'base64url');
  const expectedSignature = createHmac('sha256', adminSessionSecret).update(encodedPayload).digest();
  if (
    receivedSignature.length !== expectedSignature.length ||
    !timingSafeEqual(receivedSignature, expectedSignature)
  ) {
    return null;
  }

  try {
    const session = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (session.email !== adminEmail || !Number.isSafeInteger(session.expiresAt) || session.expiresAt <= Date.now()) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function setAdminCookie(res, token, maxAge) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${adminCookieName}=${token}; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`,
  );
}

function requireAdmin(req, res, next) {
  if (!adminCredentialsConfigured) {
    return res.status(503).json({ error: 'Admin access is not configured. Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 16 characters on the server.' });
  }
  const session = readAdminSession(req);
  if (!session) {
    return res.status(401).json({ error: 'Please sign in to access the admin dashboard.' });
  }
  req.adminEmail = session.email;
  return next();
}

function verifyAdminRequestOrigin(req, res, next) {
  const origin = req.get('origin');
  if (origin) {
    try {
      if (new URL(origin).hostname !== req.hostname) {
        return res.status(403).json({ error: 'This request origin is not allowed.' });
      }
    } catch {
      return res.status(403).json({ error: 'This request origin is not allowed.' });
    }
  }
  if (req.get('sec-fetch-site') === 'cross-site') {
    return res.status(403).json({ error: 'Cross-site admin requests are not allowed.' });
  }
  return next();
}

function getTodayString() {
  const today = new Date();
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');
}

function isValidCalendarDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

async function prepareAppointmentCollection() {
  const expectedPartialFilter = { status: { $in: ['pending', 'confirmed', 'completed'] } };
  let indexes = [];
  try {
    indexes = await Appointment.collection.indexes();
  } catch (error) {
    if (error?.code !== 26) throw error;
    await Appointment.createCollection();
  }

  await Appointment.updateMany(
    { status: { $exists: false } },
    { $set: { status: 'pending' } },
  );

  const appointmentTimeIndex = indexes.find((index) => index.key.date === 1 && index.key.time === 1);
  if (
    appointmentTimeIndex &&
    (!appointmentTimeIndex.unique ||
      JSON.stringify(appointmentTimeIndex.partialFilterExpression) !== JSON.stringify(expectedPartialFilter))
  ) {
    await Appointment.collection.dropIndex(appointmentTimeIndex.name);
  }
}

app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));

app.post('/api/admin/login', verifyAdminRequestOrigin, adminLoginLimiter, (req, res) => {
  if (!adminCredentialsConfigured) {
    return res.status(503).json({ error: 'Admin access is not configured. Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 16 characters on the server.' });
  }

  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const receivedEmail = createHmac('sha256', adminSessionSecret).update(email).digest();
  const expectedEmail = createHmac('sha256', adminSessionSecret).update(adminEmail).digest();
  const receivedPassword = createHmac('sha256', adminSessionSecret).update(password).digest();
  const expectedPassword = createHmac('sha256', adminSessionSecret).update(adminPassword).digest();
  const emailMatches = timingSafeEqual(receivedEmail, expectedEmail);
  const passwordMatches = timingSafeEqual(receivedPassword, expectedPassword);
  if (!emailMatches || !passwordMatches) {
    return res.status(401).json({ error: 'The email or password is incorrect.' });
  }

  const expiresAt = Date.now() + adminSessionDuration;
  setAdminCookie(res, signAdminSession({ email: adminEmail, expiresAt }), adminSessionDuration / 1000);
  return res.json({ email: adminEmail, expiresAt });
});

app.post('/api/admin/logout', verifyAdminRequestOrigin, (_req, res) => {
  setAdminCookie(res, '', 0);
  return res.status(204).end();
});

app.get('/api/admin/session', requireAdmin, (req, res) => {
  const session = readAdminSession(req);
  return res.json({ email: req.adminEmail, expiresAt: session.expiresAt });
});

app.use('/api/admin', requireAdmin, verifyAdminRequestOrigin);

app.get('/api/admin/appointments', async (req, res, next) => {
  try {
    const appointments = await Appointment.find({})
      .select('name email phone service date time message status createdAt')
      .sort({ date: -1, time: -1 })
      .limit(500)
      .lean();
    return res.json({ appointments });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/admin/appointments', async (req, res, next) => {
  try {
    const { name, email, phone, service, date, time, message = '' } = req.body ?? {};
    const cleanName = typeof name === 'string' ? name.trim() : '';
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const cleanPhone = typeof phone === 'string' ? phone.trim() : '';
    const cleanMessage = typeof message === 'string' ? message.trim() : null;
    const today = new Date();
    const todayString = getTodayString();

    if (
      cleanName.length < 2 ||
      cleanName.length > 80 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) ||
      cleanEmail.length > 254 ||
      cleanPhone.length < 7 ||
      cleanPhone.length > 24 ||
      !/^[+()\d.\-\s]+$/.test(cleanPhone) ||
      cleanPhone.replace(/\D/g, '').length < 7 ||
      !services.includes(service) ||
      !isValidCalendarDate(date) ||
      date < todayString ||
      !appointmentTimes.includes(time) ||
      cleanMessage === null ||
      cleanMessage.length > 500
    ) {
      return res.status(400).json({ error: 'Please check the appointment details and choose a valid time.' });
    }

    if (date === todayString) {
      const [, hourText, minuteText, meridiem] = time.match(/^(\d{2}):(\d{2}) (AM|PM)$/);
      let hour = Number(hourText) % 12;
      if (meridiem === 'PM') hour += 12;
      const appointmentDate = new Date(today);
      appointmentDate.setHours(hour, Number(minuteText), 0, 0);
      if (appointmentDate <= today) {
        return res.status(400).json({ error: 'Please choose a future appointment time.' });
      }
    }

    const appointment = await Appointment.create({
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      service,
      date,
      time,
      message: cleanMessage,
      status: 'confirmed',
    });
    return res.status(201).json({ appointment });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ error: 'That time was just booked. Please choose another time.' });
    }
    return next(error);
  }
});

app.patch('/api/admin/appointments/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body ?? {};
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid appointment ID.' });
    }
    if (!['confirmed', 'declined', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Choose a valid appointment status.' });
    }
    const requiredCurrentStatus = status === 'completed' ? 'confirmed' : 'pending';
    const appointment = await Appointment.findOneAndUpdate(
      { _id: id, status: requiredCurrentStatus },
      { $set: { status } },
      { new: true, runValidators: true, projection: 'name email phone service date time message status createdAt' },
    ).lean();
    if (!appointment) {
      if (await Appointment.exists({ _id: id })) {
        return res.status(409).json({ error: 'This appointment has already changed. Refresh and try again.' });
      }
      return res.status(404).json({ error: 'Appointment not found.' });
    }
    return res.json({ appointment });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/appointments', async (req, res, next) => {
  try {
    const { name, email, phone, service, date, time, message = '' } = req.body ?? {};
    const cleanName = typeof name === 'string' ? name.trim() : '';
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const cleanPhone = typeof phone === 'string' ? phone.trim() : '';
    const cleanMessage = typeof message === 'string' ? message.trim() : null;
    const today = new Date();
    const todayString = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('-');

    if (
      cleanName.length < 2 ||
      cleanName.length > 80 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) ||
      cleanEmail.length > 254 ||
      cleanPhone.length < 7 ||
      cleanPhone.length > 24 ||
      !/^[+()\d.\-\s]+$/.test(cleanPhone) ||
      cleanPhone.replace(/\D/g, '').length < 7 ||
      !services.includes(service) ||
      typeof date !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      date < todayString ||
      !appointmentTimes.includes(time) ||
      cleanMessage === null ||
      cleanMessage.length > 500
    ) {
      return res.status(400).json({ error: 'Please check your details and choose a valid appointment time.' });
    }

    const [year, month, day] = date.split('-').map(Number);
    const appointmentDate = new Date(year, month - 1, day);
    if (
      Number.isNaN(appointmentDate.getTime()) ||
      appointmentDate.getFullYear() !== year ||
      appointmentDate.getMonth() !== month - 1 ||
      appointmentDate.getDate() !== day
    ) {
      return res.status(400).json({ error: 'Please choose a valid appointment date.' });
    }
    if (date === todayString) {
      const [, hourText, minuteText, meridiem] = time.match(/^(\d{2}):(\d{2}) (AM|PM)$/);
      let hour = Number(hourText) % 12;
      if (meridiem === 'PM') hour += 12;
      appointmentDate.setHours(hour, Number(minuteText), 0, 0);
      if (appointmentDate <= today) {
        return res.status(400).json({ error: 'Please choose a future appointment time.' });
      }
    }

    const appointment = await Appointment.create({
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      service,
      date,
      time,
      message: cleanMessage,
      status: 'pending',
    });

    return res.status(201).json({
      message: 'Your appointment request has been received.',
      appointment: { id: appointment.id, date: appointment.date, time: appointment.time },
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ error: 'That time was just booked. Please choose another time.' });
    }
    return next(error);
  }
});

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const frontendDirectory = path.resolve(currentDirectory, '..', 'client', 'dist');
app.use(express.static(frontendDirectory, { maxAge: '1d', index: false }));
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api/')) {
    return next();
  }
  return res.sendFile(path.join(frontendDirectory, 'index.html'), (error) => {
    if (error) next(error);
  });
});

app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({ error: 'Request body must be valid JSON.' });
  }
  console.error('Request failed:', error);
  return res.status(500).json({ error: 'Unable to process your request right now.' });
});

try {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dentalcare');
  await prepareAppointmentCollection();
  await Appointment.init();
  app.listen(port, () => {
    console.log(`DentalCare server listening on http://localhost:${port}`);
  });
} catch (error) {
  console.error('Could not connect to MongoDB. Check MONGODB_URI and ensure the database is running.', error);
  process.exitCode = 1;
}
