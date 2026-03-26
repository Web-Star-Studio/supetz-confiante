import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/context/CartContext";
import { useProductImages } from "@/hooks/useProductImages";
import { useProducts } from "@/hooks/useProducts";
import type { Product } from "@/types";
import { ChevronRight, Minus, Plus, Check, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import SEOHead from "@/components/SEOHead";
import ProductReviews from "@/components/product/ProductReviews";

export default function Produto() {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [mainImg, setMainImg] = useState(0);
  const [added, setAdded] = useState(false);
  const { images: bucketImages, loading: imagesLoading } = useProductImages(id);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .eq("active", true)
        .single();

      if (data) {
        setProduct({
          id: data.id,
          title: data.title,
          subtitle: data.subtitle || "",
          price: Number(data.price),
          originalPrice: Number(data.original_price || data.price),
          pricePerUnit: data.price_per_unit || "",
          quantity: data.quantity,
          badge: data.badge || undefined,
          highlighted: data.highlighted || false,
          category: data.category as Product["category"],
          image: data.image_url || undefined,
          description: data.description || undefined,
        });
      }
      setLoading(false);
    };
    fetch();
  }, [id]);

  const gallery =
    bucketImages.length > 0
      ? bucketImages
      : product?.image
        ? [product.image]
        : [];

  const { products: related } = useProducts({
    category: product?.category || undefined,
  });
  const relatedFiltered = related.filter((p) => p.id !== id).slice(0, 3);

  const handleAdd = () => {
    if (!product) return;
    for (let i = 0; i < qty; i++) addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const discount =
    product && product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) *
            100
        )
      : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-32 px-6">
        <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-16">
          <Skeleton className="aspect-square rounded-3xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-12 w-1/3 mt-8" />
            <Skeleton className="h-32 w-full mt-8" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">
            Produto não encontrado
          </h1>
          <Link to="/shop" className="text-primary hover:underline">
            Voltar à loja
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={`${product.title} | Supet`}
        description={product.description || product.subtitle}
      />

      <div className="min-h-screen bg-background pt-28 pb-20 px-6">
        <div className="mx-auto max-w-6xl">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-10">
            <Link to="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link
              to="/shop"
              className="hover:text-foreground transition-colors"
            >
              Loja
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground font-medium truncate max-w-[200px]">
              {product.title}
            </span>
          </nav>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
            {/* Gallery */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              {gallery.length > 0 ? (
                <div className="space-y-4">
                  <div className="relative aspect-square rounded-3xl overflow-hidden bg-muted">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={mainImg}
                        src={gallery[mainImg]}
                        alt={product.title}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="w-full h-full object-cover"
                      />
                    </AnimatePresence>
                    {discount > 0 && (
                      <span className="absolute top-4 left-4 bg-destructive text-destructive-foreground text-xs font-bold px-3 py-1 rounded-full">
                        -{discount}%
                      </span>
                    )}
                  </div>
                  {gallery.length > 1 && (
                    <div className="flex gap-3">
                      {gallery.map((src, i) => (
                        <button
                          key={i}
                          onClick={() => setMainImg(i)}
                          className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                            i === mainImg
                              ? "border-primary ring-2 ring-primary/20"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <img
                            src={src}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-square rounded-3xl bg-muted flex items-center justify-center">
                  <ShoppingBag className="w-16 h-16 text-muted-foreground/30" />
                </div>
              )}
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-col"
            >
              <div className="flex items-center gap-3 mb-3">
                {product.badge && (
                  <Badge className="bg-primary text-primary-foreground text-xs">
                    {product.badge}
                  </Badge>
                )}
                {product.category && (
                  <Badge
                    variant="outline"
                    className="text-xs capitalize text-muted-foreground"
                  >
                    {product.category}
                  </Badge>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
                {product.title}
              </h1>
              {product.subtitle && (
                <p className="mt-2 text-lg text-muted-foreground font-medium">
                  {product.subtitle}
                </p>
              )}

              {/* Price */}
              <div className="mt-8 flex items-baseline gap-3">
                <span className="text-4xl font-black text-foreground">
                  R$ {product.price.toFixed(2).replace(".", ",")}
                </span>
                {product.originalPrice > product.price && (
                  <span className="text-lg line-through text-muted-foreground/50">
                    R$ {product.originalPrice.toFixed(2).replace(".", ",")}
                  </span>
                )}
              </div>
              {product.pricePerUnit && (
                <p className="text-sm text-muted-foreground mt-1">
                  {product.pricePerUnit}
                </p>
              )}

              {/* Description */}
              {product.description && (
                <div className="mt-8 text-muted-foreground leading-relaxed whitespace-pre-line border-t border-border pt-6">
                  {product.description}
                </div>
              )}

              {/* Quantity + CTA */}
              <div className="mt-auto pt-10 space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-foreground">
                    Quantidade
                  </span>
                  <div className="flex items-center border border-border rounded-full">
                    <button
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center font-bold text-foreground">
                      {qty}
                    </span>
                    <button
                      onClick={() => setQty((q) => q + 1)}
                      className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleAdd}
                  className={`w-full rounded-full py-4 text-base font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                    added
                      ? "bg-green-500 text-white"
                      : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_8px_30px_-6px_hsl(var(--primary)/0.4)]"
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {added ? (
                      <motion.div
                        key="ok"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-2"
                      >
                        <Check className="w-5 h-5" /> ADICIONADO
                      </motion.div>
                    ) : (
                      <motion.div
                        key="cta"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-2"
                      >
                        <ShoppingBag className="w-5 h-5" /> ADICIONAR À SACOLA
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </motion.div>
          </div>

          {/* Related */}
          {relatedFiltered.length > 0 && (
            <div className="mt-28">
              <h2 className="text-2xl font-extrabold text-foreground mb-10">
                Produtos relacionados
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                {relatedFiltered.map((p) => (
                  <Link
                    key={p.id}
                    to={`/produto/${p.id}`}
                    className="group rounded-2xl overflow-hidden bg-card border border-border hover:shadow-lg transition-shadow"
                  >
                    {p.image ? (
                      <div className="aspect-square overflow-hidden bg-muted">
                        <img
                          src={p.image}
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    ) : (
                      <div className="aspect-square bg-muted flex items-center justify-center">
                        <ShoppingBag className="w-10 h-10 text-muted-foreground/20" />
                      </div>
                    )}
                    <div className="p-5">
                      <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                        {p.title}
                      </h3>
                      <p className="text-primary font-black mt-2">
                        R$ {p.price.toFixed(2).replace(".", ",")}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          <ProductReviews productId={id!} />
        </div>
      </div>
    </>
  );
}
