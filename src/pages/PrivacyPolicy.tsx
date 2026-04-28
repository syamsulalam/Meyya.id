import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function PrivacyPolicy() {
  return (
    <div className="flex flex-col min-h-[100dvh]">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-24 sm:py-32">
        <h1 className="text-3xl sm:text-4xl mb-8">Privacy Policy</h1>
        <div className="prose prose-sm sm:prose-base prose-stone max-w-none">
          <p className="text-gray-500 mb-8">Effective Date: April 2026</p>
          
          <h2 className="text-xl mt-8 mb-4">1. Information We Collect</h2>
          <p className="mb-4">We collect information that you provide directly to us when you create an account, make a purchase, or contact our support team. This may include your name, email address, shipping address, and payment information.</p>

          <h2 className="text-xl mt-8 mb-4">2. How We Use Your Information</h2>
          <p className="mb-4">We use the information we collect to process transactions, provide customer support, and communicate with you about products, services, and promotions.</p>

          <h2 className="text-xl mt-8 mb-4">3. Data Security</h2>
          <p className="mb-4">We implement reasonable security measures to protect your personal information. However, no method of transmission over the internet or electronic storage is 100% secure.</p>

          <h2 className="text-xl mt-8 mb-4">4. Cookies</h2>
          <p className="mb-4">Meyya.id uses cookies to enhance your browsing experience, analyze site traffic, and personalize content. You can control cookies through your browser settings.</p>

          <h2 className="text-xl mt-8 mb-4">5. Third-Party Services</h2>
          <p className="mb-4">We use third-party services like Clerk for authentication. These services have their own privacy policies governing how they handle your data.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
