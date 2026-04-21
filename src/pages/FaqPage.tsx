import { useState } from 'react';
import StaticPage from './StaticPage';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';

const faqs = [
  {
    question: "Bagaimana dengan ukuran pakaian?",
    answer: "Desain-desain kami bersifat modest (tertutup), menjuntai bebas (flowy), dan pada umumnya mengakomodasi berbagai postur tubuh. Harap merujuk pada ukuran yang tertera di masing-masing halaman produk untuk potongan (draping) yang lebih presisi."
  },
  {
    question: "Bagaimana cara merawat barang saya?",
    answer: "Kucek ringan (hand washing) dengan air dingin serta deterjen yang lembut sangat direkomendasikan guna menjaga kelembutan bahan. Apabila benar-benar diperlukan, setrika kain pada suhu paling rendah."
  },
  {
    question: "Apakah warnanya akan persis sesuai dengan yang di foto?",
    answer: "Kami berusaha menampilkan warna seakurat mungkin. Namun, perbedaan tampilan layar dan pencahayaan studio mungkin menyebabkan sedikit variasi warna (minor tone shift) pada produk asli."
  },
  {
    question: "Apakah kain yang digunakan menerawang (see-through)?",
    answer: "Mayoritas koleksi kami didesain dengan ketebalan yang pas agar tidak menerawang. Akan tetapi, untuk warna-warna yang sangat terang (seperti Pure White), kami sangat merekomendasikan penggunaan inner demi kenyamanan ekstra."
  }
];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <StaticPage title="FAQ & Panduan Ukuran">
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div key={index} className="border border-black/10 rounded-2xl overflow-hidden glass-panel bg-white/40">
            <button 
              onClick={() => toggle(index)}
              className="w-full px-6 py-5 flex items-center justify-between font-light text-left focus:outline-none hover:bg-black/5 transition-colors"
            >
              <span className="text-base text-ink">{faq.question}</span>
              <ChevronDown 
                size={20} 
                strokeWidth={1.5} 
                className={clsx(
                  "text-ink/60 transition-transform duration-300", 
                  openIndex === index && "rotate-180"
                )} 
              />
            </button>
            <div 
              className={clsx(
                "px-6 overflow-hidden transition-all duration-300 ease-in-out",
                openIndex === index ? "max-h-[500px] py-5 border-t border-black/5" : "max-h-0"
              )}
            >
              <p className="opacity-80 font-light text-sm leading-relaxed">{faq.answer}</p>
            </div>
          </div>
        ))}
      </div>
    </StaticPage>
  );
}
