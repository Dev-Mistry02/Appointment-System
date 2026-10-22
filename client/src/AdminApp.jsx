import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from './api.js';

const services = [
  'Preventive cleaning',
  'Teeth whitening',
  'Orthodontics',
  'Dental implants',
  'General consultation',
];

const timeSlots = [
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

const navigation = [
  { label: 'Dashboard', icon: 'space_dashboard', target: 'top' },
  { label: 'Appointments & Schedule', icon: 'calendar_month', target: 'schedule' },
  { label: 'Patient Directory', icon: 'group', target: 'records' },
];

function localDateString(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function parseDate(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(value, options = {}) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-US', options).format(parseDate(value));
}

function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function appointmentMinutes(time) {
  const match = time.match(/^(\d{2}):(\d{2}) (AM|PM)$/);
  if (!match) return 0;
  let hour = Number(match[1]) % 12;
  if (match[3] === 'PM') hour += 12;
  return hour * 60 + Number(match[2]);
}

async function readResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || 'The request could not be completed.');
    error.status = response.status;
    throw error;
  }
  return data;
}

function Icon({ name, className = '' }) {
  return <span className={`admin-icon ${className}`} aria-hidden="true">{name}</span>;
}

function LoginScreen({ onLogin, initialError = '' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(initialError);

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await onLogin(email, password);
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="admin-login">
      <section className="admin-login-card" aria-labelledby="admin-login-title">
        <a className="admin-brand admin-login-brand" href="/" aria-label="DentalCare home">
          <span className="admin-brand-mark"><Icon name="health_and_safety" /></span>
          <span>DentalCare</span>
        </a>
        <span className="admin-eyebrow">CLINIC ADMINISTRATION</span>
        <h1 id="admin-login-title">Welcome back.</h1>
        <p className="admin-login-copy">Sign in to manage appointments and your clinic schedule.</p>
        <form className="admin-login-form" onSubmit={submit}>
          <label htmlFor="admin-email">Admin email</label>
          <input
            id="admin-email"
            autoComplete="username"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            autoComplete="current-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {error && <p className="admin-form-error" role="alert">{error}</p>}
          <button className="admin-button admin-button-primary admin-login-submit" type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in securely'}
            {!submitting && <Icon name="arrow_forward" />}
          </button>
        </form>
        <a className="admin-login-back" href="/">← Back to DentalCare</a>
      </section>
      <div className="admin-login-aside">
        <span className="admin-login-aside-mark"><Icon name="medical_services" /></span>
        <p>Care begins with<br /><strong>a well-run clinic.</strong></p>
        <span>YOUR DENTALCARE ADMIN PORTAL</span>
      </div>
    </main>
  );
}

