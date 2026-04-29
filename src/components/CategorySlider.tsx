import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const categories = [
  { id: 'pashmina', name: 'Pashmina', image: 'https://images.unsplash.com/photo-1589465885857-44edb59bbcdb?auto=format&fit=crop&q=80&w=800' },
  { id: 'abaya', name: 'Abaya', image: 'https://images.unsplash.com/photo-1627914225226-8051db55c117?auto=format&fit=crop&q=80&w=800' },
  { id: 'khimar', name: 'Khimar', image: 'https://images.unsplash.com/photo-1610427921319-5eb874d8b6da?auto=format&fit=crop&q=80&w=800' },
  { id: 'inner', name: 'Inner', image: 'https://images.unsplash.com/photo-1632734346904-7c30a213fd0d?auto=format&fit=crop&q=80&w=800' },
  { id: 'aksesoris', name: 'Aksesoris', image: 'https://plus.unsplash.com/premium_photo-1675107359570-87efced5d045?auto=format&fit=crop&q=80&w=800' },
];

export default function CategorySlider() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - (clientWidth * 0.8) : scrollLeft + (clientWidth * 0.8);
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full mb-20 max-w-7xl mx-auto px-4 group">
      <div className="flex justify-between items-end mb-6">
        <h2 className="text-3xl md:text-4xl font-light text-ink">
          Pilih Kategori Produk
        </h2>
        <div className="hidden md:flex gap-2">
          <button onClick={() => scroll('left')} className="p-2 border border-black/10 rounded-full hover:bg-black/5 transition-colors">
            <ChevronLeft size={20} className="text-ink" />
          </button>
          <button onClick={() => scroll('right')} className="p-2 border border-black/10 rounded-full hover:bg-black/5 transition-colors">
            <ChevronRight size={20} className="text-ink" />
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {categories.map((category) => (
          <Link 
            key={category.id} 
            to={`/?kategori=${category.id}#katalog`}
            className="flex-shrink-0 w-[240px] md:w-[320px] aspect-[4/5] snap-start relative rounded-3xl overflow-hidden group/card shadow-sm hover:shadow-xl transition-all duration-500"
          >
            <div className="absolute inset-0 bg-black/20 group-hover/card:bg-black/10 transition-colors z-10" />
            <img 
              src={category.image} 
              alt={category.name} 
              className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-x-0 bottom-0 p-6 z-20 flex flex-col justify-end">
              <h3 className="text-2xl font-light text-white mb-2 translate-y-2 group-hover/card:translate-y-0 transition-transform duration-500">{category.name}</h3>
              <div className="h-0.5 w-8 bg-white opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 delay-100"></div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
