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

export default function OrderPage() {
  const { data: products, isLoading } = useListProducts();
  const createOrder = useCreateOrder();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const categories = ["All", ...Array.from(new Set((products ?? []).map((p) => p.category)))];

  const filteredProducts =
    activeCategory === "All"
      ? (products ?? [])
      : (products ?? []).filter((p) => p.category === activeCategory);

  function addToCart(product: { id: number; name: string; price: number; imageUrl?: string | null }) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { productId: product.id, productName: product.name, unitPrice: product.price, quantity: 1, imageUrl: product.imageUrl }];
    });
  }

  function updateQty(productId: number, delta: number) {
    setCart((prev) =>
      prev
        .map((i) => (i.productId === productId ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  }

  const total = cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  function placeOrder() {
    if (cart.length === 0) return;
    createOrder.mutate(
      { data: { items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })) } },
      {
        onSuccess: () => {
          setCart([]);
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
          toast({ title: "Order placed!", description: "Your order is now in the kitchen." });
        },
        onError: () => {
          toast({ title: "Error", description: "Could not place order.", variant: "destructive" });
        },
      }
    );
  }

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden">
      {/* Main menu area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <h1 className="font-heading text-5xl text-primary mb-1">Order</h1>
          <p className="text-muted-foreground text-sm uppercase tracking-widest">Turn the everyday into ritual.</p>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap mb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              data-testid={`filter-${cat}`}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full border-2 font-bold text-sm uppercase transition-all ${
                activeCategory === cat
                  ? "bg-primary border-primary text-white"
                  : "border-border text-muted-foreground hover:border-primary hover:text-primary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-xl" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="font-heading text-2xl">No items yet</p>
            <p className="text-sm mt-2">Add products from the Admin panel</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
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
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <span className="text-4xl text-muted-foreground">?</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors" />
                  </div>
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <p className="font-bold text-sm text-foreground leading-tight">{product.name}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground uppercase">{product.category}</span>
                      <span className="text-primary font-heading text-lg">${Number(product.price).toFixed(2)}</span>
                    </div>
                  </div>
                  <button
                    data-testid={`btn-add-${product.id}`}
                    className="w-full py-2 bg-primary/10 text-primary font-bold text-xs uppercase tracking-wider hover:bg-primary hover:text-white transition-all"
                  >
                    Add to Cart
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Cart sidebar */}
      <div className="w-80 border-l-4 border-primary flex flex-col bg-card">
        <div className="p-4 border-b border-border">
          <h2 className="font-heading text-2xl text-primary">Cart</h2>
          <p className="text-xs text-muted-foreground uppercase">{cart.length} item types</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <AnimatePresence>
            {cart.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-muted-foreground py-12"
              >
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
                  <div className="flex items-center gap-1">
                    <button
                      data-testid={`btn-dec-${item.productId}`}
                      onClick={() => updateQty(item.productId, -1)}
                      className="w-7 h-7 rounded-full bg-muted hover:bg-destructive hover:text-white font-bold text-sm flex items-center justify-center transition-colors"
                    >
                      -
                    </button>
                    <span className="w-5 text-center font-bold text-sm">{item.quantity}</span>
                    <button
                      data-testid={`btn-inc-${item.productId}`}
                      onClick={() => updateQty(item.productId, 1)}
                      className="w-7 h-7 rounded-full bg-muted hover:bg-accent hover:text-background font-bold text-sm flex items-center justify-center transition-colors"
                    >
                      +
                    </button>
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
            disabled={cart.length === 0 || createOrder.isPending}
            onClick={placeOrder}
            className="w-full py-3 bg-primary text-white font-heading text-lg rounded-xl border-4 border-primary hover:bg-transparent hover:text-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {createOrder.isPending ? "Placing..." : "Place Order"}
          </button>
        </div>
      </div>
    </div>
  );
}
