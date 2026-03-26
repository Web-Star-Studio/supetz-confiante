import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/types";

interface UseProductsOptions {
  category?: string;
  categories?: string[];
}

export function useProducts(options?: UseProductsOptions) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      let query = supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: true });

      if (options?.category) {
        query = query.eq("category", options.category);
      } else if (options?.categories?.length) {
        query = query.in("category", options.categories);
      }

      const { data } = await query;

      const mapped: Product[] = (data || []).map((p: any) => ({
        id: p.id,
        title: p.title,
        subtitle: p.subtitle || "",
        price: Number(p.price),
        originalPrice: Number(p.original_price || p.price),
        pricePerUnit: p.price_per_unit || "",
        quantity: p.quantity,
        badge: p.badge || undefined,
        highlighted: p.highlighted || false,
        category: p.category || undefined,
        image: p.image_url || undefined,
        description: p.description || undefined,
      }));

      setProducts(mapped);
      setLoading(false);
    };

    fetch();
  }, [options?.category, options?.categories?.join(",")]);

  return { products, loading };
}
