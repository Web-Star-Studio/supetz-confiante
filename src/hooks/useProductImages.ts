import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useProductImages(productId: string | undefined) {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }

    const fetchImages = async () => {
      setLoading(true);
      const { data } = await supabase.storage
        .from("product-images")
        .list(productId, { sortBy: { column: "name", order: "asc" } });

      if (data && data.length > 0) {
        const urls = data
          .filter((f) => !f.name.startsWith("."))
          .map((f) => {
            const { data: urlData } = supabase.storage
              .from("product-images")
              .getPublicUrl(`${productId}/${f.name}`);
            return urlData.publicUrl;
          });
        setImages(urls);
      }
      setLoading(false);
    };

    fetchImages();
  }, [productId]);

  return { images, loading };
}
