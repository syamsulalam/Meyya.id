import { useState, useEffect, useRef } from 'react';

export default function AutoSuggest({ 
  items, 
  value, 
  onChange, 
  placeholder, 
  disabled,
}: { 
  items: { id: string | number, name: string }[], 
  value: { id: string | number, name: string } | null, 
  onChange: (val: { id: string | number, name: string } | null) => void,
  placeholder: string,
  disabled?: boolean
}) {
  const [query, setQuery] = useState(value ? value.name : '');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setQuery(value ? value.name : '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        handleBlur();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, query, value, items]);

  const filtered = items.filter(item => item.name.toLowerCase().includes(query.toLowerCase()));

  const handleSelect = (item: { id: string | number, name: string }) => {
    setQuery(item.name);
    onChange(item);
    setIsOpen(false);
  }

  const handleBlur = () => {
    if (isOpen) {
      if (!value || query.toLowerCase() !== value.name.toLowerCase()) {
        const strictMatch = items.find(i => i.name.toLowerCase() === query.trim().toLowerCase());
        if (strictMatch) {
          handleSelect(strictMatch);
        } else {
          setQuery(value ? value.name : ''); 
          if (!value && query !== '') onChange(null); 
        }
      }
      setIsOpen(false);
    }
  }

  return (
    <div className={`relative ${disabled ? 'opacity-50 pointer-events-none' : ''}`} ref={wrapperRef}>
      <input 
        type="text"
        value={query}
        onChange={e => {
          setQuery(e.target.value);
          setIsOpen(true);
          if (value) onChange(null); // Clear value if editing again
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full bg-white/80 border border-black/10 rounded-full py-3 px-4 outline-none focus:border-black/50 transition-colors text-sm"
      />
      {isOpen && filtered.length > 0 && (
        <ul className="absolute z-50 w-full bg-white border border-gray-200 mt-1 max-h-60 overflow-y-auto rounded-xl shadow-lg pb-1 text-sm top-full">
          {filtered.map(item => (
            <li 
              key={item.id} 
              onMouseDown={() => handleSelect(item)}
              className="px-4 py-3 border-b border-gray-100 last:border-none hover:bg-black/5 cursor-pointer transition-colors text-gray-800"
            >
              {item.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
