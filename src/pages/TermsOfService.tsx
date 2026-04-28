import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function TermsOfService() {
  return (
    <div className="flex flex-col min-h-[100dvh]">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-24 sm:py-32">
        <h1 className="text-3xl sm:text-4xl mb-8">Terms of Service</h1>
        <div className="prose prose-sm sm:prose-base prose-stone max-w-none">
          <p className="text-gray-500 mb-8">Effective Date: April 2026</p>
          
          <h2 className="text-xl mt-8 mb-4">1. Acceptance of Terms</h2>
          <p className="mb-4">By accessing and using Meyya.id, you agree to comply with and be bound by these Terms of Service. If you do not agree with any part of these terms, please do not use our website.</p>

          <h2 className="text-xl mt-8 mb-4">2. User Accounts</h2>
          <p className="mb-4">To access certain features, you must register for an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>

          <h2 className="text-xl mt-8 mb-4">3. Privacy</h2>
          <p className="mb-4">Your privacy is important to us. Please review our Privacy Policy, which also governs your visit to our site, to understand our practices.</p>

          <h2 className="text-xl mt-8 mb-4">4. Products and Pricing</h2>
          <p className="mb-4">All prices on Meyya.id are subject to change without notice. We reserve the right to modify or discontinue any product or service at any time.</p>

          <h2 className="text-xl mt-8 mb-4">5. Limitation of Liability</h2>
          <p className="mb-4">Meyya.id and its affiliates will not be liable for any indirect, incidental, or punitive damages arising from the use of our services.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
