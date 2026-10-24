import React, { useState, useEffect, useCallback } from 'react';
import { 
  Mail, 
  Send, 
  CheckCircle2, 
  MessageSquare, 
  AlertCircle, 
  Clock, 
  ShieldCheck, 
  HelpCircle,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { 
  checkContactRateLimit, 
  recordContactSubmission, 
  ContactRateLimitStatus 
} from '../utils/rateLimit';

export const ContactView: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: '',
  });
  const [botField, setBotField] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitStatus, setRateLimitStatus] = useState<ContactRateLimitStatus>(() => checkContactRateLimit());

  // Periodically refresh rate limit status so remaining time updates automatically
  const updateRateLimit = useCallback(() => {
    setRateLimitStatus(checkContactRateLimit());
  }, []);

  useEffect(() => {
    updateRateLimit();
    const interval = setInterval(updateRateLimit, 15000);
    window.addEventListener('storage', updateRateLimit);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', updateRateLimit);
    };
  }, [updateRateLimit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Anti-spam check
    const currentRateLimit = checkContactRateLimit();
    if (currentRateLimit.isRateLimited) {
      setError(
        `Please wait ${currentRateLimit.minutesRemaining} minute${currentRateLimit.minutesRemaining === 1 ? '' : 's'} before submitting another message, or email us directly at support@free-picture-converter.com.`
      );
      setRateLimitStatus(currentRateLimit);
      return;
    }

    // 2. Input Validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setError('Please fill out all required fields.');
      return;
    }
    if (!formData.email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    // 3. Honeypot check for bots (silent success to fool bots)
    if (botField.trim()) {
      setIsSubmitted(true);
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      // 4. Netlify Forms Submission via URL-encoded POST
      const encode = (data: Record<string, string>) => {
        return Object.keys(data)
          .map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
          .join('&');
      };

      const payload = {
        'form-name': 'contact',
        'bot-field': botField,
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject,
        message: formData.message.trim(),
      };

      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: encode(payload),
      });

      const isLocal =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1' ||
          window.location.hostname === '::1');

      // Netlify returns 200 or 302 for valid form submissions.
      // In local dev without Netlify CLI, Vite dev server returns 404/405.
      if (!response.ok && !isLocal) {
        throw new Error(`Form submission failed with status ${response.status}`);
      }

      // Record successful submission for hourly rate limiting
      recordContactSubmission();
      setRateLimitStatus(checkContactRateLimit());
      setIsSubmitted(true);
    } catch (err) {
      console.error('Contact form submission error:', err);
      setError('There was an issue sending your message. Please try again later or contact us directly via email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      subject: 'General Inquiry',
      message: '',
    });
    setBotField('');
    setIsSubmitted(false);
    setError(null);
    updateRateLimit();
  };

  return (
    <div className="space-y-12 py-8 max-w-4xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 shadow-xs">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Get in Touch</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Contact Us & Support
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          Have feedback, need assistance with an image format, or want to suggest a new feature? We'd love to hear from you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Contact Info Sidebar */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white flex items-center space-x-2">
              <Mail className="w-5 h-5 text-blue-500" />
              <span>Direct Support</span>
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              For general questions, partnerships, or security inquiries, reach out to our team directly:
            </p>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 font-mono text-xs sm:text-sm text-blue-600 dark:text-blue-400 break-all select-all font-semibold">
              support@free-picture-converter.com
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white flex items-center space-x-2">
              <HelpCircle className="w-5 h-5 text-blue-500" />
              <span>Feature & Bug Reports</span>
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Found an issue or need support for a specialized image codec? Submit a detailed message using the form.
            </p>
            <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              We review and respond to inquiries within 24–48 hours.
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50 space-y-2">
            <div className="flex items-center space-x-2 text-sm font-bold text-emerald-800 dark:text-emerald-300">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Security Guarantee</span>
            </div>
            <p className="text-sm text-emerald-700 dark:text-emerald-400 leading-relaxed">
              We never ask for user login credentials, API tokens, or image file uploads. All communications are strictly confidential.
            </p>
          </div>
        </div>

        {/* Form Container */}
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
            {isSubmitted ? (
              <div className="py-12 text-center space-y-4 animate-fade-in">
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Message Sent Successfully!
                </h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  Thank you for reaching out to imagetooltip. Our team will review your message and respond to <strong>{formData.email}</strong> shortly.
                </p>

                <div className="pt-4">
                  <button
                    onClick={handleReset}
                    className="px-6 py-3 rounded-xl text-sm sm:text-base font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-colors cursor-pointer"
                  >
                    Send Another Message
                  </button>
                </div>
              </div>
            ) : (
              <form
                name="contact"
                method="POST"
                data-netlify="true"
                data-netlify-honeypot="bot-field"
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {/* Netlify Form Identifier */}
                <input type="hidden" name="form-name" value="contact" />

                {/* Honeypot Spam Filter */}
                <div className="hidden" aria-hidden="true" style={{ display: 'none' }}>
                  <label htmlFor="contact-bot-field">
                    Don't fill this out if you're human:
                    <input
                      id="contact-bot-field"
                      name="bot-field"
                      tabIndex={-1}
                      autoComplete="off"
                      value={botField}
                      onChange={(e) => setBotField(e.target.value)}
                    />
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Send us a Message
                  </h3>
                </div>

                {/* Active Rate Limit Warning Banner */}
                {rateLimitStatus.isRateLimited && (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-sm text-amber-900 dark:text-amber-200 flex items-start space-x-3 animate-fade-in">
                    <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold text-sm">Please Wait Before Sending Another Message</p>
                      <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300/90 leading-relaxed">
                        To prevent duplicate submissions, please wait{' '}
                        <strong className="font-semibold text-amber-900 dark:text-amber-100">{rateLimitStatus.minutesRemaining} minute{rateLimitStatus.minutesRemaining === 1 ? '' : 's'}</strong>{' '}
                        before sending another message, or email us directly at <span className="font-mono text-xs font-semibold bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded">support@free-picture-converter.com</span>.
                      </p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-sm text-rose-700 dark:text-rose-300 flex items-center space-x-2 animate-fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contact-name" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Your Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="contact-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Jane Doe"
                      disabled={isSubmitting}
                      className="w-full px-4 py-2.5 rounded-xl text-sm sm:text-base bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="jane@example.com"
                      disabled={isSubmitting}
                      className="w-full px-4 py-2.5 rounded-xl text-sm sm:text-base bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-subject" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Subject
                  </label>
                  <select
                    id="contact-subject"
                    name="subject"
                    autoComplete="off"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 rounded-xl text-sm sm:text-base bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer disabled:opacity-60"
                  >
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Feature Suggestion">Feature Suggestion</option>
                    <option value="Bug Report">Bug Report</option>
                    <option value="Format Request">Unsupported Format Request</option>
                    <option value="Privacy Concern">Privacy or Security Question</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="contact-message" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Your Message <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    autoComplete="off"
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe your inquiry, suggestion, or feedback..."
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 rounded-xl text-sm sm:text-base bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-60"
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting || rateLimitStatus.isRateLimited}
                    className={`inline-flex items-center space-x-2 px-7 py-3.5 rounded-xl text-base font-bold text-white shadow-md transition-all ${
                      rateLimitStatus.isRateLimited
                        ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-80'
                        : isSubmitting
                        ? 'bg-blue-500 cursor-wait'
                        : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg shadow-blue-500/20 active:scale-98 cursor-pointer'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending Message...</span>
                      </>
                    ) : rateLimitStatus.isRateLimited ? (
                      <>
                        <Clock className="w-4 h-4" />
                        <span>Please Wait ({rateLimitStatus.minutesRemaining}m)</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>

                  {/* Response time info */}
                  <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {rateLimitStatus.isRateLimited ? (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                          Resets in ~{rateLimitStatus.minutesRemaining}m
                        </span>
                      ) : (
                        <span>Usually replies within 24–48 hours</span>
                      )}
                    </span>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
