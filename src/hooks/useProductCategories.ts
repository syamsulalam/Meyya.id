import useSWR from 'swr';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Gagal memuat kategori: ${res.status}`);
  return res.json();
};

export type ProductCategory = {
  id: number;
  name: string;
  slug?: string;
  image_url?: string;
  count?: number | string;
};

export function useProductCategories() {
  const { data, error, isLoading } = useSWR('/api/categories', fetcher);
  const categories = Array.isArray(data)
    ? data.filter((category: ProductCategory) => Number(category.count || 0) > 0)
    : [];

  return { categories, error, isLoading };
}
