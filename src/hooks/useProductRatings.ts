import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface RatingInfo {
  avg: number;
  count: number;
}

export function useProductRatings(productIds: string[]) {
  const [ratings, setRatings] = useState<Record<string, RatingInfo>>({});

  useEffect(() => {
    if (!productIds.length) return;

    const fetch = async () => {
      const { data } = await supabase
        .from("product_reviews")
        .select("product_id, rating")
        .in("product_id", productIds);

      if (!data) return;

      const map: Record<string, { sum: number; count: number }> = {};
      for (const r of data) {
        if (!map[r.product_id]) map[r.product_id] = { sum: 0, count: 0 };
        map[r.product_id].sum += r.rating;
        map[r.product_id].count += 1;
      }

      const result: Record<string, RatingInfo> = {};
      for (const [id, v] of Object.entries(map)) {
        result[id] = { avg: v.sum / v.count, count: v.count };
      }
      setRatings(result);
    };

    fetch();
  }, [productIds.join(",")]);

  return ratings;
}
