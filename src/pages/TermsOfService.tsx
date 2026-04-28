import React from 'react';

export default function TermsOfService() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 w-full flex-1">
      <h1 className="text-4xl font-heading font-light mb-12 text-center">Terms of Service</h1>
      <div className="glass-panel p-8 md:p-12 rounded-[2rem] prose prose-sm max-w-none text-ink/80 font-light leading-loose">
        <p className="text-gray-500 mb-8 uppercase tracking-widest text-xs font-medium">Effective Date: April 2026</p>
        
        <h2 className="text-xl mt-8 mb-4 font-normal">1. Acceptance of Terms</h2>
        <p className="mb-4">By accessing and using Meyya.id, you agree to comply with and be bound by these Terms of Service. If you do not agree with any part of these terms, please do not use our website.</p>

        <h2 className="text-xl mt-8 mb-4 font-normal">2. User Accounts</h2>
        <p className="mb-4">To access certain features, you must register for an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>

        <h2 className="text-xl mt-8 mb-4 font-normal">3. Privacy</h2>
        <p className="mb-4">Your privacy is important to us. Please review our Privacy Policy, which also governs your visit to our site, to understand our practices.</p>

        <h2 className="text-xl mt-8 mb-4 font-normal">4. Products and Pricing</h2>
        <p className="mb-4">All prices on Meyya.id are subject to change without notice. We reserve the right to modify or discontinue any product or service at any time.</p>

        <h2 className="text-xl mt-8 mb-4 font-normal">5. Limitation of Liability</h2>
        <p className="mb-4">Meyya.id and its affiliates will not be liable for any indirect, incidental, or punitive damages arising from the use of our services.</p>
      </div>
    </div>
  );
}
