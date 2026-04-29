export const meyyaClerkAppearance = {
  variables: {
    fontFamily: 'inherit',
    colorPrimary: '#121212',
    colorText: '#121212',
    colorTextSecondary: 'rgba(0,0,0,0.6)',
    colorBackground: 'transparent',
  },
  elements: {
    rootBox: 'w-full mx-auto flex flex-col items-center',
    cardBox: 'w-full m-0 p-0 bg-transparent shadow-none border-none rounded-none',
    card: 'w-full m-0 p-0 bg-transparent shadow-none border-none rounded-none',

    header: 'hidden',
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',

    form: 'flex flex-col gap-6 w-full',
    formField: 'w-full',
    formFieldRow: 'w-full',
    formFieldLabelRow: 'flex mb-2',
    formFieldLabel: 'block text-xs uppercase tracking-widest text-black/60 font-medium',

    formFieldInput: 'w-full bg-white/50 border border-black/10 rounded-full py-3 px-4 focus:outline-none focus:border-black/50 focus:ring-0 transition-colors font-sans text-ink text-sm placeholder:font-light placeholder:text-black/40 shadow-none',
    formFieldInputShowPasswordButton: 'text-black/50 hover:text-ink transition-colors mr-3',
    formFieldSuccessText: 'text-xs text-green-600 mt-1 pl-4',
    formFieldErrorText: 'text-xs text-red-600 mt-1 pl-4',
    formFieldWarningText: 'text-xs text-orange-600 mt-1 pl-4',

    formButtonPrimary: 'w-full px-8 py-3 bg-ink text-white rounded-full uppercase tracking-[0.2em] text-xs font-medium hover:bg-black/80 transition-colors shadow-none border-none outline-none focus:ring-2 focus:ring-ink/20 disabled:opacity-50 disabled:cursor-not-allowed',

    socialButtons: 'flex flex-col gap-3 w-full',
    socialButtonsBlockButton: 'w-full flex items-center justify-center gap-3 bg-white/50 border border-black/10 hover:border-black/20 py-3 px-4 rounded-full hover:bg-black/5 transition-colors text-sm font-medium text-ink shadow-none',
    socialButtonsBlockButtonText: 'text-sm font-medium text-ink',
    socialButtonsProviderIcon: 'w-4 h-4',

    dividerLine: 'bg-black/10',
    dividerText: 'text-black/50 font-light text-xs px-4 bg-transparent uppercase tracking-widest',

    footer: 'bg-transparent border-none shadow-none p-0 mt-6',
    footerActionText: 'text-gray-500 font-light text-sm text-center',
    footerActionLink: 'text-ink font-medium hover:underline text-sm',

    identityPreview: 'bg-black/5 border border-transparent rounded-full py-3 px-4 text-sm shadow-none',
    identityPreviewText: 'text-sm text-ink',
    identityPreviewEditButton: 'text-ink hover:underline text-xs uppercase tracking-widest',

    alert: 'mb-6 p-4 rounded-xl bg-red-50 border border-red-100 shadow-none',
    alertText: 'text-xs text-red-600',
  },
};
