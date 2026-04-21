import React from 'react';

export default function StaticPage({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 w-full flex-1">
      <h1 className="text-4xl font-heading font-light mb-12 text-center">{title}</h1>
      <div className="glass-panel p-8 md:p-12 rounded-[2rem] prose prose-sm max-w-none text-ink/80 font-light leading-loose">
        {children}
      </div>
    </div>
  );
}
