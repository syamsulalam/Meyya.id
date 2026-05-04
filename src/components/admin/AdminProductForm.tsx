import React, { useState, useEffect } from 'react';
import { Upload, Settings, Plus, Check, Edit2, Package, X, ChevronLeft, Download, Trash2 } from 'lucide-react';
import { useStore } from '../../store';
import useSWR from 'swr';
import { mutate } from 'swr';
import { useAuthFetch } from '../../hooks/useAuthFetch';
import {
  CanonicalSlugTooltip,
  D1Tooltip,
  ExplainedLabel,
  HppTooltip,
  LowStockTooltip,
  OpenGraphTooltip,
  ProductMarginTooltip,
  SeoTooltip,
  SkuTooltip,
  VariantTooltip,
  YieldTooltip,
} from '../term-tooltips';

const fetcher = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) {
    const text = await r.text();
    let err;
    try {
      err = JSON.parse(text);
      throw new Error(err.error || JSON.stringify(err));
    } catch (e: any) {
      if (e.message.includes('Unexpected token') || e instanceof SyntaxError) {
        throw new Error(`HTTP ${r.status}: ${text}`);
      }
      throw e;
    }
  }
  const data = await r.json();
  if (data && !Array.isArray(data)) {
    if (data.products && Array.isArray(data.products)) return data.products;
    if (data.categories && Array.isArray(data.categories)) return data.categories;
    if (data.orders && Array.isArray(data.orders)) return data.orders;
  }
  return data;
};

const parseCategoryOptions = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value !== 'string') return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parseCategoryOptions(parsed);
  } catch {
    // Fall back to comma/newline-separated admin input.
  }

  return value.split(/[,\n;]+/).map((item) => item.trim()).filter(Boolean);
};

type ProductVariantForm = {
  color_name: string;
  size_name: string;
  option_values: Record<string, string>;
  option_signature: string;
  option_label: string;
  sku: string;
  stock: number;
  is_active: boolean;
};

const normalizeOptionValues = (values: Record<string, string>) =>
  Object.keys(values).sort().reduce((acc: Record<string, string>, key) => {
    const cleanKey = key.trim();
    const cleanValue = String(values[key] || '').trim();
    if (cleanKey && cleanValue) acc[cleanKey] = cleanValue;
    return acc;
  }, {});

const getVariantSignature = (values: Record<string, string>) => JSON.stringify(normalizeOptionValues(values));

const getVariantLabel = (values: Record<string, string>) =>
  Object.entries(normalizeOptionValues(values)).map(([key, value]) => `${key}: ${value}`).join(' / ') || 'Standar';

const buildVariantFromOptions = (values: Record<string, string>, existing?: Partial<ProductVariantForm>): ProductVariantForm => {
  const optionValues = normalizeOptionValues(values);
  return {
    color_name: optionValues.Warna || existing?.color_name || 'Standar',
    size_name: optionValues.Ukuran || existing?.size_name || 'Semua Ukuran',
    option_values: optionValues,
    option_signature: getVariantSignature(optionValues),
    option_label: getVariantLabel(optionValues),
    sku: existing?.sku || '',
    stock: Number(existing?.stock || 0),
    is_active: existing?.is_active !== false,
  };
};

const buildOptionCombinations = (axes: { name: string; values: string[] }[]) =>
  axes.reduce<Record<string, string>[]>((rows, axis) =>
    rows.flatMap(row => axis.values.map(value => ({ ...row, [axis.name]: value }))),
  [{}]);