function AppointmentDialog({ appointment, onClose, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const today = localDateString(new Date());

  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      await readResponse(await apiFetch('/api/admin/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }));
      await onSaved();
      onClose();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="appointment-modal-title">
        <div className="admin-modal-heading">
          <div>
            <span className="admin-eyebrow">CLINIC SCHEDULE</span>
            <h2 id="appointment-modal-title">New appointment</h2>
            <p>Add and confirm an appointment for a patient.</p>
          </div>
          <button className="admin-icon-button" type="button" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>
        <form className="admin-appointment-form" onSubmit={submit}>
          <label>Patient name<input name="name" autoComplete="name" minLength="2" maxLength="80" required /></label>
          <div className="admin-form-row">
            <label>Email address<input name="email" type="email" autoComplete="email" maxLength="254" required /></label>
            <label>Phone number<input name="phone" type="tel" autoComplete="tel" minLength="7" maxLength="24" required /></label>
          </div>
          <div className="admin-form-row">
            <label>Dental service<select name="service" defaultValue="" required><option value="" disabled>Select service</option>{services.map((service) => <option key={service}>{service}</option>)}</select></label>
            <label>Date<input name="date" type="date" min={today} defaultValue={appointment?.date || today} required /></label>
          </div>
          <label>Appointment time<select name="time" defaultValue={appointment?.time || ''} required><option value="" disabled>Select time</option>{timeSlots.map((time) => <option key={time}>{time}</option>)}</select></label>
          <label>Notes <span className="admin-optional">(optional)</span><textarea name="message" maxLength="500" rows="3" /></label>
          {error && <p className="admin-form-error" role="alert">{error}</p>}
          <div className="admin-modal-actions">
            <button className="admin-button admin-button-secondary" type="button" onClick={onClose}>Cancel</button>
            <button className="admin-button admin-button-primary" type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Add appointment'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function AppointmentDetails({ appointment, onClose, onStatusChange }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  async function updateStatus(status) {
    setSaving(true);
    setError('');
    try {
      await onStatusChange(appointment, status);
      onClose();
    } catch (statusError) {
      setError(statusError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="admin-modal admin-details-modal" role="dialog" aria-modal="true" aria-labelledby="appointment-detail-title">
        <div className="admin-modal-heading">
          <div>
            <span className="admin-eyebrow">APPOINTMENT DETAILS</span>
            <h2 id="appointment-detail-title">{appointment.name}</h2>
            <p>{appointment.service}</p>
          </div>
          <button className="admin-icon-button" type="button" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        </div>
        <div className="admin-detail-list">
          <div><Icon name="calendar_today" /><span><small>Date &amp; time</small><strong>{formatDate(appointment.date, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} · {appointment.time}</strong></span></div>
          <div><Icon name="mail" /><span><small>Email</small><a href={`mailto:${appointment.email}`}>{appointment.email}</a></span></div>
          <div><Icon name="call" /><span><small>Phone</small><a href={`tel:${appointment.phone}`}>{appointment.phone}</a></span></div>
          <div><Icon name="task_alt" /><span><small>Status</small><strong className={`admin-status admin-status-${appointment.status || 'pending'}`}>{appointment.status || 'pending'}</strong></span></div>
          {appointment.message && <div><Icon name="notes" /><span><small>Patient notes</small><strong>{appointment.message}</strong></span></div>}
        </div>
        {error && <p className="admin-form-error" role="alert">{error}</p>}
        <div className="admin-modal-actions">
          {appointment.status === 'pending' && (
            <>
              <button className="admin-button admin-button-danger" type="button" disabled={saving} onClick={() => updateStatus('declined')}>Decline request</button>
              <button className="admin-button admin-button-primary" type="button" disabled={saving} onClick={() => updateStatus('confirmed')}>Confirm appointment</button>
            </>
          )}
          {appointment.status === 'confirmed' && (
            <button className="admin-button admin-button-primary" type="button" disabled={saving} onClick={() => updateStatus('completed')}>Mark completed</button>
          )}
          <button className="admin-button admin-button-secondary" type="button" onClick={onClose}>Close</button>
        </div>
      </section>
    </div>
  );
}

function AppointmentRow({ appointment, onClick }) {
  return (
    <button className="admin-appointment-row" type="button" onClick={onClick}>
      <span className="admin-patient-cell">
        <span className="admin-patient-avatar">{initials(appointment.name)}</span>
        <span><strong>{appointment.name}</strong><small>{appointment.email}</small></span>
      </span>
      <span className="admin-service-cell"><strong>{appointment.service}</strong><small>{appointment.time}</small></span>
      <span className="admin-date-cell">{formatDate(appointment.date, { month: 'short', day: 'numeric' })}</span>
      <span className={`admin-status admin-status-${appointment.status || 'pending'}`}>{appointment.status || 'pending'}</span>
      <span className="admin-row-arrow"><Icon name="chevron_right" /></span>
    </button>
  );
}

function AdminDashboard({ email, appointments, loadingAppointments, loadError, onRefresh, onLogout, onStatusChange, onCreateAppointment }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDate, setSelectedDate] = useState(localDateString(new Date()));
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [newAppointment, setNewAppointment] = useState(null);
  const [activeNavigation, setActiveNavigation] = useState('Dashboard');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [toast, setToast] = useState('');
  const today = localDateString(new Date());
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekString = localDateString(nextWeek);

  const metrics = useMemo(() => ({
    pending: appointments.filter((appointment) => (appointment.status || 'pending') === 'pending').length,
    scheduledToday: appointments.filter((appointment) => appointment.date === today && appointment.status === 'confirmed').length,
    confirmedWeek: appointments.filter((appointment) => appointment.date >= today && appointment.date < nextWeekString && appointment.status === 'confirmed').length,
  }), [appointments, today, nextWeekString]);

  const filteredAppointments = useMemo(() => {
    const query = search.trim().toLowerCase();
    return appointments.filter((appointment) => {
      const matchesQuery = !query || [appointment.name, appointment.email, appointment.phone, appointment.service]
        .some((value) => value?.toLowerCase().includes(query));
      const matchesStatus = statusFilter === 'all' || (appointment.status || 'pending') === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [appointments, search, statusFilter]);
  const pageCount = Math.max(1, Math.ceil(filteredAppointments.length / 25));
  const displayedPage = Math.min(currentPage, pageCount);
  const currentAppointments = filteredAppointments.slice((displayedPage - 1) * 25, displayedPage * 25);

  const pendingAppointments = useMemo(() => appointments
    .filter((appointment) => (appointment.status || 'pending') === 'pending')
    .sort((first, second) => first.date.localeCompare(second.date) || appointmentMinutes(first.time) - appointmentMinutes(second.time))
    .slice(0, 4), [appointments]);

  const dailyAppointments = useMemo(() => appointments
    .filter((appointment) => appointment.date === selectedDate && appointment.status !== 'declined')
    .sort((first, second) => appointmentMinutes(first.time) - appointmentMinutes(second.time)), [appointments, selectedDate]);

  const weekSummary = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - 6);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const key = localDateString(date);
      const count = appointments.filter((appointment) => appointment.date === key && appointment.status !== 'declined').length;
      return { key, label: new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date), count };
    });
  }, [appointments]);

  const maxWeekCount = Math.max(...weekSummary.map((day) => day.count), 1);
  const greetingName = email.split('@')[0].split(/[._-]/).filter(Boolean).map((part) => `${part[0].toUpperCase()}${part.slice(1)}`).join(' ');

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  function changeDate(direction) {
    const date = parseDate(selectedDate);
    date.setDate(date.getDate() + direction);
    setSelectedDate(localDateString(date));
  }

  function goToSection(item) {
    setActiveNavigation(item.label);
    document.getElementById(item.target)?.scrollIntoView({ behavior: 'smooth', block: item.target === 'top' ? 'start' : 'center' });
  }

  function exportCsv() {
    const columns = ['Patient', 'Email', 'Phone', 'Service', 'Date', 'Time', 'Status', 'Notes'];
    const escapeCsv = (value) => {
      let safe = String(value ?? '');
      if (/^[\s]*[=+\-@]/.test(safe)) safe = `'${safe}`;
      return `"${safe.replaceAll('"', '""')}"`;
    };
    const rows = filteredAppointments.map((appointment) => [
      appointment.name, appointment.email, appointment.phone, appointment.service,
      appointment.date, appointment.time, appointment.status || 'pending', appointment.message,
    ]);
    const csv = [columns, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\r\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    link.download = `dentalcare-appointments-${today}.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  async function handleStatusChange(appointment, status) {
    await onStatusChange(appointment, status);
    setSelectedAppointment(null);
  }

  return (
    <div className="admin-app-shell" id="top">
      <aside className="admin-sidebar">
        <a className="admin-brand" href="/" aria-label="DentalCare home">
          <span className="admin-brand-mark"><Icon name="health_and_safety" /></span>
          <span>DentalCare</span>
        </a>
        <span className="admin-nav-caption">CLINIC WORKSPACE</span>
        <nav className="admin-navigation" aria-label="Admin navigation">
          {navigation.map((item) => (
            <button
              className={`admin-nav-item${activeNavigation === item.label ? ' is-active' : ''}`}
              key={item.label}
              type="button"
              onClick={() => goToSection(item)}
            >
              <Icon name={item.icon} /><span>{item.label}</span>
              {item.label === 'Appointments & Schedule' && metrics.pending > 0 && <span className="admin-nav-count">{metrics.pending}</span>}
            </button>
          ))}
          <div className="admin-nav-divider" />
          <span className="admin-nav-caption admin-nav-caption-secondary">COMING NEXT</span>
          <span className="admin-nav-item admin-nav-disabled"><Icon name="stethoscope" /><span>Doctor Availability</span></span>
          <span className="admin-nav-item admin-nav-disabled"><Icon name="medical_services" /><span>Dental Services</span></span>
          <span className="admin-nav-item admin-nav-disabled"><Icon name="settings" /><span>Clinic Settings</span></span>
        </nav>
        <div className="admin-sidebar-bottom">
          <div className="admin-clinic-status"><span className="admin-live-dot" /><div><strong>Clinic status</strong><span>Appointment system online</span></div></div>
          <a className="admin-back-link" href="/">← View public website</a>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <a className="admin-mobile-brand" href="/"><span className="admin-brand-mark"><Icon name="health_and_safety" /></span>DentalCare</a>
          <label className="admin-search">
            <Icon name="search" />
            <input
              aria-label="Search patients, appointments, and treatments"
              placeholder="Search patients, appointments, treatments..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {search && <button type="button" onClick={() => setSearch('')} aria-label="Clear search"><Icon name="close" /></button>}
          </label>
          <div className="admin-topbar-actions">
            <span className="admin-today-label"><Icon name="calendar_today" />{new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date())}</span>
            <div className="admin-notification-wrap">
              <button className={`admin-icon-button admin-notification-button${notificationsOpen ? ' is-selected' : ''}`} type="button" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen(!notificationsOpen)}>
                <Icon name="notifications" />{metrics.pending > 0 && <span className="admin-notification-dot" />}
              </button>
              {notificationsOpen && <div className="admin-notification-popover"><strong>Notifications</strong><p>{metrics.pending ? `${metrics.pending} appointment request${metrics.pending === 1 ? '' : 's'} need your review.` : 'You’re all caught up.'}</p><button type="button" onClick={() => { setNotificationsOpen(false); document.getElementById('approvals')?.scrollIntoView({ behavior: 'smooth' }); }}>View requests <Icon name="arrow_forward" /></button></div>}
            </div>
            <div className="admin-user">
              <span className="admin-user-avatar">{initials(greetingName || email)}</span>
              <span className="admin-user-copy"><strong>{greetingName || 'Clinic Admin'}</strong><small>Clinic Admin</small></span>
            </div>
            <button className="admin-icon-button admin-signout-button" type="button" onClick={onLogout} title="Sign out" aria-label="Sign out"><Icon name="logout" /></button>
          </div>
        </header>

        <main className="admin-content">
          <div className="admin-page-heading">
            <div>
              <div className="admin-breadcrumb"><span>Clinic</span><Icon name="chevron_right" /><span>Dashboard</span></div>
              <h1>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {greetingName || 'Doctor'}.</h1>
              <p>Here’s what’s happening at your clinic today.</p>
            </div>
            <div className="admin-page-actions">
              <button className="admin-button admin-button-secondary" type="button" onClick={onRefresh} disabled={loadingAppointments}><Icon name="refresh" />Refresh</button>
              <button className="admin-button admin-button-primary" type="button" onClick={() => setNewAppointment({ date: selectedDate })}><Icon name="add" />New appointment</button>
            </div>
          </div>

          {loadError && <div className="admin-banner-error" role="alert"><Icon name="error" /><span>{loadError}</span><button type="button" onClick={onRefresh}>Try again</button></div>}

          <section className="admin-metrics" aria-label="Appointment summary">
            <article className="admin-metric-card">
              <div className="admin-metric-top"><span>Pending approvals</span><span className="admin-metric-icon metric-icon-amber"><Icon name="pending_actions" /></span></div>
              <div className="admin-metric-value">{loadingAppointments && !appointments.length ? '—' : metrics.pending}</div>
              <div className="admin-metric-foot"><span className="admin-metric-note">Needs your attention</span><span className="admin-metric-small-icon"><Icon name="arrow_outward" /></span></div>
            </article>
            <article className="admin-metric-card">
              <div className="admin-metric-top"><span>Scheduled today</span><span className="admin-metric-icon metric-icon-blue"><Icon name="today" /></span></div>
              <div className="admin-metric-value">{loadingAppointments && !appointments.length ? '—' : metrics.scheduledToday}</div>
              <div className="admin-metric-foot"><span className="admin-metric-note">{formatDate(today, { weekday: 'long', month: 'long', day: 'numeric' })}</span><button className="admin-inline-link" type="button" onClick={() => document.getElementById('schedule')?.scrollIntoView({ behavior: 'smooth' })}>View schedule <Icon name="arrow_forward" /></button></div>
            </article>
            <article className="admin-metric-card">
              <div className="admin-metric-top"><span>Confirmed this week</span><span className="admin-metric-icon metric-icon-green"><Icon name="event_available" /></span></div>
              <div className="admin-metric-value">{loadingAppointments && !appointments.length ? '—' : metrics.confirmedWeek}</div>
              <div className="admin-metric-foot"><span className="admin-metric-note">Next 7 days</span><span className="admin-metric-small-icon"><Icon name="trending_up" /></span></div>
            </article>
          </section>

          <section className="admin-dashboard-grid">
            <div className="admin-primary-column">
              <section className="admin-panel admin-schedule-panel" id="schedule">
                <div className="admin-panel-heading">
                  <div><span className="admin-eyebrow">YOUR CLINIC AT A GLANCE</span><h2>Daily schedule</h2><p>{formatDate(selectedDate, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p></div>
                  <div className="admin-schedule-controls">
                    <button className="admin-icon-button" type="button" onClick={() => changeDate(-1)} aria-label="Previous day"><Icon name="chevron_left" /></button>
                    <input aria-label="Choose schedule date" type="date" value={selectedDate} onChange={(event) => event.target.value && setSelectedDate(event.target.value)} />
                    <button className="admin-icon-button" type="button" onClick={() => changeDate(1)} aria-label="Next day"><Icon name="chevron_right" /></button>
                    {selectedDate !== today && <button className="admin-today-button" type="button" onClick={() => setSelectedDate(today)}>Today</button>}
                  </div>
                </div>
                <div className="admin-schedule-legend"><span><i className="legend-confirmed" />Confirmed</span><span><i className="legend-pending" />Awaiting approval</span><span className="admin-schedule-count">{dailyAppointments.length} appointment{dailyAppointments.length === 1 ? '' : 's'}</span></div>
                <div className="admin-timeline">
                  {timeSlots.map((time) => {
                    const matches = dailyAppointments.filter((appointment) => appointment.time === time);
                    return (
                      <div className="admin-time-row" key={time}>
                        <span className="admin-time-label">{time}</span>
                        <div className="admin-time-content">
                          {matches.map((appointment) => (
                            <button className={`admin-time-appointment${appointment.status === 'pending' ? ' is-pending' : ''}`} key={appointment._id} type="button" onClick={() => setSelectedAppointment(appointment)}>
                              <span className="admin-appointment-indicator" />
                              <span><strong>{appointment.name}</strong><small>{appointment.service}</small></span>
                              <span className="admin-appointment-doctor">DentalCare team</span>
                              <Icon name="open_in_new" />
                            </button>
                          ))}
                          {!matches.length && <span className="admin-time-empty" />}
                        </div>
                      </div>
                    );
                  })}
                  {!dailyAppointments.length && (
                    <div className="admin-schedule-empty"><span className="admin-empty-icon"><Icon name="event_busy" /></span><strong>No appointments on this day</strong><span>Choose another date or add an appointment to the schedule.</span><button className="admin-inline-link" type="button" onClick={() => setNewAppointment({ date: selectedDate })}>Add appointment <Icon name="arrow_forward" /></button></div>
                  )}
                </div>
              </section>

              <section className="admin-panel admin-records-panel" id="records">
                <div className="admin-panel-heading admin-records-heading">
                  <div><span className="admin-eyebrow">PATIENT VISITS</span><h2>Appointments</h2><p>Patient requests and upcoming visits, all in one place.</p></div>
                  <div className="admin-record-actions">
                    <label className="admin-status-filter"><span className="sr-only">Filter by appointment status</span><select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setCurrentPage(1); }}><option value="all">All statuses</option><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="declined">Declined</option></select></label>
                    <button className="admin-icon-button admin-export-button" type="button" onClick={exportCsv} title="Export filtered appointments to CSV" aria-label="Export appointments to CSV"><Icon name="download" /></button>
                  </div>
                </div>
                <div className="admin-table-wrap">
                  <div className="admin-table-header"><span>Patient</span><span>Service / time</span><span>Date</span><span>Status</span><span /></div>
                  {loadingAppointments && !appointments.length ? <div className="admin-table-message"><span className="admin-spinner" />Loading appointments…</div>
                    : filteredAppointments.length ? currentAppointments.map((appointment) => (
                      <AppointmentRow appointment={appointment} key={appointment._id} onClick={() => setSelectedAppointment(appointment)} />
                    ))
                      : <div className="admin-table-message"><span className="admin-empty-icon"><Icon name="search_off" /></span><strong>{search || statusFilter !== 'all' ? 'No matching appointments' : 'No appointments yet'}</strong><span>{search || statusFilter !== 'all' ? 'Try changing your search or status filter.' : 'New patient requests will appear here.'}</span></div>}
                  {filteredAppointments.length > 25 && <div className="admin-pagination">
                    <span>Showing {(displayedPage - 1) * 25 + 1}–{Math.min(displayedPage * 25, filteredAppointments.length)} of {filteredAppointments.length}</span>
                    <div><button type="button" disabled={displayedPage === 1} onClick={() => setCurrentPage((page) => page - 1)} aria-label="Previous page"><Icon name="chevron_left" /></button><span>Page {displayedPage} of {pageCount}</span><button type="button" disabled={displayedPage === pageCount} onClick={() => setCurrentPage((page) => page + 1)} aria-label="Next page"><Icon name="chevron_right" /></button></div>
                  </div>}
                  {appointments.length >= 500 && <div className="admin-table-foot">Showing the 500 most recently scheduled appointments. Refine your search to locate a patient.</div>}
                </div>
              </section>
            </div>

            <aside className="admin-side-column">
              <section className="admin-panel admin-approvals-panel" id="approvals">
                <div className="admin-panel-heading admin-approvals-heading">
                  <div><span className="admin-eyebrow">REQUIRES YOUR ATTENTION</span><h2>Approval requests</h2></div>
                  {metrics.pending > 0 && <span className="admin-count-pill">{metrics.pending}</span>}
                </div>
                {loadingAppointments && !appointments.length ? <div className="admin-side-message"><span className="admin-spinner" />Loading requests…</div>
                  : pendingAppointments.length ? <div className="admin-approval-list">{pendingAppointments.map((appointment) => (
                    <article className="admin-approval-card" key={appointment._id}>
                      <button className="admin-approval-patient" type="button" onClick={() => setSelectedAppointment(appointment)}>
                        <span className="admin-patient-avatar">{initials(appointment.name)}</span>
                        <span><strong>{appointment.name}</strong><small>{appointment.service}</small></span>
                        <Icon name="open_in_new" />
                      </button>
                      <div className="admin-approval-detail"><Icon name="calendar_today" /><span>{formatDate(appointment.date, { month: 'short', day: 'numeric' })} · {appointment.time}</span></div>
                      <div className="admin-approval-actions">
                        <button type="button" className="admin-decline-button" onClick={async () => { try { await onStatusChange(appointment, 'declined'); setToast(`${appointment.name}’s request was declined.`); } catch (error) { setToast(error.message); } }}>Decline</button>
                        <button type="button" className="admin-approve-button" onClick={async () => { try { await onStatusChange(appointment, 'confirmed'); setToast(`${appointment.name}’s appointment was confirmed.`); } catch (error) { setToast(error.message); } }}><Icon name="check" />Approve</button>
                      </div>
                    </article>
                  ))}</div>
                    : <div className="admin-side-empty"><span className="admin-empty-icon"><Icon name="task_alt" /></span><strong>All caught up</strong><span>New appointment requests will show up here.</span></div>}
                {metrics.pending > pendingAppointments.length && <button className="admin-view-all" type="button" onClick={() => { setStatusFilter('pending'); document.getElementById('records')?.scrollIntoView({ behavior: 'smooth' }); }}>View all {metrics.pending} requests <Icon name="arrow_forward" /></button>}
              </section>

              <section className="admin-panel admin-activity-panel">
                <div className="admin-panel-heading"><div><span className="admin-eyebrow">THE LAST SEVEN DAYS</span><h2>Appointment activity</h2></div><span className="admin-activity-icon"><Icon name="bar_chart" /></span></div>
                <div className="admin-chart" role="img" aria-label={`Daily appointments in the last seven days: ${weekSummary.map((day) => `${day.label} ${day.count}`).join(', ')}`}>
                  {weekSummary.map((day, index) => (
                    <div className="admin-chart-day" key={day.key} title={`${formatDate(day.key)}: ${day.count} appointment${day.count === 1 ? '' : 's'}`}>
                      <span className="admin-chart-count">{day.count || ''}</span>
                      <span className={`admin-chart-bar${index === 6 ? ' is-today' : ''}`} style={{ height: `${Math.max(day.count ? (day.count / maxWeekCount) * 100 : 4, 4)}%` }} />
                      <span className="admin-chart-label">{day.label}</span>
                    </div>
                  ))}
                </div>
                <div className="admin-chart-footer"><span>Appointments per day</span><span><i />Today</span></div>
              </section>

              <section className="admin-care-card">
                <span className="admin-care-icon"><Icon name="dentistry" /></span>
                <div><strong>Care starts here.</strong><span>Keep your patient schedule organized and every visit running smoothly.</span></div>
                <span className="admin-care-spark">✳</span>
              </section>
            </aside>
          </section>

          <footer className="admin-footer"><span>© {new Date().getFullYear()} DentalCare · Clinic administration</span><button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Back to top <Icon name="arrow_upward" /></button></footer>
        </main>
      </div>

      {newAppointment && <AppointmentDialog appointment={newAppointment} onClose={() => setNewAppointment(null)} onSaved={onCreateAppointment} />}
      {selectedAppointment && <AppointmentDetails appointment={selectedAppointment} onClose={() => setSelectedAppointment(null)} onStatusChange={handleStatusChange} />}
      {toast && <div className="admin-live-toast" role="status"><Icon name="info" />{toast}<button type="button" aria-label="Dismiss" onClick={() => setToast('')}><Icon name="close" /></button></div>}
    </div>
  );
}

export default function AdminApp() {
  const [authState, setAuthState] = useState('checking');
  const [email, setEmail] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [loadError, setLoadError] = useState('');

  const loadAppointments = useCallback(async () => {
    setLoadingAppointments(true);
    setLoadError('');
    try {
      const data = await readResponse(await apiFetch('/api/admin/appointments'));
      setAppointments(data.appointments.map((appointment) => ({
        ...appointment,
        status: appointment.status || 'pending',
      })));
    } catch (error) {
      if (error.status === 401) {
        setAuthState('signed-out');
        setAppointments([]);
      } else {
        setLoadError(error.message);
      }
    } finally {
      setLoadingAppointments(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    apiFetch('/api/admin/session')
      .then(readResponse)
      .then((session) => {
        if (active) {
          setEmail(session.email);
          setAuthState('signed-in');
        }
      })
      .catch((error) => {
        if (active) {
          setLoadError(error.status === 503 ? error.message : '');
          setAuthState('signed-out');
        }
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (authState !== 'signed-in') return undefined;
    loadAppointments();
    const interval = window.setInterval(loadAppointments, 60_000);
    return () => window.clearInterval(interval);
  }, [authState, loadAppointments]);

  const login = useCallback(async (loginEmail, password) => {
    const session = await readResponse(await apiFetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: loginEmail, password }),
    }));
    setEmail(session.email);
    setAuthState('signed-in');
  }, []);

  const logout = useCallback(async () => {
    try {
      await readResponse(await apiFetch('/api/admin/logout', { method: 'POST' }));
    } finally {
      setAppointments([]);
      setEmail('');
      setAuthState('signed-out');
    }
  }, []);

  const updateAppointmentStatus = useCallback(async (appointment, status) => {
    const data = await readResponse(await apiFetch(`/api/admin/appointments/${encodeURIComponent(appointment._id)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }));
    setAppointments((current) => current.map((item) => item._id === data.appointment._id ? data.appointment : item));
  }, []);

  const refreshAppointments = useCallback(() => loadAppointments(), [loadAppointments]);
  const createAppointment = useCallback(() => loadAppointments(), [loadAppointments]);

  if (authState === 'checking') {
    return <main className="admin-auth-loading"><span className="admin-spinner" />Checking your secure admin session…</main>;
  }
  if (authState !== 'signed-in') {
    return <LoginScreen onLogin={login} initialError={loadError} />;
  }
  return (
    <AdminDashboard
      email={email}
      appointments={appointments}
      loadingAppointments={loadingAppointments}
      loadError={loadError}
      onRefresh={refreshAppointments}
      onLogout={logout}
      onStatusChange={updateAppointmentStatus}
      onCreateAppointment={createAppointment}
    />
  );
}
