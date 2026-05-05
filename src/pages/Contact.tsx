import useSWR from 'swr';
import StaticPage from './StaticPage';

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Gagal memuat kontak.');
  return response.json();
};

export default function Contact() {
  const { data } = useSWR('/api/settings/public', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10 * 60 * 1000,
  });
  const contactWhatsapp = data?.contact_whatsapp || '6281234567890';

  return (
    <StaticPage title="Hubungi Kami">
      <p>Kami sangat antusias untuk mendengar pengalaman berbelanja Anda.</p>
      <p><strong>Email:</strong> help@meyya.id</p>
      <p><strong>WhatsApp:</strong> {formatWhatsapp(contactWhatsapp)}</p>
      <p>Tim dukungan pelanggan (<i>customer care</i>) kami akan siap melayani Anda mulai Hari Senin-Jumat, pukul 9 pagi hingga 5 sore WIB.</p>
    </StaticPage>
  );
}

function formatWhatsapp(value: string) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '-';
  const normalized = digits.startsWith('62') ? digits : digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
  return `+${normalized.replace(/(\d{2})(\d{3})(\d{4})(\d+)/, '$1 $2 $3 $4')}`;
}
