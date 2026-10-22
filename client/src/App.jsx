import { useRef, useState } from 'react';

const services = [
  {
    icon: '✳',
    title: 'Preventive cleanings',
    text: 'Regular checkups, professional polish, and deep cleanings to safeguard your oral health.',
    tag: 'Most popular',
    tone: 'blue',
  },
  {
    icon: '✧',
    title: 'Teeth whitening',
    text: 'Thoughtful cosmetic treatments to brighten your smile comfortably and safely.',
    tag: 'Cosmetic',
    tone: 'green',
  },
  {
    icon: '⌁',
    title: 'Orthodontics',
    text: 'Clear aligners and modern braces designed to straighten teeth discreetly.',
    tag: 'All ages',
    tone: 'purple',
  },
  {
    icon: '◉',
    title: 'Dental implants',
    text: 'Natural-looking tooth replacement options to restore your confident smile.',
    tag: 'Restorative',
    tone: 'gold',
  },
];

const dentists = [
  {
    name: 'Dr. Sarah Jenkins',
    specialty: 'Lead orthodontist',
    text: 'Specializing in clear aligners and bite alignment, with more than 12 years of experience.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAdSh_Vpx5G8yW28ysBJjgX9WBdjKHDowbqvfnE6Gv53eBuSvv7Y1lKTEhH7TgsUW8R7FLxdE6i1fpHtmAAzFH9zGiHvZ8kCtWNQIJq1_7SZgBRnSFThvLFQNoLJMCmrQHkvIcybe1bF7LtG4zQtoi-lJXQMLA25LRQdFDWkbzfQK37kcbuu5usCU0ZGM_NZJvgR7oZYK33j5ouTsqCH2Wr5iKiBnBr2J6MgpKv-q9i3ihlIe6URUu8',
  },
  {
    name: 'Dr. Michael Chen',
    specialty: 'Cosmetic specialist',
    text: 'An expert in veneers, whitening, and natural-looking smile makeovers.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDCRf4BaNVuO8cIqe97c2wJ9MPH_3cf3Wz4iapZqq67NERpimFNf7VWg9qszwSiiWoWjUNAv00Ic7I8glk7nPk6ReMFzifhA0qjHrsNkVV5P_RZOjzH1PhBhkc-s2QGSVUBC-gEO-AAO61kr3fsFGxNTZjx9Ib2GijWKfp5ErAQ9ivGCq1RXNKEji2XrPOaTGLWNINjvid64HSv-vwuywesgkLgUwH-UCYpD7k97Ic9QwpeDRp7cDp-',
  },
  {
    name: 'Dr. Emily Rodriguez',
    specialty: 'Family dentist',
    text: 'Dedicated to making dental visits welcoming and anxiety-free for every age.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDZ0BB5HXOQOUhRilax_r85LIbSMoQTjFht25JIbz9YX4OKRtOjAC7uQ0HuTTxuKAxl_JAtfK2I4HSmZtXpptVu19x68ZoowYa4eue12NShWKI2Y_6GnsXMe8_XRuSLo2O2W6ks0IGyYLax3MCD55UFoUMPavYvtErCUgbon32-QtEWv1Y09dAuAvyxpPITw0T9q71FTq1_i4BTXVslameCsZUgRuAI-C2wvln5FUi__rV65Ec2WFli',
  },
];

