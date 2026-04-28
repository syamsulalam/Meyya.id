import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 w-full flex-1">
      <h1 className="text-4xl font-heading font-light mb-12 text-center">Privacy Policy</h1>
      <div className="glass-panel p-8 md:p-12 rounded-[2rem] prose prose-sm max-w-none text-ink/80 font-light leading-loose">
        <p className="text-gray-500 mb-8 uppercase tracking-widest text-xs font-medium">Effective Date: April 2026</p>
        
        <h2 className="text-xl mt-8 mb-4 font-normal">1. Information We Collect</h2>
        <p className="mb-4">We collect information that you provide directly to us when you create an account, make a purchase, or contact our support team. This may include your name, email address, shipping address, and payment information.</p>

        <h2 className="text-xl mt-8 mb-4 font-normal">2. How We Use Your Information</h2>
        <p className="mb-4">We use the information we collect to process transactions, provide customer support, and communicate with you about products, services, and promotions.</p>

        <h2 className="text-xl mt-8 mb-4 font-normal">3. Data Security</h2>
        <p className="mb-4">We implement reasonable security measures to protect your personal information. However, no method of transmission over the internet or electronic storage is 100% secure.</p>

        <h2 className="text-xl mt-8 mb-4 font-normal">4. Cookies</h2>
        <p className="mb-4">Meyya.id uses cookies to enhance your browsing experience, analyze site traffic, and personalize content. You can control cookies through your browser settings.</p>

        <h2 className="text-xl mt-8 mb-4 font-normal">5. Third-Party Services</h2>
        <p className="mb-4">We use third-party services like Clerk for authentication. These services have their own privacy policies governing how they handle your data.</p>
      </div>
    </div>
  );
}