export default function AdminProductForm() {
  const authFetch = useAuthFetch();
  const { globalColors, addGlobalColor, addToast, showConfirm } = useStore();
  const { data: products, error, isLoading } = useSWR('/api/products', fetcher);
  const { data: dbCategories } = useSWR('/api/categories', fetcher);
  const categories = Array.isArray(dbCategories) ? dbCategories : [];
  
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [subTab, setSubTab] = useState<'list' | 'form'>('list');
  const [formStep, setFormStep] = useState<'select-category' | 'form'>('select-category');
  
  const [productName, setProductName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(1);
  const [isPreorder, setIsPreorder] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['All Size']);
  const AVAILABLE_SIZES = ['All Size', 'S', 'M', 'L', 'XL', 'XXL', 'Standard', 'Jumbo'];
  const [stock, setStock] = useState(0);
  const [weight, setWeight] = useState(250);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [customAttributes, setCustomAttributes] = useState<Record<string, string>>({});
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [canonicalSlug, setCanonicalSlug] = useState('');
  const [ogImageUrl, setOgImageUrl] = useState('');
  const [galleryImages, setGalleryImages] = useState<{ image_url: string; alt_text?: string; color_name?: string; is_primary?: boolean }[]>([]);
  const [productVariants, setProductVariants] = useState<ProductVariantForm[]>([]);
  const [relatedProductIds, setRelatedProductIds] = useState<number[]>([]);
  
  const [hargaKainRoll, setHargaKainRoll] = useState(0);
  const [yieldKain, setYieldKain] = useState(1);
  const [biayaJahitTotal, setBiayaJahitTotal] = useState(0);
  const [biayaJahitSatuan, setBiayaJahitSatuan] = useState(0);
  const [biayaLabel, setBiayaLabel] = useState(0);
  const [biayaHangTag, setBiayaHangTag] = useState(0);
  const [biayaProduksiTambahan, setBiayaProduksiTambahan] = useState(0);
  const [biayaZipperBag, setBiayaZipperBag] = useState(0);
  const [biayaKresek, setBiayaKresek] = useState(0);
  const [biayaPackaging, setBiayaPackaging] = useState(0);
  const [biayaLumpsum, setBiayaLumpsum] = useState(0);
  
  const [hargaJual, setHargaJual] = useState(0);
  
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setImageUrl(localUrl); // immediate preview
      
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const res = await authFetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.url) {
          setImageUrl(data.url);
          setGalleryImages(prev => prev.length === 0 ? [{ image_url: data.url, alt_text: productName, is_primary: true }] : prev);
        }
      } catch (err) {
        console.error('Upload failed', err);
        addToast('Gagal upload gambar', 'error');
      }
    }
  };
  
  // Custom Color State
  const [selectedColorNames, setSelectedColorNames] = useState<string[]>([]);
  const [showAddColor, setShowAddColor] = useState(false);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#000000');
  
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatImg, setNewCatImg] = useState('');

  // Gift Box state
  const [allowGiftBox, setAllowGiftBox] = useState(false);
  const [giftBoxPrice, setGiftBoxPrice] = useState(0);

  const toggleColor = (name: string) => {
    setSelectedColorNames(prev => 
      prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
    );
  };

  const handleAddNewColor = () => {
    if (newColorName.trim() && newColorHex) {
      addGlobalColor({ name: newColorName.trim(), hex: newColorHex });
      setSelectedColorNames(prev => [...prev, newColorName.trim()]);
      setNewColorName('');
      setNewColorHex('#000000');
      setShowAddColor(false);
    }
  };
  
  const handleEdit = (p: any) => {
    setIsEditing(p.id);
    setSubTab('form');
    setFormStep('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setProductName(p.name);
    setSlug(p.slug || '');
    setDescription(p.description || '');
    setCategoryId(p.category_id || 1);
    setIsPreorder(p.is_preorder === 1);
    setStock(p.stock || 0);

    // update sizes
    const sizes = Array.isArray(p.sizes) ? p.sizes.map((s: any) => s.size_name || s) : ['All Size'];
    setSelectedSizes(sizes);
    setWeight(p.weight || 250);
    setLowStockThreshold(p.low_stock_threshold || 5);
    setHargaJual(p.base_price || 0);
    setImageUrl(p.image_url || null);
    setGalleryImages(Array.isArray(p.images) && p.images.length > 0 ? p.images.map((img: any) => ({
      image_url: img.image_url,
      alt_text: img.alt_text || p.name,
      color_name: img.color_name || '',
      is_primary: img.is_primary === 1,
    })) : (p.image_url ? [{ image_url: p.image_url, alt_text: p.name, is_primary: true }] : []));
    setProductVariants(Array.isArray(p.variants) ? p.variants.map((variant: any) => buildVariantFromOptions(
      variant.option_values || {
        ...(variant.color_name ? { Warna: variant.color_name } : {}),
        ...(variant.size_name ? { Ukuran: variant.size_name } : {}),
      },
      {
        color_name: variant.color_name || '',
        size_name: variant.size_name || '',
        sku: variant.sku || '',
        stock: Number(variant.stock || 0),
        is_active: variant.is_active !== 0,
      }
    )) : []);
    setRelatedProductIds(Array.isArray(p.related_products) ? p.related_products.map((item: any) => item.id) : []);
    setMetaTitle(p.meta_title || '');
    setMetaDescription(p.meta_description || '');
    setCanonicalSlug(p.canonical_slug || p.slug || '');
    setOgImageUrl(p.og_image_url || p.image_url || '');
    
    // attributes mapping
    const attrs: Record<string, string> = {};
    if (Array.isArray(p.attributes)) {
       for (const a of p.attributes) {
          const name = String(a.attribute_name || '').trim();
          const value = String(a.attribute_value || '').trim();
          if (name && value) attrs[name] = value;
       }
    }
    setCustomAttributes(attrs);
    
    // reset breakdown
    setHargaKainRoll(0);
    setYieldKain(1);
    setBiayaJahitTotal(0);
    setBiayaJahitSatuan(0);
    setBiayaLabel(0);
    setBiayaHangTag(0);
    setBiayaProduksiTambahan(0);
    setBiayaZipperBag(0);
    setBiayaKresek(0);
    setBiayaPackaging(0);
    setBiayaLumpsum(p.production_cost || 0);
    
    const colors = Array.isArray(p.colors) ? p.colors.map((c: any) => c.color_name) : [];
    setSelectedColorNames(colors);
    
    // Update global colors if some are missing from global
    if (Array.isArray(p.colors)) {
      for (const c of p.colors) {
        if (!globalColors.find(gc => gc.name === c.color_name)) {
          addGlobalColor({ name: c.color_name, hex: c.hex_code });
        }
      }
    }
  };

  // Breakdown Calculations
  const costKainSatuan = yieldKain > 0 ? (hargaKainRoll / yieldKain) : 0;
  const costJahitSatuan = biayaJahitTotal > 0 && yieldKain > 0 ? (biayaJahitTotal / yieldKain) : biayaJahitSatuan;
  const costLumpsumSatuan = biayaLumpsum > 0 && yieldKain > 0 ? (biayaLumpsum / yieldKain) : 0;
  
  const totalCostSatuan = costKainSatuan + costJahitSatuan + biayaLabel + biayaHangTag + biayaProduksiTambahan + biayaZipperBag + biayaKresek + biayaPackaging + costLumpsumSatuan;
  
  const estimatedProfit = hargaJual - totalCostSatuan;
  const profitMargin = hargaJual > 0 ? ((estimatedProfit / hargaJual) * 100).toFixed(1) : '0.0';

  const resetForm = () => {
    setIsEditing(null);
    setSubTab('list');
    setFormStep('select-category');
    setProductName('');
    setSlug('');
    setDescription('');
    setHargaJual(0);
    setStock(0);
    setWeight(250);
    setLowStockThreshold(5);
    setBiayaLumpsum(0);
    setSelectedColorNames([]);
    setIsPreorder(false);
    setSelectedSizes(['All Size']);
    setImageUrl(null);
    setGalleryImages([]);
    setProductVariants([]);
    setRelatedProductIds([]);
    setMetaTitle('');
    setMetaDescription('');
    setCanonicalSlug('');
    setOgImageUrl('');
    setCustomAttributes({});
  };

  const handleAddCategory = async () => {
    if (!newCatName || !newCatSlug) return addToast('Nama dan slug harus diisi', 'error');
    try {
      const res = await authFetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName, slug: newCatSlug, image_url: newCatImg })
      });
      if (!res.ok) throw new Error('Gagal tambah kategori');
      const data = await res.json();
      mutate('/api/categories');
      setCategoryId(data.id);
      setShowAddCategory(false);
      setNewCatName('');
      setNewCatSlug('');
      setNewCatImg('');
      addToast('Kategori berhasil ditambahkan', 'success');
    } catch (e: any) {
      addToast(e.message, 'error');
    }
  };

  const handleSubmit = async () => {
    try {
      const cleanVariants = productVariants
        .map(variant => {
          const optionValues = normalizeOptionValues(variant.option_values || {});
          return {
            ...variant,
            color_name: String(optionValues.Warna || variant.color_name || '').trim() || 'Standar',
            size_name: String(optionValues.Ukuran || variant.size_name || '').trim() || 'Semua Ukuran',
            option_values: optionValues,
            option_signature: getVariantSignature(optionValues),
            option_label: getVariantLabel(optionValues),
            sku: variant.sku.trim(),
            stock: Number(variant.stock || 0),
            is_active: variant.is_active,
          };
        })
        .filter(variant => Object.keys(variant.option_values).length > 0);
      const normalizedStock = isPreorder ? 0 : (cleanVariants.length > 0
        ? cleanVariants.reduce((sum, variant) => sum + (variant.is_active ? Number(variant.stock || 0) : 0), 0)
        : stock);
      const payload = {
        name: productName,
        slug: slug || productName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        description,
        category_id: categoryId,
        stock: normalizedStock,
        weight,
        base_price: hargaJual,
        production_cost: totalCostSatuan,
        image_url: imageUrl || '', 
        images: galleryImages.map((image, index) => ({
          ...image,
          alt_text: image.alt_text || productName,
          is_primary: image.is_primary || index === 0,
        })),
        variants: cleanVariants,
        related_product_ids: relatedProductIds,
        meta_title: metaTitle.trim() || productName,
        meta_description: metaDescription.trim(),
        canonical_slug: canonicalSlug.trim() || (slug || productName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')),
        og_image_url: ogImageUrl.trim() || imageUrl || '',
        low_stock_threshold: lowStockThreshold,
        is_active: 1,
        is_preorder: isPreorder ? 1 : 0,
        sizes: selectedSizes,
        attributes: Object.keys(customAttributes)
          .map(k => ({
             attribute_name: k.trim(),
             attribute_value: String(customAttributes[k] || '').trim()
          }))
          .filter(attr => attr.attribute_name && attr.attribute_value),
        colors: selectedColorNames.map(name => {
          const c = globalColors.find(gc => gc.name === name);
          return { color_name: name, hex_code: c?.hex || '#000000' }
        })
      };

      const url = isEditing ? `/api/products/${isEditing}` : '/api/products';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error('Gagal menyimpan produk');
      
      mutate('/api/products');
      resetForm();
      addToast('Produk berhasil disimpan!', 'success');
    } catch (e: any) {
      addToast(e.message, 'error');
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []) as File[];
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await authFetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok || !data.url) throw new Error(data.error || 'Gagal upload gallery');
        setGalleryImages(prev => [...prev, { image_url: data.url, alt_text: productName, is_primary: prev.length === 0 }]);
        if (!imageUrl) setImageUrl(data.url);
      } catch (err: any) {
        addToast(err.message, 'error');
      }
    }
  };

  const exportProducts = () => {
    const productRows = Array.isArray(products) ? products : [];
    const rows = [
      ['id', 'name', 'slug', 'category', 'price', 'stock', 'weight', 'preorder', 'active'],
      ...productRows.map((p: any) => [p.id, p.name, p.slug, p.category_name, p.base_price, p.stock, p.weight, p.is_preorder, p.is_active])
    ];
    const csv = rows.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `meyya-products-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const deleteProduct = (productId: number) => {
    showConfirm({
      title: 'Hapus Produk',
      message: 'Produk akan diarsipkan dan tidak tampil di katalog. Histori order tetap aman.',
      confirmLabel: 'Hapus',
      tone: 'danger',
      onConfirm: async () => {
        try {
          const res = await authFetch(`/api/products/${productId}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Gagal menghapus produk');
          mutate('/api/products');
          addToast('Produk berhasil diarsipkan', 'success');
        } catch (error: any) {
          addToast(error.message, 'error');
        }
      },
    });
  };

  return (
    <div>
      {/* Product List */}
      {subTab === 'list' && (
      <div>
      <div className="flex justify-between items-center gap-4 mb-8 border-b border-black/10 pb-4">
        <div>
          <h2 className="text-2xl font-light font-heading text-ink">Manajemen Produk</h2>
          <p className="text-sm opacity-60">Kelola katalog produk e-commerce Anda.</p>
        </div>
        <button
          onClick={() => setSubTab('form')}
          className="bg-ink text-white px-5 py-3 rounded-full text-xs font-semibold tracking-widest uppercase hover:bg-black/80 transition-colors shadow-m flex items-center gap-2"
        >
          <Plus size={16} /> Tambah Produk
        </button>
      </div>

      <div className="bg-white/40 border border-black/5 rounded-2xl p-4 mb-12 overflow-x-auto">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
           <div>
             {isLoading && <span className="text-sm text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">⏳ Sedang memuat data dari database (D1)...</span>}
             {error && <span className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200">⚠️ Gagal terhubung ke database: {error.message}</span>}
             {products && (
              <span className="inline-flex items-center gap-1.5 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                Terhubung ke database D1 ({products?.length || 0} produk ditemukan)
                <D1Tooltip />
              </span>
             )}
           </div>
           <button
             onClick={exportProducts}
             className="self-start sm:self-auto bg-white border border-black/10 text-ink px-4 py-2 rounded-full text-xs font-semibold tracking-widest uppercase hover:bg-black/5 transition-colors shadow-m flex items-center gap-2"
           >
             <Download size={16} /> Ekspor
           </button>
        </div>
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-black/10 text-xs uppercase tracking-widest opacity-60">
              <th className="py-3 font-medium">Nama Produk</th>
              <th className="py-3 font-medium">Kategori</th>
              <th className="py-3 font-medium">Harga (Rp)</th>
              <th className="py-3 font-medium">Stok</th>
              <th className="py-3 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {(Array.isArray(products) ? products : [])?.map((p: any) => (
              <tr key={p.id} className="border-b border-black/5 last:border-0">
                <td className="py-4 font-medium">{p.name}</td>
                <td className="py-4">{p.category_name}</td>
                <td className="py-4 font-mono">{p.base_price?.toLocaleString('id-ID')}</td>
                <td className="py-4 font-mono">
                  {p.stock} pcs
                  <br/><span className="text-[10px] text-gray-500 opacity-60">Upd: {p.last_stock_update ? new Date(p.last_stock_update).toLocaleDateString() : '-'}</span>
                </td>
                <td className="py-4">
                   <button onClick={() => handleEdit(p)} title="Edit produk" aria-label={`Edit produk ${p.name}`} className="text-black/60 hover:text-ink inline-flex items-center justify-center bg-white w-9 h-9 rounded-lg border border-black/10 transition-colors">
                     <Edit2 size={15} />
                   </button>
                   <button onClick={() => deleteProduct(p.id)} className="text-red-500 hover:text-red-700 ml-2 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 transition-colors">
                     <Trash2 size={14} />
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {products?.length === 0 && !isLoading && (
           <div className="text-center py-12 text-black/50">
              <Package size={48} className="mx-auto mb-4 opacity-50" />
              <p>Belum ada produk. Silakan tambahkan produk baru.</p>
           </div>
        )}
      </div>
      </div>
      )}

      {subTab === 'form' && (
      <>
      <div className="flex justify-between items-center mb-8 border-b border-black/10 pb-4">
        <div>
           <button type="button" onClick={() => resetForm()} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-black/40 hover:text-ink mb-2">
              <ChevronLeft size={16} /> Kembali ke Daftar Produk
           </button>
           <h2 className="text-2xl font-light font-heading text-ink">
             {isEditing ? 'Edit Produk' : 'Tambah Produk Baru'}
           </h2>
        </div>
      </div>
      
      {formStep === 'select-category' && !isEditing && (
        <div className="bg-white/40 border border-black/5 rounded-3xl p-8 slide-down text-center mb-12">
           <h3 className="text-xl font-heading mb-2">Pilih Kategori Produk</h3>
           <p className="text-sm opacity-60 mb-8 max-w-lg mx-auto">Silakan pilih kategori produk terlebih dahulu. Atribut yang ditanyakan di form selanjutnya akan menyesuaikan dengan kategori yang dipilih.</p>
           
           {categories.length === 0 ? (
             <div className="bg-orange-50 text-orange-800 p-6 rounded-2xl">
               <p className="mb-2">Anda belum memiliki kategori produk.</p>
               <p className="text-sm opacity-80">Silakan tambahkan kategori terlebih dahulu melalui menu Manajemen Kategori di atas.</p>
             </div>
           ) : (
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
               {categories.map((c: any) => (
                 <button key={c.id} onClick={() => { setCategoryId(c.id); setFormStep('form'); }} className="bg-white border border-black/10 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 hover:border-ink hover:shadow-md transition-all group">
                   <div className="w-16 h-16 rounded-full overflow-hidden border border-black/5 group-hover:scale-105 transition-transform duration-300">
                     <img src={c.image_url} alt={c.name} className="w-full h-full object-cover" />
                   </div>
                   <span className="text-sm font-medium">{c.name}</span>
                 </button>
               ))}
               <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="bg-black/5 border border-black/10 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center gap-3 hover:bg-black/10 transition-all text-ink">
                 <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white border border-black/5 shadow-sm">
                   <Plus size={24} />
                 </div>
                 <span className="text-sm font-medium">Tambah Kategori Lainnya di Atas</span>
               </button>
             </div>
           )}
        </div>
      )}
      
      {formStep === 'form' && (() => {
        const currentCat = categories.find((c: any) => c.id === categoryId);
        const hasSizes = currentCat?.has_sizes === 1;
        const hasColors = currentCat?.has_colors === 1;
        
        let catAttrs: any[] = [];
        if (currentCat && Array.isArray(currentCat.attributes)) {
           catAttrs = currentCat.attributes.map((a: any) => ({
             name: String(a.name || '').trim(),
             options: parseCategoryOptions(a.options)
           })).filter((attr: any) => attr.name && attr.options.length > 0);
        }

        const variantAxes = [
          ...(hasColors && selectedColorNames.length > 0 ? [{ name: 'Warna', values: selectedColorNames }] : []),
          ...(hasSizes && selectedSizes.length > 0 ? [{ name: 'Ukuran', values: selectedSizes }] : []),
          ...catAttrs.map((attr: any) => ({ name: attr.name, values: attr.options })),
        ].filter(axis => axis.values.length > 0);
        const galleryColorOptions = Array.from(new Set([
          ...selectedColorNames,
          ...galleryImages.map((image) => String(image.color_name || '').trim()).filter(Boolean),
        ]));
        const hasVariantStock = productVariants.length > 0;
        const activeVariantStock = productVariants.reduce((sum, variant) => sum + (variant.is_active ? Number(variant.stock || 0) : 0), 0);
        const stockInputDisabled = isPreorder || hasVariantStock;

        const generateVariantMatrix = () => {
          if (variantAxes.length === 0) {
            addToast('Pilih opsi warna, ukuran, atau spesifikasi kategori dulu.', 'error');
            return;
          }
          const combinations = buildOptionCombinations(variantAxes);
          if (combinations.length > 160) {
            addToast('Kombinasi varian terlalu banyak. Kurangi opsi kategori terlebih dahulu.', 'error');
            return;
          }
          const existingBySignature = new Map<string, ProductVariantForm>(productVariants.map(variant => [variant.option_signature || getVariantSignature(variant.option_values), variant]));
          setProductVariants(combinations.map(values => {
            const signature = getVariantSignature(values);
            return buildVariantFromOptions(values, existingBySignature.get(signature));
          }));
          setStock(combinations.reduce((sum, values) => {
            const existing = existingBySignature.get(getVariantSignature(values));
            return sum + Number(existing?.stock || 0);
          }, 0));
        };

        return (
        <form className="space-y-12 slide-down">
        {/* 1. Basic Info */}
        <div className="space-y-6">
          <h3 className="text-sm uppercase tracking-widest font-semibold pb-2 border-b border-black/10">1. Informasi Dasar</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
               <label className="block text-xs uppercase tracking-widest opacity-60 mb-2">Foto Produk</label>
               
               {imageUrl ? (
                 <div className="relative border border-black/10 rounded-3xl overflow-hidden mb-4 group aspect-video md:aspect-[21/9]">
                   <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                   <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <label className="bg-white text-ink px-4 py-2 rounded-xl text-sm font-medium cursor-pointer shadow-lg hover:bg-black/5">
                        Ganti Foto
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                     </label>
                   </div>
                 </div>
               ) : (
                 <label className="border-2 border-dashed border-black/20 rounded-3xl p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/50 transition-colors">
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    <Upload className="opacity-30 mb-4" size={32} />
                    <p className="text-sm font-medium">Klik untuk upload foto</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                 </label>
               )}
               {galleryImages.length > 0 && (
                 <div className="grid grid-cols-4 md:grid-cols-6 gap-3 mt-4">
                   {galleryImages.map((image, index) => (
                     <div key={`${image.image_url}-${index}`} className="relative group/gallery">
                       <button type="button" onClick={() => {
                         setImageUrl(image.image_url);
                         setGalleryImages(galleryImages.map((img, i) => ({ ...img, is_primary: i === index })));
                       }} className={`aspect-square rounded-xl overflow-hidden border bg-white ${image.is_primary ? 'border-ink' : 'border-black/10'}`}>
                         <img src={image.image_url} alt={image.alt_text || productName} className="w-full h-full object-cover" />
                       </button>
                       <button type="button" onClick={() => setGalleryImages(galleryImages.filter((_, i) => i !== index))} className="absolute -top-2 -right-2 bg-red-50 text-red-600 rounded-full p-1 opacity-0 group-hover/gallery:opacity-100 transition-opacity">
                         <X size={12} />
                       </button>
                       <select
                         value={image.color_name || ''}
                         onChange={e => setGalleryImages(galleryImages.map((img, i) => i === index ? { ...img, color_name: e.target.value } : img))}
                         disabled={galleryColorOptions.length === 0}
                         className="mt-1 w-full bg-white border border-black/10 rounded-lg px-2 py-1 text-[10px] disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                         <option value="">{galleryColorOptions.length === 0 ? 'Pilih warna dulu' : 'Semua warna'}</option>
                         {galleryColorOptions.map((colorName) => (
                           <option key={colorName} value={colorName}>{colorName}</option>
                         ))}
                       </select>
                     </div>
                   ))}
                 </div>
               )}
               <label className="mt-4 inline-flex cursor-pointer items-center gap-2 px-4 py-2 rounded-xl border border-black/10 bg-white text-xs font-semibold uppercase tracking-widest hover:bg-black/5">
                 <Upload size={14} /> Tambah Galeri
                 <input type="file" className="hidden" accept="image/*" multiple onChange={handleGalleryUpload} />
               </label>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs uppercase tracking-widest opacity-60 mb-2">Nama Produk</label>
              <input type="text" value={productName} onChange={e => setProductName(e.target.value)} placeholder="Mis: Pashmina Silk Premium" className="w-full bg-white/50 border border-black/10 rounded-xl py-3 px-4 focus:outline-none focus:border-black/50 text-sm" />
            </div>
            <div className="bg-white/40 p-4 rounded-xl border border-black/5">
              <label className="block text-xs uppercase tracking-widest opacity-60 mb-3">Terhubung Ke Kategori Produk</label>
              <div className="flex items-center gap-3 bg-white p-3 border border-black/10 rounded-xl">
                {currentCat?.image_url && <img src={currentCat.image_url} alt={currentCat.name} className="w-10 h-10 object-cover rounded-full bg-black/5" />}
                <div>
                  <div className="text-sm font-medium">{currentCat?.name || '-'}</div>
                  <div className="text-[10px] uppercase opacity-50">Menentukan input atribut form di bawah</div>
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs uppercase tracking-widest opacity-60 flex items-center gap-1">Stok Fisik</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={isPreorder} onChange={e => setIsPreorder(e.target.checked)} className="rounded border-black/20 text-ink focus:ring-ink" />
                    <span className="text-[10px] uppercase font-bold text-ink/70">Sistem Pre-order</span>
                  </label>
                </div>
                <input type="number" disabled={stockInputDisabled} value={isPreorder ? 0 : hasVariantStock ? activeVariantStock : stock} onChange={e => setStock(Number(e.target.value))} placeholder="0" className={`w-full bg-white/50 border border-black/10 rounded-xl py-3 px-4 focus:outline-none focus:border-black/50 text-sm font-mono ${stockInputDisabled ? 'opacity-50 cursor-not-allowed' : ''}`} />
                {isPreorder && <p className="text-[10px] opacity-50 mt-1">Stok tidak dibatasi untuk pre-order</p>}
                {!isPreorder && hasVariantStock && <p className="text-[10px] opacity-50 mt-1">Stok global otomatis dari total stok varian aktif: {activeVariantStock} pcs.</p>}
              </div>
              <div className="flex-1">
                 <label className="block text-xs uppercase tracking-widest opacity-60 mb-2">Berat / Gram</label>
                 <input type="number" value={weight} onChange={e => setWeight(Number(e.target.value))} placeholder="250" className="w-full bg-white/50 border border-black/10 rounded-xl py-3 px-4 focus:outline-none focus:border-black/50 text-sm font-mono" />
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest opacity-60 mb-2">
                <ExplainedLabel tooltip={<LowStockTooltip />}>Low Stock Alert</ExplainedLabel>
              </label>
              <input type="number" value={lowStockThreshold} onChange={e => setLowStockThreshold(Number(e.target.value || 0))} placeholder="5" className="w-full bg-white/50 border border-black/10 rounded-xl py-3 px-4 focus:outline-none focus:border-black/50 text-sm font-mono" />
              <p className="text-[10px] opacity-50 mt-1">Produk masuk alert dashboard jika stok sama/di bawah angka ini.</p>
            </div>

            {catAttrs.length > 0 && (
              <div className="md:col-span-2 space-y-4">
                <label className="block text-xs uppercase tracking-widest opacity-60">Atribut Spesifikasi Khusus ({currentCat?.name})</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {catAttrs.map((attr, idx) => (
                      <div key={idx} className="bg-white/40 border border-black/10 rounded-xl p-4">
                         <label className="block text-[10px] uppercase font-semibold mb-2">{attr.name}</label>
                         <select 
                            value={customAttributes[attr.name] || ''}
                            onChange={e => setCustomAttributes({...customAttributes, [attr.name]: e.target.value})}
                            className="w-full bg-white border border-black/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-ink"
                         >
                           <option value="">-- Pilih {attr.name} --</option>
                           {attr.options.map((opt: string, i: number) => (
                              <option key={i} value={opt}>{opt}</option>
                           ))}
                         </select>
                      </div>
                   ))}
                </div>
              </div>
            )}

            {hasSizes && (
              <div className="md:col-span-2 space-y-4">
                <label className="block text-xs uppercase tracking-widest opacity-60">Ukuran Tersedia (Size)</label>
                <div className="flex flex-wrap gap-2">
                   {AVAILABLE_SIZES.map(s => {
                      const isSelected = selectedSizes.includes(s);
                      return (
                        <button type="button" key={s} onClick={() => {
                          if (isSelected) setSelectedSizes(selectedSizes.filter(x => x !== s));
                          else setSelectedSizes([...selectedSizes, s]);
                        }} className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${isSelected ? 'border-ink bg-ink text-white shadow-md' : 'border-black/10 hover:border-black/30 bg-white/50'}`}>
                          {s}
                        </button>
                      )
                   })}
                </div>
              </div>
            )}
            
            {hasColors && (
              <div className="md:col-span-2 space-y-4">
                <label className="block text-xs uppercase tracking-widest opacity-60">Warna Tersedia</label>
                <div className="flex flex-wrap gap-4 items-center">
                  {globalColors.map((color) => {
                  const isSelected = selectedColorNames.includes(color.name);
                  return (
                    <div 
                      key={color.name}
                      onClick={() => toggleColor(color.name)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-full border cursor-pointer transition-all ${isSelected ? 'border-ink bg-black/5' : 'border-black/10 hover:border-black/30'}`}
                    >
                      <div className="w-4 h-4 rounded-full border border-black/20" style={{ backgroundColor: color.hex }}></div>
                      <span className="text-xs">{color.name}</span>
                      {isSelected && <Check size={14} className="text-ink ml-1" />}
                    </div>
                  );
                })}
                
                <button 
                  type="button" 
                  onClick={() => setShowAddColor(!showAddColor)}
                  className="flex items-center gap-2 px-3 py-2 rounded-full border border-dashed border-black/30 text-xs hover:border-ink hover:text-ink transition-colors"
                >
                  <Plus size={14} /> Tambah Warna
                </button>
              </div>

              {showAddColor && (
                <div className="bg-white/60 p-4 rounded-2xl border border-black/5 flex gap-4 items-end max-w-lg mt-2 slide-down">
                   <div className="flex-1">
                     <label className="block text-[10px] uppercase opacity-60 mb-1">Nama Warna</label>
                     <input type="text" value={newColorName} onChange={e => setNewColorName(e.target.value)} placeholder="Mis: Taro" className="w-full bg-white border border-black/10 rounded-lg py-2 px-3 text-sm" />
                   </div>
                   <div>
                     <label className="block text-[10px] uppercase opacity-60 mb-1">Pilih Warna (Hex)</label>
                     <div className="flex items-center gap-2">
                       <input type="color" value={newColorHex} onChange={e => setNewColorHex(e.target.value)} className="w-9 h-9 p-0 border-0 rounded cursor-pointer" />
                       <span className="text-xs uppercase font-mono bg-white border border-black/10 rounded-lg py-2 px-3">{newColorHex}</span>
                     </div>
                   </div>
                   <button type="button" onClick={handleAddNewColor} className="bg-ink text-white px-4 py-2 rounded-lg text-xs uppercase tracking-widest font-medium hover:bg-black/80 h-[38px]">
                     Simpan
                   </button>
                </div>
              )}
            </div>
            )}

            <div className="md:col-span-2 bg-white/40 p-5 rounded-2xl border border-black/5 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
              <h4 className="text-xs uppercase tracking-widest font-semibold opacity-60">
                <ExplainedLabel tooltip={<VariantTooltip />}>Stok Per Kombinasi Varian</ExplainedLabel>
              </h4>
                  <p className="text-xs text-black/50 mt-1">
                    Stok di-bind ke kombinasi opsi: {variantAxes.map(axis => axis.name).join(' + ') || 'belum ada opsi'}.
                  </p>
                </div>
                <button type="button" onClick={generateVariantMatrix} className="text-xs bg-ink text-white px-4 py-2 rounded-full hover:bg-black/80">
                  <Plus size={12} className="inline mr-1" /> Generate Kombinasi
                </button>
              </div>
              {productVariants.length === 0 && <p className="text-xs text-black/50">Generate kombinasi setelah memilih warna, ukuran, dan opsi spesifikasi kategori.</p>}
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {productVariants.map((variant, index) => (
                  <div key={variant.option_signature || index} className="grid grid-cols-1 md:grid-cols-[minmax(0,1.5fr)_1fr_110px_96px_40px] gap-2 items-center bg-white/60 border border-black/5 rounded-xl p-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-ink truncate" title={variant.option_label}>{variant.option_label}</p>
                      <p className="text-[10px] text-black/40 truncate">{variant.option_signature}</p>
                    </div>
                    <div className="relative">
                      <input value={variant.sku} onChange={e => setProductVariants(productVariants.map((v, i) => i === index ? { ...v, sku: e.target.value } : v))} placeholder="SKU" className="w-full bg-white border border-black/10 rounded-xl px-3 py-2 pr-8 text-xs" />
                      <SkuTooltip className="absolute right-2 top-1/2 -translate-y-1/2" />
                    </div>
                    <input type="number" min={0} value={variant.stock} onChange={e => setProductVariants(productVariants.map((v, i) => i === index ? { ...v, stock: Number(e.target.value || 0) } : v))} placeholder="Stok" className="bg-white border border-black/10 rounded-xl px-3 py-2 text-xs font-mono" />
                    <button type="button" onClick={() => setProductVariants(productVariants.map((v, i) => i === index ? { ...v, is_active: !v.is_active } : v))} className={`px-3 py-2 rounded-xl text-[10px] uppercase tracking-widest font-semibold ${variant.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-black/5 text-black/40 border border-black/10'}`}>
                      {variant.is_active ? 'Aktif' : 'Nonaktif'}
                    </button>
                    <button type="button" onClick={() => setProductVariants(productVariants.filter((_, i) => i !== index))} className="p-2 text-red-500 hover:bg-red-50 rounded-xl"><X size={14} /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 bg-white/40 p-5 rounded-2xl border border-black/5 space-y-3">
              <h4 className="text-xs uppercase tracking-widest font-semibold opacity-60">Related Products Manual</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {(Array.isArray(products) ? products : [])
                  .filter((p: any) => p.id !== isEditing)
                  .slice(0, 24)
                  .map((p: any) => {
                    const selected = relatedProductIds.includes(p.id);
                    return (
                      <button type="button" key={p.id} onClick={() => setRelatedProductIds(selected ? relatedProductIds.filter(id => id !== p.id) : [...relatedProductIds, p.id])} className={`text-left px-3 py-2 rounded-xl border text-xs ${selected ? 'bg-ink text-white border-ink' : 'bg-white border-black/10 hover:bg-black/5'}`}>
                        {p.name}
                      </button>
                    );
                  })}
              </div>
            </div>

            <div className="md:col-span-2">
               <label className="block text-xs uppercase tracking-widest opacity-60 mb-2">Deskripsi Produk</label>
               <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full bg-white/50 border border-black/10 rounded-xl py-3 px-4 focus:outline-none focus:border-black/50 resize-none text-sm"></textarea>
            </div>

            <div className="md:col-span-2 bg-white/40 p-5 rounded-2xl border border-black/5 space-y-4">
              <h4 className="text-xs uppercase tracking-widest font-semibold opacity-60">
                <ExplainedLabel tooltip={<SeoTooltip />}>SEO Produk</ExplainedLabel>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-2">Meta Title</label>
                  <input type="text" value={metaTitle} onChange={e => setMetaTitle(e.target.value)} placeholder={productName || 'Judul SEO'} className="w-full bg-white border border-black/10 rounded-xl py-2 px-3 text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-2">
                    <ExplainedLabel tooltip={<CanonicalSlugTooltip />}>Canonical Slug</ExplainedLabel>
                  </label>
                  <input type="text" value={canonicalSlug} onChange={e => setCanonicalSlug(e.target.value)} placeholder={slug || 'slug-produk'} className="w-full bg-white border border-black/10 rounded-xl py-2 px-3 text-sm" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-2">Meta Description</label>
                  <textarea value={metaDescription} onChange={e => setMetaDescription(e.target.value)} rows={2} className="w-full bg-white border border-black/10 rounded-xl py-2 px-3 text-sm resize-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-2">
                    <ExplainedLabel tooltip={<OpenGraphTooltip />}>Open Graph Image URL</ExplainedLabel>
                  </label>
                  <input type="text" value={ogImageUrl} onChange={e => setOgImageUrl(e.target.value)} placeholder={imageUrl || 'https://...'} className="w-full bg-white border border-black/10 rounded-xl py-2 px-3 text-sm" />
                </div>
              </div>
            </div>
            
          </div>
        </div>

        {/* 2. Biaya Produksi */}
        <div className="space-y-6">
          <h3 className="text-sm uppercase tracking-widest font-semibold pb-2 border-b border-black/10">
            <ExplainedLabel tooltip={<HppTooltip />}>2. Kalkulasi Biaya Produksi (HPP)</ExplainedLabel>
          </h3>
          
          <div className="bg-white/40 p-6 rounded-3xl border border-black/5 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs uppercase tracking-widest opacity-60 mb-2">Harga Kain 1 Roll (Rp)</label>
                <input type="number" value={hargaKainRoll || ''} onChange={e => setHargaKainRoll(Number(e.target.value))} placeholder="Mis: 1500000" className="w-full bg-white border border-black/10 rounded-xl py-2 px-4 text-sm font-mono" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest opacity-60 mb-2">
                  <ExplainedLabel tooltip={<YieldTooltip />}>Yield (Jml Produk per Roll)</ExplainedLabel>
                </label>
                <input type="number" value={yieldKain || ''} onChange={e => setYieldKain(Number(e.target.value))} placeholder="Mis: 30" className="w-full bg-white border border-black/10 rounded-xl py-2 px-4 text-sm font-mono" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest opacity-60 mb-2">Biaya Jahit Satuan (Rp)</label>
                <input type="number" value={biayaJahitSatuan || ''} onChange={e => setBiayaJahitSatuan(Number(e.target.value))} placeholder="Isi ini jika jahit bayar per pcs" className="w-full bg-white border border-black/10 rounded-xl py-2 px-4 text-sm font-mono" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest opacity-60 mb-2">Atau Biaya Jahit Borongan/Roll (Rp)</label>
                <input type="number" value={biayaJahitTotal || ''} onChange={e => setBiayaJahitTotal(Number(e.target.value))} placeholder="Isi ini bila borongan" className="w-full bg-white border border-black/10 rounded-xl py-2 px-4 text-sm font-mono" />
              </div>
            </div>

            <h4 className="text-xs uppercase font-medium mt-4 pt-4 border-t border-black/5">Biaya Aksesoris & Packaging (Per Pcs)</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] uppercase opacity-60 mb-1">Label</label>
                <input type="number" value={biayaLabel || ''} onChange={e => setBiayaLabel(Number(e.target.value))} placeholder="0" className="w-full bg-white border border-black/10 rounded-lg py-1 px-3 text-xs font-mono" />
              </div>
              <div>
                <label className="block text-[10px] uppercase opacity-60 mb-1">Hang Tag</label>
                <input type="number" value={biayaHangTag || ''} onChange={e => setBiayaHangTag(Number(e.target.value))} placeholder="0" className="w-full bg-white border border-black/10 rounded-lg py-1 px-3 text-xs font-mono" />
              </div>
              <div>
                <label className="block text-[10px] uppercase opacity-60 mb-1">Zipper Bag</label>
                <input type="number" value={biayaZipperBag || ''} onChange={e => setBiayaZipperBag(Number(e.target.value))} placeholder="0" className="w-full bg-white border border-black/10 rounded-lg py-1 px-3 text-xs font-mono" />
              </div>
              <div>
                <label className="block text-[10px] uppercase opacity-60 mb-1">Kresek / Pouch</label>
                <input type="number" value={biayaKresek || ''} onChange={e => setBiayaKresek(Number(e.target.value))} placeholder="0" className="w-full bg-white border border-black/10 rounded-lg py-1 px-3 text-xs font-mono" />
              </div>
              <div>
                <label className="block text-[10px] uppercase opacity-60 mb-1">Ekstra Packaging</label>
                <input type="number" value={biayaPackaging || ''} onChange={e => setBiayaPackaging(Number(e.target.value))} placeholder="0" className="w-full bg-white border border-black/10 rounded-lg py-1 px-3 text-xs font-mono" />
              </div>
              <div>
                <label className="block text-[10px] uppercase opacity-60 mb-1">Lain-lain / Lumpsum</label>
                <input type="number" value={biayaLumpsum || ''} onChange={e => setBiayaLumpsum(Number(e.target.value))} placeholder="0" className="w-full bg-white border border-black/10 rounded-lg py-1 px-3 text-xs font-mono" title="Lumpsum dibagi per yield" />
              </div>
            </div>
          </div>
          
          {/* Kalkulator Otomatis */}
          <div className="bg-ink p-6 rounded-3xl text-white mt-8 shadow-xl">
            <h4 className="text-sm uppercase tracking-widest font-medium mb-6 opacity-80 flex items-center gap-2">
              <Settings size={16} />
              <ExplainedLabel tooltip={<ProductMarginTooltip />}>Kalkulator Profit</ExplainedLabel>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div className="space-y-4">
                 <div className="flex justify-between border-b border-white/20 pb-2 text-sm">
                   <span className="opacity-70">Sistem Biaya Kain per Pcs</span>
                   <span className="font-mono">Rp {Math.round(costKainSatuan).toLocaleString('id-ID')}</span>
                 </div>
                 <div className="flex justify-between border-b border-white/20 pb-2 text-sm">
                   <span className="opacity-70">Biaya Jahit per Pcs</span>
                   <span className="font-mono">Rp {Math.round(costJahitSatuan).toLocaleString('id-ID')}</span>
                 </div>
                 <div className="flex justify-between border-b border-white/20 pb-2 text-sm">
                   <span className="opacity-70">Aksesoris & Packaging</span>
                   <span className="font-mono">Rp {Math.round(biayaLabel + biayaHangTag + biayaProduksiTambahan + biayaZipperBag + biayaKresek + biayaPackaging).toLocaleString('id-ID')}</span>
                 </div>
                 <div className="flex justify-between pt-2 font-medium">
                   <span>Total HPP / Modal (Per Pcs)</span>
                   <span className="text-yellow-400 font-mono">Rp {Math.round(totalCostSatuan).toLocaleString('id-ID')}</span>
                 </div>
              </div>
              
              <div className="bg-white/10 p-6 rounded-2xl border border-white/10">
                <label className="block text-xs uppercase tracking-widest opacity-80 mb-2">Harga Jual Yang Direncanakan (Rp)</label>
                <input type="number" value={hargaJual || ''} onChange={e => setHargaJual(Number(e.target.value))} className="w-full bg-white/20 border-none rounded-xl py-3 px-4 text-white placeholder-white/40 outline-none focus:ring-2 ring-white/50 text-xl font-medium mb-6 font-mono" placeholder="0" />
                
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest opacity-60 mb-1">Estimasi Profit (Bersih)</p>
                    <p className={`text-3xl font-light font-mono ${estimatedProfit > 0 ? 'text-green-400' : estimatedProfit < 0 ? 'text-red-400' : ''}`}>Rp {Math.round(estimatedProfit).toLocaleString('id-ID')}</p>
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] uppercase tracking-widest opacity-60 mb-1">Margin</p>
                     <p className={`text-xl font-mono ${parseFloat(profitMargin) > 30 ? 'text-green-400' : 'text-yellow-400'}`}>{profitMargin}%</p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 text-right border-t border-black/10 flex justify-between">
          <button type="button" onClick={() => resetForm()} className="px-6 py-4 bg-white border border-black/10 text-ink rounded-full uppercase tracking-widest text-xs font-medium hover:bg-black/5 transition-colors">
            Batal
          </button>
          <button type="button" onClick={handleSubmit} className="px-10 py-4 bg-ink text-white rounded-full uppercase tracking-[0.2em] text-xs hover:bg-black/80 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1">
            {isEditing ? 'Simpan Perubahan' : 'Simpan Produk Baru'}
          </button>
        </div>
      </form>
      )})()}
    </>
    )}
    </div>
  );
}
