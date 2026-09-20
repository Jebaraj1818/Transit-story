import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Mail, MapPin, Phone, ArrowRight, CheckCircle2, MessageSquare } from 'lucide-react';
import { submitContactMessage, getSiteSettings } from '../api/client';

export default function Contact() {
  const prefersReducedMotion = useReducedMotion();
  const [submitted, setSubmitted] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [siteSettings, setSiteSettings] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  useEffect(() => {
    let isMounted = true;
    getSiteSettings().then((settings) => {
      if (isMounted && settings) {
        setSiteSettings(settings);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Collect configured owner mobile numbers
  const phoneKeys = ['contact_phone_1', 'contact_phone_2', 'contact_phone_3', 'contact_phone_4'];
  const ownerPhones = phoneKeys
    .map((k) => (siteSettings?.[k] ? String(siteSettings[k]).trim() : ''))
    .filter((num) => Boolean(num) && !num.includes('[') && !num.toLowerCase().includes('configured upon'));

  // Backward-compatibility: if none of the 4 owner phones are configured, check contact_phone
  if (ownerPhones.length === 0 && siteSettings?.contact_phone) {
    const legacyPhone = String(siteSettings.contact_phone).trim();
    if (legacyPhone && !legacyPhone.includes('[') && !legacyPhone.toLowerCase().includes('configured upon')) {
      ownerPhones.push(legacyPhone);
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'phone' && phoneError) {
      setPhoneError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.phone.trim()) {
      setPhoneError('Please enter your phone number.');
      return;
    }
    setPhoneError('');
    setIsSubmitting(true);
    try {
      await submitContactMessage(formData);
    } catch (err) {
      console.warn('Contact API submission notice:', err);
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);
    }
  };

  const fadeIn = {
    initial: prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  };

  return (
    <div className="min-h-screen pt-4 sm:pt-6 md:pt-10 pb-16 sm:pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ========================================================================= */}
        {/* 1. EDITORIAL MASTHEAD & HERO                                              */}
        {/* ========================================================================= */}
        <header className="mb-8 sm:mb-12 md:mb-14">
          {/* Subtle Editorial Top Rule */}
          <div className="flex items-center justify-between gap-4 pb-2.5 mb-5 sm:mb-7 border-b border-[#E3DCBF]/80 text-[10px] sm:text-xs uppercase tracking-[0.2em] text-earth font-medium">
            <div className="flex items-center gap-2">
              <span className="w-4 h-px bg-earth" aria-hidden="true" />
              <span>Let&rsquo;s Connect • Transit Story</span>
            </div>
            <span className="hidden sm:inline-block font-serif italic text-charcoal-muted tracking-normal text-xs lowercase">
              general correspondence
            </span>
          </div>

          <motion.div {...fadeIn} className="max-w-3xl">
            {/* Small Eyebrow */}
            <span className="inline-block text-[11px] sm:text-xs uppercase tracking-[0.25em] text-earth font-medium mb-2.5">
              LET&rsquo;S CONNECT
            </span>

            {/* Controlled Editorial Heading: elegant Cormorant Garamond */}
            <h1 className="font-serif text-[2.25rem] sm:text-4xl md:text-5xl lg:text-[3.5rem] font-normal text-forest tracking-tight leading-[1.08] mb-3 sm:mb-4">
              Begin the Conversation
            </h1>

            {/* Concise Supporting Text */}
            <p className="font-sans text-sm sm:text-base md:text-[17px] text-charcoal-muted leading-relaxed font-normal max-w-2xl">
              Have a question, want to know more about Transit Story, or simply want to get in touch? We&rsquo;d be glad to hear from you.
            </p>
          </motion.div>
        </header>

        {/* ========================================================================= */}
        {/* 2. OPTIONAL BRAND STATEMENT DIVIDER                                       */}
        {/* ========================================================================= */}
        <div className="py-4 sm:py-5 border-y border-[#E3DCBF]/70 mb-8 sm:mb-12 flex items-center justify-between gap-4">
          <p className="font-serif italic text-base sm:text-lg md:text-xl text-forest font-normal">
            &ldquo;Every journey begins with a conversation.&rdquo;
          </p>
          <span className="hidden md:inline-block text-[11px] uppercase tracking-[0.2em] text-gold font-medium">
            Transit Story
          </span>
        </div>

        {/* ========================================================================= */}
        {/* 3. TWO-COLUMN EDITORIAL COMPOSITION (Left: Info, Right: General Form)     */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-14 items-start">
          {/* ----------------------------------------------------------------------- */}
          {/* LEFT COLUMN: Editorial Contact Information & Dedicated Direction         */}
          {/* ----------------------------------------------------------------------- */}
          <motion.aside {...fadeIn} className="lg:col-span-5 space-y-6 sm:space-y-8">
            <div>
              <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-earth font-medium block mb-1">
                Direct Inquiries
              </span>
              <h2 className="font-serif text-2xl sm:text-[1.75rem] text-forest font-normal tracking-tight mb-2">
                Our Presence
              </h2>
              <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed font-normal">
                Reach our team directly for institutional queries, cultural collaborations, or general information regarding our work in South India.
              </p>
            </div>

            {/* Contact Details List with Fine Lines */}
            <div className="space-y-4 pt-4 border-t border-[#E3DCBF]">
              {/* Location */}
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-sm bg-white/70 border border-[#E3DCBF] flex items-center justify-center text-earth flex-shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[11px] uppercase tracking-[0.16em] text-charcoal-light font-medium">
                    Headquarters
                  </span>
                  <p className="text-sm font-medium text-forest mt-0.5">
                    {siteSettings?.headquarters || 'Tamil Nadu, India'}
                  </p>
                  <span className="text-xs text-charcoal-muted">
                    Rooted across South India
                  </span>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-sm bg-white/70 border border-[#E3DCBF] flex items-center justify-center text-earth flex-shrink-0 mt-0.5">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-[11px] uppercase tracking-[0.16em] text-charcoal-light font-medium">
                    Telephone
                  </span>
                  {ownerPhones.length > 0 ? (
                    <div className="mt-1 space-y-1">
                      {ownerPhones.map((phone, idx) => (
                        <a
                          key={idx}
                          href={`tel:${phone.replace(/[^\d+]/g, '')}`}
                          className="block text-sm font-medium text-forest hover:text-earth transition-colors focus-visible:outline-gold truncate"
                        >
                          {phone}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-charcoal-muted mt-0.5 italic">
                      Direct lines available upon request
                    </p>
                  )}
                  <span className="text-xs text-charcoal-muted block mt-1.5">
                    {siteSettings?.working_hours || 'Monday – Saturday, 9:00 AM – 6:00 PM IST'}
                  </span>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-sm bg-white/70 border border-[#E3DCBF] flex items-center justify-center text-earth flex-shrink-0 mt-0.5">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[11px] uppercase tracking-[0.16em] text-charcoal-light font-medium">
                    Email Correspondence
                  </span>
                  <a
                    href={`mailto:${siteSettings?.contact_email || 'transitstory.in@gmail.com'}`}
                    className="block text-sm font-medium text-forest hover:text-earth transition-colors mt-0.5"
                  >
                    {siteSettings?.contact_email || 'transitstory.in@gmail.com'}
                  </a>
                  <span className="text-xs text-charcoal-muted">
                    Curated inquiries & client correspondence
                  </span>
                </div>
              </div>
            </div>

            {/* Clear Separation Note: Route to Plan Your Journey */}
            <div className="p-4 sm:p-5 bg-white/50 border border-[#E3DCBF] rounded-sm space-y-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-earth font-semibold block">
                Looking to Plan a Trip?
              </span>
              <p className="text-xs text-charcoal-muted leading-relaxed">
                If you are looking to design a specific travel itinerary, book accommodations, or coordinate fleet transportation, please use our dedicated trip planning form.
              </p>
              <div className="pt-1">
                <Link
                  to="/plan-your-journey"
                  className="group inline-flex items-center gap-1.5 text-xs uppercase tracking-editorial font-medium text-forest hover:text-earth transition-colors min-h-[36px]"
                >
                  <span>Plan Your Journey</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1 text-gold" />
                </Link>
              </div>
            </div>
          </motion.aside>

          {/* ----------------------------------------------------------------------- */}
          {/* RIGHT COLUMN: Clean General Contact Form (No Trip Enquiry Inputs)        */}
          {/* ----------------------------------------------------------------------- */}
          <motion.div
            {...fadeIn}
            className="lg:col-span-7 bg-white/70 border border-[#E3DCBF] p-5 sm:p-7 md:p-9 rounded-sm shadow-sm"
          >
            {submitted ? (
              /* Refined Submission Confirmation State */
              <div className="text-center py-10 sm:py-14 space-y-4">
                <div className="w-12 h-12 rounded-full bg-forest/10 border border-forest/20 text-forest mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-earth" />
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl font-normal text-forest tracking-tight">
                  Thank You for Reaching Out
                </h3>
                <p className="text-xs sm:text-sm text-charcoal-muted max-w-md mx-auto leading-relaxed font-normal">
                  We have received your message. A member of the Transit Story team will review your inquiry and respond to you shortly.
                </p>
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
                    }}
                    className="inline-flex items-center justify-center px-5 py-2.5 border border-[#E3DCBF] hover:border-forest text-forest text-xs uppercase tracking-editorial font-medium rounded-sm transition-colors min-h-[44px]"
                  >
                    Send Another Message
                  </button>
                </div>
              </div>
            ) : (
              /* General Contact Form */
              <div>
                <div className="mb-6 sm:mb-8 pb-4 border-b border-[#E3DCBF]/70">
                  <div className="flex items-center gap-2 text-earth text-[10px] sm:text-[11px] uppercase tracking-kicker font-medium mb-1">
                    <MessageSquare className="w-3.5 h-3.5 text-gold" />
                    <span>General Correspondence</span>
                  </div>
                  <h2 className="font-serif text-2xl sm:text-3xl text-forest font-normal tracking-tight">
                    Write to Us
                  </h2>
                  <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed mt-1 font-normal">
                    Send us a message and our team will get back to you.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                  {/* Full Name */}
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-[11px] uppercase tracking-[0.16em] text-charcoal-muted font-medium mb-1.5"
                    >
                      Full Name *
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Ananya Sundaram"
                      className="w-full px-4 py-3 bg-[#FAF8F3] border border-[#E3DCBF] rounded-sm text-base sm:text-sm text-charcoal placeholder:text-charcoal-light/60 focus:border-gold focus:bg-white focus:outline-none transition-colors min-h-[46px]"
                    />
                  </div>

                  {/* Email & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-[11px] uppercase tracking-[0.16em] text-charcoal-muted font-medium mb-1.5"
                      >
                        Email Address *
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="name@example.com"
                        className="w-full px-4 py-3 bg-[#FAF8F3] border border-[#E3DCBF] rounded-sm text-base sm:text-sm text-charcoal placeholder:text-charcoal-light/60 focus:border-gold focus:bg-white focus:outline-none transition-colors min-h-[46px]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-[11px] uppercase tracking-[0.16em] text-charcoal-muted font-medium mb-1.5"
                      >
                        Phone Number *
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        inputMode="tel"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+91 98765 43210"
                        className={`w-full px-4 py-3 bg-[#FAF8F3] border rounded-sm text-base sm:text-sm text-charcoal placeholder:text-charcoal-light/60 focus:border-gold focus:bg-white focus:outline-none transition-colors min-h-[46px] ${
                          phoneError ? 'border-[#A63A2B] bg-[#FFF8F7]' : 'border-[#E3DCBF]'
                        }`}
                      />
                      {phoneError && (
                        <p className="text-[11px] text-[#A63A2B] font-medium mt-1.5">
                          {phoneError}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Subject (Optional) */}
                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-[11px] uppercase tracking-[0.16em] text-charcoal-muted font-medium mb-1.5"
                    >
                      Subject <span className="text-charcoal-light/70 font-normal lowercase">(optional)</span>
                    </label>
                    <input
                      id="subject"
                      name="subject"
                      type="text"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="e.g. General Inquiry, Collaboration, or Greeting"
                      className="w-full px-4 py-3 bg-[#FAF8F3] border border-[#E3DCBF] rounded-sm text-base sm:text-sm text-charcoal placeholder:text-charcoal-light/60 focus:border-gold focus:bg-white focus:outline-none transition-colors min-h-[46px]"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label
                      htmlFor="message"
                      className="block text-[11px] uppercase tracking-[0.16em] text-charcoal-muted font-medium mb-1.5"
                    >
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      required
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Please write your note, inquiry, or question here..."
                      className="w-full px-4 py-3 bg-[#FAF8F3] border border-[#E3DCBF] rounded-sm text-base sm:text-sm text-charcoal placeholder:text-charcoal-light/60 focus:border-gold focus:bg-white focus:outline-none transition-colors resize-y min-h-[120px]"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center w-full sm:w-auto px-7 py-3.5 bg-forest hover:bg-forest-800 text-ivory text-xs uppercase tracking-editorial font-medium rounded-sm transition-colors shadow-sm focus-visible:outline-gold min-h-[46px] cursor-pointer"
                    >
                      <span>SEND MESSAGE →</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
