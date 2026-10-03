'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AeroloomLogo } from '@/components/brand/AeroloomLogo';
import { SiteFooter } from '@/components/footer/SiteFooter';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Panel } from '@/components/ui/Panel';
import { Icon } from '@/components/ui/Icon';
import { siteConfig, getObfuscatedEmail } from '@/lib/site-config';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState(''); // Spam honeypot
  const [submitted, setSubmitted] = useState(false);

  const obfuscated = getObfuscatedEmail();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) {
      // Spam bot trapped
      setSubmitted(true);
      return;
    }
    // Set client-side confirmation and prepare mailto fallback
    setSubmitted(true);
  };

  const handleMailto = () => {
    const mailtoUrl = `mailto:${obfuscated.full}?subject=${encodeURIComponent(
      subject || 'Aeroloom Inquiry'
    )}&body=${encodeURIComponent(`From: ${name} (${email})\n\n${message}`)}`;
    window.location.href = mailtoUrl;
  };

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-[var(--line)] bg-[var(--surface)]/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-[1360px] mx-auto px-6 sm:px-12 py-4 flex items-center justify-between">
          <Link href="/" className="hover:opacity-85 transition-opacity" aria-label="Aeroloom Home">
            <AeroloomLogo variant="lockup" size="sm" />
          </Link>
          <Link href="/map">
            <Button variant="outline" size="sm" icon="radio">
              Live Radar
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[760px] mx-auto px-6 sm:px-12 py-16 space-y-12 w-full">
        <div className="space-y-4">
          <Chip variant="signal">TRANSPONDER COMMUNICATOR</Chip>
          <h1 className="font-serif text-4xl sm:text-5xl text-[var(--ink)] tracking-tight">
            Contact &amp; Engineering Feedback
          </h1>
          <p className="text-base text-[var(--ink-2)] leading-relaxed font-sans">
            Direct dispatch to the creator. Whether you have telemetry corrections, aerodrome additions, or technical feedback on the codebase.
          </p>
        </div>

        {submitted ? (
          <Panel variant="surface" className="p-8 bg-[var(--surface)] text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[var(--signal-wash)] border border-[var(--signal)] text-[var(--signal)] flex items-center justify-center mx-auto">
              <Icon name="check" size={24} />
            </div>
            <h2 className="font-serif text-2xl text-[var(--ink)]">
              Transmission Prepared
            </h2>
            <p className="text-sm text-[var(--ink-2)] max-w-md mx-auto leading-relaxed">
              Thank you for reaching out. If your mail client did not automatically launch, you can transmit directly to our inbox below:
            </p>
            <div className="pt-2">
              <Button variant="signal" size="md" onClick={handleMailto} icon="arrow-right">
                Launch Mail Client ({obfuscated.user}@{obfuscated.domain})
              </Button>
            </div>
            <div className="pt-4">
              <Button variant="ghost" size="sm" onClick={() => setSubmitted(false)}>
                ← Send Another Message
              </Button>
            </div>
          </Panel>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Honeypot field (hidden from real users) */}
            <div className="hidden" aria-hidden="true">
              <label htmlFor="website">Website</label>
              <input
                id="website"
                type="text"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="name" className="font-mono text-xs text-[var(--ink-2)] uppercase font-semibold">
                  Your Call Name / Handle
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Capt. Vance"
                  className="w-full px-3.5 py-2.5 rounded-sm bg-[var(--surface)] border border-[var(--line-strong)] text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--signal)] transition-shadow"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="email" className="font-mono text-xs text-[var(--ink-2)] uppercase font-semibold">
                  Return Signal (Email)
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full px-3.5 py-2.5 rounded-sm bg-[var(--surface)] border border-[var(--line-strong)] text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--signal)] transition-shadow"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="subject" className="font-mono text-xs text-[var(--ink-2)] uppercase font-semibold">
                Transmission Subject
              </label>
              <input
                id="subject"
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Telemetry discrepancy on KJFK Approach"
                className="w-full px-3.5 py-2.5 rounded-sm bg-[var(--surface)] border border-[var(--line-strong)] text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--signal)] transition-shadow"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="message" className="font-mono text-xs text-[var(--ink-2)] uppercase font-semibold">
                Dossier Dispatch (Message)
              </label>
              <textarea
                id="message"
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Provide detailed coordinates, airframe callsigns, or engineering notes..."
                className="w-full px-3.5 py-2.5 rounded-sm bg-[var(--surface)] border border-[var(--line-strong)] text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--signal)] transition-shadow resize-y"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
              <Button type="submit" variant="signal" size="lg" icon="arrow-right" iconPosition="right">
                Transmit Feedback Dispatch
              </Button>

              <div className="text-xs font-mono text-[var(--ink-3)] text-right">
                DIRECT INBOX: <span className="text-[var(--ink)]">{obfuscated.user} [at] {obfuscated.domain}</span>
              </div>
            </div>
          </form>
        )}

        {/* Developer Contact Card */}
        <section className="pt-8 border-t border-[var(--line)] space-y-4">
          <h2 className="font-serif text-2xl text-[var(--ink)] tracking-tight">
            Developer Coordinates
          </h2>
          <Panel variant="surface" className="p-6 bg-[var(--surface)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="font-serif text-lg font-bold text-[var(--ink)]">{siteConfig.developer.name}</div>
              <div className="text-xs text-[var(--ink-2)]">{siteConfig.developer.role}</div>
              <div className="text-xs font-mono text-[var(--ink-3)] mt-1">{siteConfig.developer.location}</div>
            </div>

            <div className="flex items-center gap-2">
              <a href={siteConfig.developer.links.portfolio} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" icon="arrow-up-right">
                  Portfolio
                </Button>
              </a>
              <a href={siteConfig.developer.links.github} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" icon="arrow-up-right">
                  GitHub
                </Button>
              </a>
              <a href={siteConfig.developer.links.linkedin} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" icon="arrow-up-right">
                  LinkedIn
                </Button>
              </a>
            </div>
          </Panel>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