const faqs = [
  {
    question: 'How often should I visit for a checkup?',
    answer:
      'For most people, a checkup and preventive cleaning every six months is a good starting point. Your dentist can recommend a schedule tailored to your oral health.',
  },
  {
    question: 'Do you accept dental insurance?',
    answer:
      'We work with many major dental insurance plans. Contact our team with your provider details and we’ll help you understand your coverage before your visit.',
  },
  {
    question: 'What should I do in a dental emergency?',
    answer:
      'Call our team at (555) 234-5678 as soon as possible. We reserve time for urgent dental concerns and will help you decide on the next step.',
  },
  {
    question: 'Are professional whitening treatments safe?',
    answer:
      'A dentist will first check that whitening is appropriate for your teeth and gums, then recommend a treatment suited to your smile.',
  },
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

function Brand() {
  return (
    <a className="brand" href="#home" aria-label="DentalCare home">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 40 40" fill="none">
          <path
            d="M20 4.8c-3.6 0-5.6 2-8.6 2-2.8 0-5.1-1.4-6.3 2.8-1.1 4.1 1.6 9.6 3 13.1 1.4 3.5 2.5 11.8 6.3 11.8 3 0 2.4-9 5.6-9s2.6 9 5.6 9c3.8 0 4.9-8.3 6.3-11.8 1.4-3.5 4.1-9 3-13.1-1.2-4.2-3.5-2.8-6.3-2.8-3 0-5-2-8.6-2Z"
            fill="currentColor"
          />
          <path d="M20 11v9m-4.5-4.5h9" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      </span>
      <span>Dental<span className="brand-light">Care</span></span>
    </a>
  );
}

function AppointmentDialog({ dialogRef }) {
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  function closeDialog() {
    dialogRef.current?.close();
    setResult(null);
  }

  async function submitAppointment(event) {
    event.preventDefault();
    setSubmitting(true);
    setResult(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setResult({ type: 'error', text: data.error || 'We could not send your request. Please try again.' });
        return;
      }
      setResult({
        type: 'success',
        text: `Thanks, ${payload.name}. Your request for ${data.appointment.date} at ${data.appointment.time} is in. Our team will be in touch to confirm.`,
      });
      form.reset();
    } catch {
      setResult({
        type: 'error',
        text: 'We couldn’t reach the appointment service. Please try again in a moment or call us.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  const minDate = new Date();
  minDate.setMinutes(minDate.getMinutes() - minDate.getTimezoneOffset());

  return (
    <dialog className="booking-dialog" ref={dialogRef} aria-labelledby="booking-title" onClose={() => setResult(null)}>
      <div className="dialog-top">
        <div>
          <span className="eyebrow">LET’S GET YOU SMILING</span>
          <h2 id="booking-title">Request an appointment</h2>
          <p>Choose a time that works. Our team will follow up to confirm.</p>
        </div>
        <button className="dialog-close" type="button" onClick={closeDialog} aria-label="Close appointment form">
          ×
        </button>
      </div>
      {result?.type === 'success' ? (
        <div className="booking-success" role="status">
          <span className="success-icon" aria-hidden="true">✓</span>
          <h3>Request received</h3>
          <p>{result.text}</p>
          <button className="button button-primary" type="button" onClick={closeDialog}>Done</button>
        </div>
      ) : (
        <form className="booking-form" onSubmit={submitAppointment}>
          <div className="form-row">
            <label>
              Full name
              <input name="name" autoComplete="name" minLength="2" maxLength="80" required />
            </label>
            <label>
              Email address
              <input name="email" type="email" autoComplete="email" maxLength="254" required />
            </label>
          </div>
          <div className="form-row">
            <label>
              Phone number
              <input name="phone" type="tel" autoComplete="tel" minLength="7" maxLength="24" required />
            </label>
            <label>
              Service
              <select name="service" defaultValue="" required>
                <option value="" disabled>Select a service</option>
                {['Preventive cleaning', 'Teeth whitening', 'Orthodontics', 'Dental implants', 'General consultation'].map((service) => (
                  <option key={service} value={service}>{service}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="form-row">
            <label>
              Preferred date
              <input name="date" type="date" min={minDate.toISOString().slice(0, 10)} required />
            </label>
            <label>
              Preferred time
              <select name="time" defaultValue="" required>
                <option value="" disabled>Select a time</option>
                {timeSlots.map((time) => <option key={time} value={time}>{time}</option>)}
              </select>
            </label>
          </div>
          <label>
            Anything else we should know? <span className="optional">(optional)</span>
            <textarea name="message" rows="3" maxLength="500" placeholder="Please don’t include private medical information." />
          </label>
          {result?.type === 'error' && <p className="form-error" role="alert">{result.text}</p>}
          <button className="button button-primary submit-button" type="submit" disabled={submitting}>
            {submitting ? 'Sending request…' : 'Request appointment'} <span aria-hidden="true">→</span>
          </button>
          <p className="form-note">Your request is private. An appointment is not confirmed until our team contacts you.</p>
        </form>
      )}
    </dialog>
  );
}

function App() {
  const dialogRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  function openBooking() {
    setMenuOpen(false);
    dialogRef.current?.showModal();
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <>
      <header className="site-header">
        <div className="nav-wrap">
          <Brand />
          <button
            className="menu-toggle"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span /><span /><span />
          </button>
          <nav className={menuOpen ? 'main-nav is-open' : 'main-nav'} aria-label="Main navigation">
            <a className="nav-link active" href="#home" onClick={closeMenu}>Home</a>
            <a className="nav-link" href="#services" onClick={closeMenu}>Services</a>
            <a className="nav-link" href="#team" onClick={closeMenu}>Our team</a>
            <a className="nav-link" href="#faq" onClick={closeMenu}>FAQs</a>
          </nav>
          <button className="button button-primary nav-cta" onClick={openBooking}>
            Book a visit <span aria-hidden="true">↗</span>
          </button>
        </div>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-shape shape-one" />
          <div className="hero-shape shape-two" />
          <div className="hero-inner">
            <div className="hero-copy">
              <div className="trust-pill"><span className="pill-check">✓</span> ADVANCED DENTAL CARE, A GENTLER TOUCH</div>
              <h1>Your smile,<br />our <span>priority.</span></h1>
              <p className="hero-lead">
                Thoughtful, modern dentistry delivered with genuine warmth. Feel at ease, feel cared for, and leave ready to share your smile.
              </p>
              <div className="hero-actions">
                <button className="button button-primary button-large" onClick={openBooking}>
                  <span aria-hidden="true">▦</span> Book an appointment
                </button>
                <a className="button button-quiet button-large" href="#services">
                  Explore our care <span aria-hidden="true">↓</span>
                </a>
              </div>
              <div className="hero-proof">
                <div className="avatar-stack" aria-hidden="true">
                  <span>J</span><span>M</span><span>A</span><span className="avatar-more">+</span>
                </div>
                <div><strong>Care that feels different</strong><span>Trusted by families in our community</span></div>
              </div>
            </div>
            <div className="hero-visual">
              <div className="hero-photo" role="img" aria-label="A smiling patient enjoying a comfortable visit at a modern dental clinic." />
              <div className="comfort-card">
                <span className="comfort-icon">✦</span>
                <div><strong>Comfort comes first</strong><span>Gentle care, every step of the way.</span></div>
                <span className="comfort-arrow" aria-hidden="true">↗</span>
              </div>
              <div className="photo-note"><span className="note-dot" /> YOUR NEIGHBORHOOD DENTAL HOME</div>
            </div>
          </div>
          <div className="hero-bottom">
            <span>GOOD CARE. GOOD PEOPLE. GREAT SMILES.</span>
            <a href="#services">SCROLL TO EXPLORE <span aria-hidden="true">↓</span></a>
          </div>
        </section>

        <section className="intro-strip" aria-label="DentalCare at a glance">
          <div className="intro-item"><strong>15<span>k+</span></strong><span>happy patients</span></div>
          <div className="intro-divider" />
          <div className="intro-item"><strong>4.9<span>/5</span></strong><span>patient rating</span></div>
          <div className="intro-divider" />
          <div className="intro-item"><strong>25<span>+</span></strong><span>years of caring</span></div>
          <div className="intro-message"><span className="intro-spark">✳</span><span>Care for every chapter<br />of your smile story.</span></div>
        </section>

        <section className="section services-section" id="services">
          <div className="section-heading heading-row">
            <div><span className="eyebrow">CARE THAT COVERS IT ALL</span><h2>Good things start<br />with a healthy smile.</h2></div>
            <p>From the little checkups to the life-changing treatments, our team makes every visit feel personal.</p>
          </div>
          <div className="service-grid">
            {services.map((service, index) => (
              <article className={`service-card tone-${service.tone}`} key={service.title}>
                <div className="service-top"><span className="service-number">0{index + 1}</span><span className="service-icon" aria-hidden="true">{service.icon}</span></div>
                <div><h3>{service.title}</h3><p>{service.text}</p></div>
                <div className="service-bottom"><span className="service-tag">{service.tag}</span><button aria-label={`Book ${service.title}`} onClick={openBooking}>↗</button></div>
              </article>
            ))}
          </div>
          <div className="services-foot"><span>Not sure what you need? We’ll help you figure it out.</span><a href="tel:+15552345678">Talk to our team <span aria-hidden="true">→</span></a></div>
        </section>

        <section className="journey-section">
          <div className="section journey-inner">
            <div className="journey-heading"><span className="eyebrow">EASY AS ONE, TWO, SMILE</span><h2>Dental visits,<br />without the fuss.</h2><p>We’ve made taking care of your smile feel simple, from the very first hello.</p></div>
            <div className="journey-steps">
              <article className="journey-step"><span className="step-index">01</span><div><h3>Pick a time</h3><p>Choose a visit that fits your day. Requesting an appointment takes just a moment.</p></div><span className="step-arrow" aria-hidden="true">↗</span></article>
              <article className="journey-step"><span className="step-index">02</span><div><h3>Meet your dentist</h3><p>We’ll listen, answer every question, and make a plan that feels right for you.</p></div><span className="step-arrow" aria-hidden="true">↗</span></article>
              <article className="journey-step"><span className="step-index">03</span><div><h3>Leave smiling</h3><p>Get thoughtful care from people who are genuinely happy you’re here.</p></div><span className="step-arrow" aria-hidden="true">↗</span></article>
            </div>
          </div>
        </section>

        <section className="section team-section" id="team">
          <div className="section-heading heading-row">
            <div><span className="eyebrow">THE PEOPLE BEHIND THE SMILES</span><h2>Meet your new<br />favorite dentists.</h2></div>
            <p>Skilled hands, kind hearts, and a team that always remembers your name. You’re in good company here.</p>
          </div>
          <div className="team-grid">
            {dentists.map((dentist, index) => (
              <article className="dentist-card" key={dentist.name}>
                <div className="dentist-photo-wrap">
                  <img src={dentist.image} alt={`Portrait of ${dentist.name}`} loading="lazy" />
                  <span className="dentist-count">0{index + 1}</span>
                </div>
                <div className="dentist-info"><div><span className="dentist-specialty">{dentist.specialty}</span><h3>{dentist.name}</h3></div><p>{dentist.text}</p></div>
              </article>
            ))}
          </div>
        </section>

        <section className="difference-section">
          <div className="section difference-grid">
            <div className="difference-image">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDBe_tNzW7nHRmQKA3oyrb3Lly6-rqyrMQwhMs8MFUSGAM8mGqso0yGjxaM7O6i68P-SfLqLmjnq_GsU5P7JfENgLQsQxkw_bro45f4DbRA8Qfaw3zvphDD7-mbWa_RSzOMX2vBlQ1g398rpUdLyIE4FVDhkiBP6G1NF9hXw4DG0Uwln9iC5EWlvx4QbeTviraoooFosx4eKLr6iYbQdQMA1FJhcwWxJIOufB3k1OMIvjwj3NzFT40g"
                alt="Bright, modern dental treatment room prepared for a patient"
                loading="lazy"
              />
              <div className="image-caption"><span>01 / 04</span><span>DESIGNED AROUND YOU</span></div>
            </div>
            <div className="difference-copy">
              <span className="eyebrow">A LITTLE MORE HUMAN</span>
              <h2>It’s the small<br />things that make<br /><span>the difference.</span></h2>
              <p>We pair modern dentistry with the kind of attention that makes you feel right at home.</p>
              <ul className="difference-list">
                <li><span>✓</span><div><strong>Your comfort, always</strong><span>We’ll check in, explain each step, and never rush you.</span></div></li>
                <li><span>✓</span><div><strong>Care that’s clear</strong><span>Honest options and helpful answers, without the jargon.</span></div></li>
                <li><span>✓</span><div><strong>Time well spent</strong><span>Easy scheduling that respects your busy day.</span></div></li>
              </ul>
              <button className="text-link" onClick={openBooking}>Come say hello <span aria-hidden="true">→</span></button>
            </div>
          </div>
        </section>

        <section className="section testimonials-section">
          <div className="testimonial-heading"><span className="eyebrow">KIND WORDS, BRIGHT SMILES</span><h2>Don’t just take<br />our word for it.</h2></div>
          <div className="testimonial-grid">
            <article className="quote-card quote-featured"><span className="quote-mark">“</span><p>I used to dread the dentist. Now I actually look forward to catching up with the team. They make you feel like family.</p><div className="quote-author"><span className="quote-avatar">JD</span><span><strong>Jessica Davis</strong><small>Patient since 2022</small></span><span className="stars">★★★★★</span></div></article>
            <article className="quote-card"><span className="quote-mark">“</span><p>My whitening results are incredible, and the whole visit was so easy. I felt looked after from the moment I walked in.</p><div className="quote-author"><span className="quote-avatar green-avatar">MR</span><span><strong>Marcus Reynolds</strong><small>Patient since 2023</small></span><span className="stars">★★★★★</span></div></article>
            <article className="quote-card"><span className="quote-mark">“</span><p>Beautiful office, kind people, and booking was a breeze. I’ve already recommended DentalCare to my whole family.</p><div className="quote-author"><span className="quote-avatar gold-avatar">AL</span><span><strong>Amanda Lopez</strong><small>Patient since 2021</small></span><span className="stars">★★★★★</span></div></article>
          </div>
        </section>

        <section className="faq-section" id="faq">
          <div className="section faq-grid">
            <div className="faq-heading"><span className="eyebrow">GOOD QUESTION</span><h2>A few things<br />you might be<br />wondering.</h2><p>Still curious? Our friendly team is just a call away.</p><a className="text-link" href="tel:+15552345678">Call (555) 234-5678 <span aria-hidden="true">→</span></a></div>
            <div className="faq-list">
              {faqs.map((faq, index) => (
                <article className={openFaq === index ? 'faq-item faq-open' : 'faq-item'} key={faq.question}>
                  <button aria-expanded={openFaq === index} onClick={() => setOpenFaq(openFaq === index ? -1 : index)}>
                    <span className="faq-index">0{index + 1}</span><span>{faq.question}</span><span className="faq-toggle" aria-hidden="true">{openFaq === index ? '−' : '+'}</span>
                  </button>
                  {openFaq === index && <p>{faq.answer}</p>}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="final-cta">
          <div className="cta-orbit orbit-one" /><div className="cta-orbit orbit-two" />
          <div className="cta-content"><span className="eyebrow">YOUR SMILE’S IN GOOD HANDS</span><h2>Ready when<br />you are.</h2><p>Let’s make your next dental visit the one that changes everything.</p><button className="button button-light button-large" onClick={openBooking}>Let’s book your visit <span aria-hidden="true">↗</span></button></div>
          <div className="cta-aside"><span>GOOD CARE STARTS WITH A CONVERSATION.</span><a href="tel:+15552345678">(555) 234-5678 <span aria-hidden="true">↗</span></a><a href="mailto:hello@dentalcare.example">hello@dentalcare.example</a></div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-main"><div className="footer-brand"><Brand /><p>Here for the little things,<br />and the big reasons to smile.</p></div><div className="footer-column"><span>EXPLORE</span><a href="#services">Our services</a><a href="#team">Meet the team</a><a href="#faq">FAQs</a></div><div className="footer-column"><span>COME SEE US</span><p>123 Smile Avenue<br />Your City, ST 12345</p><a href="tel:+15552345678">(555) 234-5678</a></div><div className="footer-column"><span>OFFICE HOURS</span><p>Mon – Fri&nbsp; · &nbsp;8am – 5pm<br />Saturday&nbsp; · &nbsp;By appointment</p><a href="mailto:hello@dentalcare.example">Send us a note ↗</a></div></div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} DentalCare. Made for brighter days.</span><a href="#home">Back to top ↑</a><span>Care that makes you smile.</span></div>
      </footer>
      <AppointmentDialog dialogRef={dialogRef} />
    </>
  );
}

export default App;
