import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import Layout from "@/components/layout/Layout";
import { ShieldCheck, CreditCard, Truck, User, Lock, LayoutGrid, AlertCircle, Loader2, Ticket, Star, X, Check, MapPin, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getActiveRef } from "@/components/affiliate/RefTracker";

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_value: number | null;
  used: boolean;
  expires_at: string | null;
}

interface SavedAddress {
  id: string;
  label: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
  is_default: boolean;
}

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    cpf: "",
    zipCode: "",
    address: "",
    number: "",
    complement: "",
    city: "",
    state: "",
    paymentMethod: "credit_card"
  });

  const [isProcessing, setIsProcessing] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);

  // Affiliate referral state
  const [affiliateInfo, setAffiliateInfo] = useState<{ name: string; coupon_code: string | null; ref_slug: string } | null>(null);
  const [affiliateCouponApplied, setAffiliateCouponApplied] = useState(false);

  // Points state
  const [totalPoints, setTotalPoints] = useState(0);
  const [pointsToUse, setPointsToUse] = useState(0);
  const pointsValue = pointsToUse * 0.01;

  // Saved addresses state
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  // Calculate discounts
  const couponDiscount = appliedCoupon
    ? appliedCoupon.discount_type === "percentage"
      ? totalPrice * (appliedCoupon.discount_value / 100)
      : appliedCoupon.discount_value
    : 0;
  const totalDiscount = couponDiscount + pointsValue;
  const finalPrice = Math.max(0, totalPrice - totalDiscount);

  // Load affiliate referral data
  useEffect(() => {
    const ref = getActiveRef();
    if (ref) {
      supabase
        .from("affiliates")
        .select("name, coupon_code, ref_slug")
        .eq("ref_slug", ref.slug)
        .eq("status", "active")
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setAffiliateInfo(data as { name: string; coupon_code: string | null; ref_slug: string });
          }
        });
    }
  }, []);

  // Auto-apply affiliate coupon when affiliateInfo loads
  useEffect(() => {
    if (!affiliateInfo?.coupon_code || appliedCoupon || affiliateCouponApplied) return;
    if (!user) {
      // Even without login, mark as applied so the coupon code is used at order time
      setCouponCode(affiliateInfo.coupon_code);
      setAffiliateCouponApplied(true);
      return;
    }
    // Try to find in user_coupons first
    (async () => {
      setCouponLoading(true);
      const { data } = await supabase
        .from("user_coupons")
        .select("*")
        .eq("user_id", user.id)
        .eq("code", affiliateInfo.coupon_code!.toUpperCase())
        .eq("used", false)
        .maybeSingle();
      const coupon = data as Coupon | null;
      if (coupon && (!coupon.expires_at || new Date(coupon.expires_at) >= new Date()) && (!coupon.min_order_value || totalPrice >= coupon.min_order_value)) {
        setAppliedCoupon(coupon);
        setCouponCode(coupon.code);
        toast.success("Cupom de indicação aplicado automaticamente!");
      } else {
        // Set the code anyway so it's sent as metadata
        setCouponCode(affiliateInfo.coupon_code!);
      }
      setAffiliateCouponApplied(true);
      setCouponLoading(false);
    })();
  }, [affiliateInfo, user]);

  useEffect(() => {
    if (user) {
      loadCoupons();
      loadPoints();
      loadSavedAddresses();
    }
  }, [user]);

  const loadCoupons = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_coupons")
      .select("*")
      .eq("user_id", user.id)
      .eq("used", false)
      .order("created_at", { ascending: false });
    const valid = ((data as Coupon[]) || []).filter(
      (c) => !c.expires_at || new Date(c.expires_at) >= new Date()
    );
    setAvailableCoupons(valid);
  };

  const loadPoints = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("loyalty_points")
      .select("points")
      .eq("user_id", user.id);
    const total = ((data as { points: number }[]) || []).reduce((sum, e) => sum + e.points, 0);
    setTotalPoints(total);
  };

  const loadSavedAddresses = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false });
    const addresses = (data as SavedAddress[]) || [];
    setSavedAddresses(addresses);
    // Auto-select default address
    const defaultAddr = addresses.find((a) => a.is_default);
    if (defaultAddr) {
      applyAddress(defaultAddr);
    }
  };

  const applyAddress = (addr: SavedAddress) => {
    setSelectedAddressId(addr.id);
    setFormData((prev) => ({
      ...prev,
      zipCode: addr.zip,
      address: addr.street,
      number: addr.number,
      complement: addr.complement || "",
      city: addr.city,
      state: addr.state,
    }));
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !user) return;
    setCouponLoading(true);

    const { data } = await supabase
      .from("user_coupons")
      .select("*")
      .eq("user_id", user.id)
      .eq("code", couponCode.trim().toUpperCase())
      .eq("used", false)
      .maybeSingle();

    const coupon = data as Coupon | null;

    if (!coupon) {
      toast.error("Cupom inválido ou já utilizado");
      setCouponLoading(false);
      return;
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      toast.error("Este cupom expirou");
      setCouponLoading(false);
      return;
    }

    if (coupon.min_order_value && totalPrice < coupon.min_order_value) {
      toast.error(`Pedido mínimo de R$ ${Number(coupon.min_order_value).toFixed(2).replace(".", ",")} para este cupom`);
      setCouponLoading(false);
      return;
    }

    setAppliedCoupon(coupon);
    toast.success("Cupom aplicado!");
    setCouponLoading(false);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  const handleSelectCoupon = (coupon: Coupon) => {
    if (coupon.min_order_value && totalPrice < coupon.min_order_value) {
      toast.error(`Pedido mínimo de R$ ${Number(coupon.min_order_value).toFixed(2).replace(".", ",")} para este cupom`);
      return;
    }
    setAppliedCoupon(coupon);
    setCouponCode(coupon.code);
    toast.success("Cupom aplicado!");
  };

  const maxPointsForOrder = Math.min(totalPoints, Math.floor((totalPrice - couponDiscount) / 0.01));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Você precisa estar logado para finalizar a compra.");
      return;
    }
    setIsProcessing(true);

    try {
      // Build items payload with affiliate metadata
      const refData = getActiveRef();
      const affiliateRef = refData?.slug || null;
      const orderCouponCode = appliedCoupon ? appliedCoupon.code : (affiliateInfo?.coupon_code || null);

      const orderItems = items.map((item, idx) => ({
        title: item.product.title,
        price: item.product.price,
        quantity: item.quantity,
        ...(idx === 0 ? { coupon_code: orderCouponCode, affiliate_ref: affiliateRef } : {}),
      }));

      const { error: orderError } = await supabase.from("orders").insert({
        user_id: user.id,
        total: finalPrice,
        items: orderItems,
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: "",
        shipping_address: {
          street: formData.address,
          number: formData.number,
          complement: formData.complement,
          city: formData.city,
          state: formData.state,
          zip: formData.zipCode,
        },
      });

      if (orderError) {
        toast.error("Erro ao criar pedido. Tente novamente.");
        setIsProcessing(false);
        return;
      }

      // Mark coupon as used
      if (appliedCoupon) {
        await supabase.from("user_coupons").update({ used: true }).eq("id", appliedCoupon.id);
      }

      // Deduct points used
      if (pointsToUse > 0) {
        await supabase.from("loyalty_points").insert({
          user_id: user.id,
          points: -pointsToUse,
          source: "redeem",
          description: "Resgate no checkout",
        });
      }

      // Clear affiliate ref and cart after purchase
      localStorage.removeItem("supet_ref");
      clearCart();

      navigate("/success");
    } catch {
      toast.error("Erro inesperado. Tente novamente.");
      setIsProcessing(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 20 } }
  };

  if (items.length === 0) {
    return (
      <Layout>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="min-h-[70vh] bg-supet-bg flex items-center justify-center pt-24 md:pt-32 pb-24 px-6"
        >
          <div className="text-center max-w-md">
            <AlertCircle className="w-16 h-16 text-supet-orange mx-auto mb-6" />
            <h1 className="text-3xl font-black text-supet-text tracking-tight uppercase mb-4">
              Sua Sacola Está Vazia
            </h1>
            <p className="text-supet-text/60 font-medium mb-8">
              Adicione produtos à sua sacola antes de prosseguir com o pagamento.
            </p>
            <Link 
              to="/shop"
              className="inline-flex items-center justify-center bg-supet-orange hover:bg-supet-orange-dark text-white font-black uppercase tracking-widest px-8 py-4 rounded-full transition-all hover:scale-105"
            >
              Voltar para a Loja
            </Link>
          </div>
        </motion.div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="min-h-[70vh] bg-supet-bg flex items-center justify-center pt-24 md:pt-32 pb-24 px-6"
        >
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-black text-supet-text tracking-tight uppercase mb-3">
              Faça login para comprar
            </h1>
            <p className="text-supet-text/60 font-medium mb-8">
              Seus itens estão salvos na sacola. Entre ou crie sua conta para finalizar a compra.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link 
                to="/login?redirect=/checkout"
                className="inline-flex items-center justify-center bg-primary hover:opacity-90 text-primary-foreground font-black uppercase tracking-widest px-8 py-4 rounded-full transition-all hover:scale-105"
              >
                Entrar
              </Link>
              <Link 
                to="/cadastro?redirect=/checkout"
                className="inline-flex items-center justify-center border-2 border-primary text-primary font-black uppercase tracking-widest px-8 py-4 rounded-full transition-all hover:scale-105 hover:bg-primary/5"
              >
                Criar conta
              </Link>
            </div>
          </div>
        </motion.div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-supet-bg pt-24 md:pt-32 pb-24 border-b border-supet-text/5 relative overflow-hidden">
        
        <div className="absolute top-40 left-0 w-96 h-96 bg-supet-orange/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="mx-auto max-w-[1200px] px-6 lg:px-12 relative z-10">
          
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8 pt-4"
          >
            <span className="text-xs font-black uppercase tracking-[0.2em] text-supet-text/40">
              Home / <Link to="/shop" className="hover:text-supet-orange transition-colors">Loja</Link> / <span className="text-supet-orange">Checkout</span>
            </span>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            
            {/* Form Section */}
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="lg:col-span-7"
            >
              <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.03)] border border-supet-text/5">
                <motion.div variants={itemVariants} className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center border border-green-500/20">
                    <Lock className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-black text-supet-text tracking-tight uppercase">
                      Checkout Seguro
                    </h1>
                    <p className="text-sm font-medium text-supet-text/50">Ambiente 100% criptografado e seguro</p>
                  </div>
                </motion.div>

                <form onSubmit={handleSubmit} className="space-y-10">
                  
                  {/* Personal Info */}
                  <motion.div variants={itemVariants}>
                    <h2 className="text-lg font-black text-supet-text uppercase tracking-widest flex items-center gap-2 mb-6">
                      <User className="w-5 h-5 text-supet-orange" />
                      Dados Pessoais
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-supet-text/60 mb-2">Nome Completo</label>
                        <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-supet-bg-alt border border-supet-text/10 rounded-xl px-4 py-3 focus:outline-none focus:border-supet-orange focus:ring-1 focus:ring-supet-orange transition-all duration-300 font-medium text-supet-text" placeholder="Ex: João da Silva" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-supet-text/60 mb-2">E-mail</label>
                        <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-supet-bg-alt border border-supet-text/10 rounded-xl px-4 py-3 focus:outline-none focus:border-supet-orange focus:ring-1 focus:ring-supet-orange transition-all duration-300 font-medium text-supet-text" placeholder="joao@exemplo.com" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-supet-text/60 mb-2">CPF</label>
                        <input required type="text" name="cpf" value={formData.cpf} onChange={handleChange} className="w-full bg-supet-bg-alt border border-supet-text/10 rounded-xl px-4 py-3 focus:outline-none focus:border-supet-orange focus:ring-1 focus:ring-supet-orange transition-all duration-300 font-medium text-supet-text" placeholder="000.000.000-00" />
                      </div>
                    </div>
                  </motion.div>

                  <motion.hr variants={itemVariants} className="border-supet-text/5" />

                  {/* Shipping Info */}
                  <motion.div variants={itemVariants}>
                    <h2 className="text-lg font-black text-supet-text uppercase tracking-widest flex items-center gap-2 mb-6">
                      <Truck className="w-5 h-5 text-supet-orange" />
                      Entrega
                    </h2>

                    {/* Saved Addresses Selector */}
                    {user && savedAddresses.length > 0 && (
                      <div className="mb-6 space-y-2">
                        <p className="text-xs font-bold text-supet-text/40 uppercase tracking-widest mb-3">Endereços salvos</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {savedAddresses.map((addr) => (
                            <button
                              key={addr.id}
                              type="button"
                              onClick={() => applyAddress(addr)}
                              className={`text-left border-2 rounded-xl p-4 transition-all duration-300 ${
                                selectedAddressId === addr.id
                                  ? "border-supet-orange bg-supet-orange/5 scale-[1.01] shadow-sm"
                                  : "border-supet-text/10 hover:border-supet-orange/50"
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <MapPin className={`w-4 h-4 flex-shrink-0 ${selectedAddressId === addr.id ? "text-supet-orange" : "text-supet-text/40"}`} />
                                <span className={`text-sm font-bold ${selectedAddressId === addr.id ? "text-supet-orange" : "text-supet-text"}`}>
                                  {addr.label}
                                </span>
                                {addr.is_default && (
                                  <span className="text-[10px] font-bold bg-supet-orange/10 text-supet-orange px-1.5 py-0.5 rounded-full">Padrão</span>
                                )}
                                {selectedAddressId === addr.id && (
                                  <Check className="w-4 h-4 text-supet-orange ml-auto flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-supet-text/60 truncate pl-6">
                                {addr.street}, {addr.number} · {addr.city}/{addr.state}
                              </p>
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAddressId(null);
                              setFormData((prev) => ({ ...prev, zipCode: "", address: "", number: "", complement: "", city: "", state: "" }));
                            }}
                            className={`text-left border-2 border-dashed rounded-xl p-4 transition-all duration-300 ${
                              selectedAddressId === null
                                ? "border-supet-orange bg-supet-orange/5"
                                : "border-supet-text/10 hover:border-supet-orange/50"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <MapPin className={`w-4 h-4 ${selectedAddressId === null ? "text-supet-orange" : "text-supet-text/40"}`} />
                              <span className={`text-sm font-bold ${selectedAddressId === null ? "text-supet-orange" : "text-supet-text/60"}`}>
                                Novo endereço
                              </span>
                            </div>
                            <p className="text-xs text-supet-text/40 pl-6 mt-1">Preencher manualmente</p>
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                      <div className="md:col-span-4">
                        <label className="block text-sm font-bold text-supet-text/60 mb-2">CEP</label>
                        <input required type="text" name="zipCode" value={formData.zipCode} onChange={handleChange} className="w-full bg-supet-bg-alt border border-supet-text/10 rounded-xl px-4 py-3 focus:outline-none focus:border-supet-orange focus:ring-1 focus:ring-supet-orange transition-all duration-300 font-medium text-supet-text" placeholder="00000-000" />
                      </div>
                      <div className="md:col-span-8">
                        <label className="block text-sm font-bold text-supet-text/60 mb-2">Endereço</label>
                        <input required type="text" name="address" value={formData.address} onChange={handleChange} className="w-full bg-supet-bg-alt border border-supet-text/10 rounded-xl px-4 py-3 focus:outline-none focus:border-supet-orange focus:ring-1 focus:ring-supet-orange transition-all duration-300 font-medium text-supet-text" placeholder="Nome da rua, avenida..." />
                      </div>
                      <div className="md:col-span-4">
                        <label className="block text-sm font-bold text-supet-text/60 mb-2">Número</label>
                        <input required type="text" name="number" value={formData.number} onChange={handleChange} className="w-full bg-supet-bg-alt border border-supet-text/10 rounded-xl px-4 py-3 focus:outline-none focus:border-supet-orange focus:ring-1 focus:ring-supet-orange transition-all duration-300 font-medium text-supet-text" placeholder="123" />
                      </div>
                      <div className="md:col-span-8">
                        <label className="block text-sm font-bold text-supet-text/60 mb-2">Complemento</label>
                        <input type="text" name="complement" value={formData.complement} onChange={handleChange} className="w-full bg-supet-bg-alt border border-supet-text/10 rounded-xl px-4 py-3 focus:outline-none focus:border-supet-orange focus:ring-1 focus:ring-supet-orange transition-all duration-300 font-medium text-supet-text" placeholder="Apto, Bloco, etc. (opcional)" />
                      </div>
                      <div className="md:col-span-8">
                        <label className="block text-sm font-bold text-supet-text/60 mb-2">Cidade</label>
                        <input required type="text" name="city" value={formData.city} onChange={handleChange} className="w-full bg-supet-bg-alt border border-supet-text/10 rounded-xl px-4 py-3 focus:outline-none focus:border-supet-orange focus:ring-1 focus:ring-supet-orange transition-all duration-300 font-medium text-supet-text" placeholder="Sua cidade" />
                      </div>
                      <div className="md:col-span-4">
                        <label className="block text-sm font-bold text-supet-text/60 mb-2">Estado</label>
                        <input required type="text" name="state" value={formData.state} onChange={handleChange} className="w-full bg-supet-bg-alt border border-supet-text/10 rounded-xl px-4 py-3 focus:outline-none focus:border-supet-orange focus:ring-1 focus:ring-supet-orange transition-all duration-300 font-medium text-supet-text" placeholder="UF" />
                      </div>
                    </div>
                  </motion.div>

                  <motion.hr variants={itemVariants} className="border-supet-text/5" />

                  {/* Payment Info */}
                  <motion.div variants={itemVariants}>
                    <h2 className="text-lg font-black text-supet-text uppercase tracking-widest flex items-center gap-2 mb-6">
                      <CreditCard className="w-5 h-5 text-supet-orange" />
                      Pagamento
                    </h2>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <label className={`border-2 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-300 ${formData.paymentMethod === 'credit_card' ? 'border-supet-orange bg-supet-orange/5 scale-[1.02] shadow-sm' : 'border-supet-text/10 hover:border-supet-orange/50'}`}>
                        <input type="radio" name="paymentMethod" value="credit_card" checked={formData.paymentMethod === 'credit_card'} onChange={handleChange} className="sr-only" />
                        <CreditCard className={`w-6 h-6 transition-colors ${formData.paymentMethod === 'credit_card' ? 'text-supet-orange' : 'text-supet-text/40'}`} />
                        <span className={`text-sm font-bold uppercase tracking-wider transition-colors ${formData.paymentMethod === 'credit_card' ? 'text-supet-orange' : 'text-supet-text/60'}`}>Cartão</span>
                      </label>
                      <label className={`border-2 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-300 ${formData.paymentMethod === 'pix' ? 'border-supet-orange bg-supet-orange/5 scale-[1.02] shadow-sm' : 'border-supet-text/10 hover:border-supet-orange/50'}`}>
                        <input type="radio" name="paymentMethod" value="pix" checked={formData.paymentMethod === 'pix'} onChange={handleChange} className="sr-only" />
                        <LayoutGrid className={`w-6 h-6 transition-colors ${formData.paymentMethod === 'pix' ? 'text-supet-orange' : 'text-supet-text/40'}`} />
                        <span className={`text-sm font-bold uppercase tracking-wider transition-colors ${formData.paymentMethod === 'pix' ? 'text-supet-orange' : 'text-supet-text/60'}`}>Pix</span>
                      </label>
                    </div>

                    <motion.div 
                      key={formData.paymentMethod}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {formData.paymentMethod === 'credit_card' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-supet-text/60 mb-2">Número do Cartão</label>
                            <input required type="text" className="w-full bg-supet-bg-alt border border-supet-text/10 rounded-xl px-4 py-3 focus:outline-none focus:border-supet-orange focus:ring-1 focus:ring-supet-orange transition-all duration-300 font-medium text-supet-text" placeholder="0000 0000 0000 0000" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-supet-text/60 mb-2">Nome Impresso</label>
                            <input required type="text" className="w-full bg-supet-bg-alt border border-supet-text/10 rounded-xl px-4 py-3 focus:outline-none focus:border-supet-orange focus:ring-1 focus:ring-supet-orange transition-all duration-300 font-medium text-supet-text" placeholder="NOME COMO NO CARTÃO" />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-supet-text/60 mb-2">Validade</label>
                            <input required type="text" className="w-full bg-supet-bg-alt border border-supet-text/10 rounded-xl px-4 py-3 focus:outline-none focus:border-supet-orange focus:ring-1 focus:ring-supet-orange transition-all duration-300 font-medium text-supet-text" placeholder="MM/AA" />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-supet-text/60 mb-2">CVV</label>
                            <input required type="text" className="w-full bg-supet-bg-alt border border-supet-text/10 rounded-xl px-4 py-3 focus:outline-none focus:border-supet-orange focus:ring-1 focus:ring-supet-orange transition-all duration-300 font-medium text-supet-text" placeholder="123" />
                          </div>
                        </div>
                      )}
                      {formData.paymentMethod === 'pix' && (
                        <div className="bg-supet-orange/5 border border-supet-orange/20 rounded-xl p-6 text-center">
                          <LayoutGrid className="w-10 h-10 text-supet-orange mx-auto mb-3" />
                          <p className="text-supet-text font-bold mb-1">Pagamento via Pix</p>
                          <p className="text-sm text-supet-text/60">O código ou QR Code será gerado na próxima tela, após a finalização do pedido.</p>
                        </div>
                      )}
                    </motion.div>
                  </motion.div>

                  {/* Submit Button */}
                  <motion.div variants={itemVariants} className="pt-6 relative">
                    <button 
                      type="submit"
                      disabled={isProcessing}
                      className={`w-full flex items-center justify-center gap-2 bg-supet-orange text-white rounded-full py-5 text-lg font-black uppercase tracking-widest transition-all duration-300 shadow-[0_8px_30px_-6px_rgba(255,107,43,0.4)] ${isProcessing ? 'opacity-90 cursor-wait' : 'hover:bg-supet-orange-dark hover:shadow-[0_12px_40px_-8px_rgba(255,107,43,0.6)] hover:-translate-y-1'}`}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin" />
                          Processando Pagamento...
                        </>
                      ) : (
                        <>
                          Processar Pagamento Seguro
                          <Lock className="w-4 h-4 ml-1" />
                        </>
                      )}
                    </button>
                    {!isProcessing && (
                      <p className="text-center mt-4 text-xs font-bold text-supet-text/40 uppercase tracking-widest flex items-center justify-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" /> Ambiente protegido, dados criptografados.
                      </p>
                    )}
                  </motion.div>

                </form>
              </div>
            </motion.div>

            {/* Order Summary Side */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4, type: "spring" }}
              className="lg:col-span-5 relative"
            >
              <div className="sticky top-32 bg-supet-bg-alt rounded-[2rem] p-8 mt-0 border border-supet-text/5 shadow-sm">
                <h2 className="text-2xl font-black text-supet-text tracking-tight uppercase mb-6 flex items-center gap-3">
                  Resumo do Pedido
                  <div className="bg-supet-orange text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                    {items.length}
                  </div>
                </h2>
                
                <div className="space-y-4 mb-6 max-h-[30vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-supet-orange/20">
                  {items.map((item, i) => (
                    <motion.div 
                      key={item.product.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + (i * 0.1) }}
                      className="flex gap-4 p-3 bg-white rounded-xl border border-supet-text/5 group hover:border-supet-orange/20 transition-colors"
                    >
                      <div className="w-16 h-16 rounded-lg bg-supet-bg flex-shrink-0 p-1 group-hover:scale-105 transition-transform duration-300">
                        <img src={item.product.image} alt={item.product.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <p className="font-bold text-sm text-supet-text">{item.product.title}</p>
                        <p className="text-xs text-supet-text/50">Qtd: {item.quantity}</p>
                        <p className="font-black text-supet-text mt-1">R$ {(item.product.price * item.quantity).toFixed(2).replace('.', ',')}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Affiliate Referral Banner */}
                {affiliateInfo && (
                  <div className="border-t border-supet-text/10 pt-5 mb-2">
                    <div className="flex items-center gap-3 bg-supet-orange/10 border border-supet-orange/20 rounded-xl px-4 py-3">
                      <Sparkles className="w-5 h-5 text-supet-orange flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-supet-text">Indicação de {affiliateInfo.name}</p>
                        {affiliateInfo.coupon_code && affiliateCouponApplied && (
                          <p className="text-xs text-supet-text/60 mt-0.5">
                            Cupom <span className="font-mono font-bold text-supet-orange">{affiliateInfo.coupon_code}</span> aplicado automaticamente
                          </p>
                        )}
                      </div>
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    </div>
                  </div>
                )}

                {/* Coupon Section */}
                {user && (
                  <div className="border-t border-supet-text/10 pt-5 mb-5 space-y-3">
                    <h3 className="text-sm font-black text-supet-text uppercase tracking-widest flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-supet-orange" /> Cupom de desconto
                    </h3>

                    {appliedCoupon ? (
                      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="font-bold text-sm text-green-800">{appliedCoupon.code}</span>
                          <span className="text-xs text-green-600">
                            (-{appliedCoupon.discount_type === "percentage" ? `${appliedCoupon.discount_value}%` : `R$ ${appliedCoupon.discount_value}`})
                          </span>
                        </div>
                        <button onClick={handleRemoveCoupon} className="text-green-600 hover:text-red-500 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-2">
                          <input
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            placeholder="Digite o código"
                            className="flex-1 bg-white border border-supet-text/10 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-supet-text focus:outline-none focus:border-supet-orange focus:ring-1 focus:ring-supet-orange transition-all uppercase tracking-wider"
                          />
                          <button
                            type="button"
                            onClick={handleApplyCoupon}
                            disabled={couponLoading || !couponCode.trim()}
                            className="bg-supet-orange text-white rounded-xl px-5 py-2.5 text-sm font-bold uppercase tracking-wider hover:bg-supet-orange-dark transition-colors disabled:opacity-50 flex items-center gap-1.5"
                          >
                            {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aplicar"}
                          </button>
                        </div>

                        {availableCoupons.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs text-supet-text/40 font-bold">Seus cupons disponíveis:</p>
                            {availableCoupons.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => handleSelectCoupon(c)}
                                className="w-full flex items-center justify-between bg-white border border-dashed border-supet-orange/30 rounded-xl px-4 py-2.5 hover:border-supet-orange hover:bg-supet-orange/5 transition-all group"
                              >
                                <div className="flex items-center gap-2">
                                  <Ticket className="w-3.5 h-3.5 text-supet-orange/60 group-hover:text-supet-orange transition-colors" />
                                  <span className="font-mono font-bold text-xs text-supet-text tracking-wider">{c.code}</span>
                                </div>
                                <span className="text-xs font-bold text-supet-orange">
                                  {c.discount_type === "percentage" ? `${c.discount_value}% OFF` : `R$ ${c.discount_value} OFF`}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Points Section */}
                {user && totalPoints > 0 && (
                  <div className="border-t border-supet-text/10 pt-5 mb-5 space-y-3">
                    <h3 className="text-sm font-black text-supet-text uppercase tracking-widest flex items-center gap-2">
                      <Star className="w-4 h-4 text-supet-orange" /> Usar pontos
                    </h3>
                    <div className="bg-white border border-supet-text/10 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-supet-text/60 font-medium">Saldo disponível</span>
                        <span className="font-bold text-sm text-supet-text">{totalPoints} pts</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={maxPointsForOrder}
                        value={pointsToUse}
                        onChange={(e) => setPointsToUse(Number(e.target.value))}
                        className="w-full accent-supet-orange h-2 rounded-full"
                      />
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-supet-text/40">0 pts</span>
                        <span className="text-sm font-bold text-supet-orange">
                          {pointsToUse > 0 ? `-R$ ${pointsValue.toFixed(2).replace(".", ",")}` : "Nenhum ponto"}
                        </span>
                        <span className="text-xs text-supet-text/40">{maxPointsForOrder} pts</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t border-supet-text/10 pt-6 space-y-3">
                  <div className="flex justify-between items-center text-supet-text/60 font-bold">
                    <span>Subtotal</span>
                    <span>R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
                  </div>

                  {couponDiscount > 0 && (
                    <div className="flex justify-between items-center text-green-600 font-bold text-sm">
                      <span className="flex items-center gap-1"><Ticket className="w-3.5 h-3.5" /> Cupom</span>
                      <span>-R$ {couponDiscount.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}

                  {pointsValue > 0 && (
                    <div className="flex justify-between items-center text-green-600 font-bold text-sm">
                      <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5" /> Pontos</span>
                      <span>-R$ {pointsValue.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-supet-text/60 font-bold">
                    <span>Frete</span>
                    {totalPrice > 299.80 ? (
                      <span className="text-green-500 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5"/> Grátis</span>
                    ) : (
                      <span>Calculando...</span>
                    )}
                  </div>
                  <div className="border-t border-supet-text/10 pt-4 flex justify-between items-center text-supet-text font-black text-xl">
                    <span>Total</span>
                    <span className="text-supet-orange">R$ {finalPrice.toFixed(2).replace('.', ',')}</span>
                  </div>

                  {totalDiscount > 0 && (
                    <p className="text-xs text-green-600 font-bold text-right">
                      Você economizou R$ {totalDiscount.toFixed(2).replace(".", ",")} 🎉
                    </p>
                  )}
                </div>

                {/* Trust Badge */}
                <div className="mt-8 bg-white border border-supet-text/5 rounded-xl p-4 flex items-start gap-3 transform hover:-translate-y-1 transition-transform cursor-default">
                  <ShieldCheck className="w-6 h-6 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-supet-text">Garantia Supet</h4>
                    <p className="text-xs text-supet-text/60 mt-1 leading-tight">Proteção de compra: Receba seu pedido perfeitamente ou seu dinheiro de volta.</p>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </Layout>
  );
}
