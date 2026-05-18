import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useListProducts, useCreateOrder, getListOrdersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type CartItem = {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  imageUrl?: string | null;
};

function CartPanel({
  cart,
  updateQty,
  placeOrder,
  isPending,
  total,
  onClose,
}: {
  cart: CartItem[];
  updateQty: (id: number, delta: number) => void;
  placeOrder: () => void;
  isPending: boolean;
  total: number;
  onClose?: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl text-primary">Cart</h2>
          <p className="text-xs text-muted-foreground uppercase">{cart.length} item types</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-border transition-colors text-lg font-bold">×</button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence>
          {cart.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
              <p className="font-heading text-xl">Empty</p>
              <p className="text-sm mt-1">Tap items to add them</p>
            </motion.div>
          ) : (
            cart.map((item) => (
              <motion.div
                key={item.productId}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                data-testid={`cart-item-${item.productId}`}
                className="flex items-center gap-3 bg-background rounded-lg p-3 border border-border"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{item.productName}</p>
                  <p className="text-xs text-primary">${(item.unitPrice * item.quantity).toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button data-testid={`btn-dec-${item.productId}`} onClick={() => updateQty(item.productId, -1)} className="w-7 h-7 rounded-full bg-muted hover:bg-destructive hover:text-white font-bold text-sm flex items-center justify-center transition-colors">-</button>
                  <span className="w-5 text-center font-bold text-sm">{item.quantity}</span>
                  <button data-testid={`btn-inc-${item.productId}`} onClick={() => updateQty(item.productId, 1)} className="w-7 h-7 rounded-full bg-muted hover:bg-accent hover:text-background font-bold text-sm flex items-center justify-center transition-colors">+</button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
      <div className="p-4 border-t border-border">
        <div className="flex justify-between mb-4">
          <span className="font-heading text-lg">Total</span>
          <span className="font-heading text-2xl text-primary">${total.toFixed(2)}</span>
        </div>
        <button
          data-testid="btn-place-order"
          disabled={cart.length === 0 || isPending}
          onClick={placeOrder}
          className="w-full py-3 bg-primary text-white font-heading text-lg rounded-xl border-4 border-primary hover:bg-transparent hover:text-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPending ? "Placing..." : "Place Order"}
        </button>
      </div>
    </div>
  );
}

export default function OrderPage() {
  const { data: products, isLoading } = useListProducts();
  const createOrder = useCreateOrder();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [cartOpen, setCartOpen] = useState(false);

  const categories = ["All", ...Array.from(new Set((products ?? []).map((p) => p.category)))];
  const filteredProducts = activeCategory === "All" ? (products ?? []) : (products ?? []).filter((p) => p.category === activeCategory);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  function addToCart(product: { id: number; name: string; price: number; imageUrl?: string | null }) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) return prev.map((i) => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId: product.id, productName: product.name, unitPrice: product.price, quantity: 1, imageUrl: product.imageUrl }];
    });
  }

  function updateQty(productId: number, delta: number) {
    setCart((prev) => prev.map((i) => i.productId === productId ? { ...i, quantity: i.quantity + delta } : i).filter((i) => i.quantity > 0));
  }

  const total = cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  function placeOrder() {
    if (cart.length === 0) return;
    createOrder.mutate(
      { data: { items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })) } },
      {
        onSuccess: () => {
          setCart([]);
          setCartOpen(false);
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
          toast({ title: "Order placed!", description: "Your order is now in the kitchen." });
        },
        onError: () => toast({ title: "Error", description: "Could not place order.", variant: "destructive" }),
      }
    );
  }

  return (
    <div className="relative flex h-[calc(100vh-80px)] overflow-hidden">
      {/* Main menu area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mb-4 md:mb-6">
          <h1 className="font-heading text-4xl md:text-5xl text-primary mb-1">Order</h1>
          <p className="text-muted-foreground text-xs uppercase tracking-widest">Turn the everyday into ritual.</p>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap mb-4 md:mb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              data-testid={`filter-${cat}`}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 md:px-4 py-1.5 rounded-full border-2 font-bold text-xs md:text-sm uppercase transition-all ${activeCategory === cat ? "bg-primary border-primary text-white" : "border-border text-muted-foreground hover:border-primary hover:text-primary"}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-48 md:h-56 rounded-xl" />)}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="font-heading text-2xl">No items yet</p>
            <p className="text-sm mt-2">Add products from the Admin panel</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 pb-24 md:pb-0">
            <AnimatePresence>
              {filteredProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  data-testid={`card-product-${product.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-card border-2 border-border rounded-xl overflow-hidden flex flex-col cursor-pointer group hover:border-primary transition-all"
                  onClick={() => addToCart({ id: product.id, name: product.name, price: product.price, imageUrl: product.imageUrl })}
                >
                  <div className="relative aspect-square bg-muted overflow-hidden">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <span className="text-4xl text-muted-foreground">?</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors" />
                  </div>
                  <div className="p-2 md:p-3 flex-1 flex flex-col justify-between">
                    <p className="font-bold text-xs md:text-sm text-foreground leading-tight">{product.name}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground uppercase hidden sm:block">{product.category}</span>
                      <span className="text-primary font-heading text-base md:text-lg">${Number(product.price).toFixed(2)}</span>
                    </div>
                  </div>
                  <button
                    data-testid={`btn-add-${product.id}`}
                    className="w-full py-2 bg-primary/10 text-primary font-bold text-xs uppercase tracking-wider hover:bg-primary hover:text-white transition-all"
                  >
                    Add
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Desktop cart sidebar */}
      <div className="hidden md:flex w-80 border-l-4 border-primary flex-col bg-card">
        <CartPanel cart={cart} updateQty={updateQty} placeOrder={placeOrder} isPending={createOrder.isPending} total={total} />
      </div>

      {/* Mobile cart button */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t-2 border-primary z-40">
        <button
          data-testid="btn-open-cart"
          onClick={() => setCartOpen(true)}
          className="w-full py-3 bg-primary text-white font-heading text-lg rounded-xl flex items-center justify-between px-5"
        >
          <span>View Cart {cartCount > 0 && `(${cartCount})`}</span>
          <span>${total.toFixed(2)}</span>
        </button>
      </div>

      {/* Mobile cart drawer */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/60 z-50"
              onClick={() => setCartOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="md:hidden fixed bottom-0 left-0 right-0 h-[80vh] bg-card border-t-4 border-primary rounded-t-2xl z-50 flex flex-col"
            >
              <CartPanel
                cart={cart}
                updateQty={updateQty}
                placeOrder={placeOrder}
                isPending={createOrder.isPending}
                total={total}
                onClose={() => setCartOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
