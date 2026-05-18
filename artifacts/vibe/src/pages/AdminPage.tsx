import { useState } from "react";
import { motion } from "framer-motion";
import {
  useGetDashboardSummary,
  useGetTopProducts,
  useListProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  getListProductsQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetTopProductsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProductFormData = {
  name: string;
  price: string;
  category: string;
  imageUrl: string;
};

const emptyForm: ProductFormData = { name: "", price: "", category: "", imageUrl: "" };

export default function AdminPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary();
  const { data: topProducts, isLoading: topLoading } = useGetTopProducts();
  const { data: products, isLoading: productsLoading } = useListProducts();

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductFormData>(emptyForm);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(p: { id: number; name: string; price: number; category: string; imageUrl?: string | null }) {
    setEditingId(p.id);
    setForm({ name: p.name, price: String(p.price), category: p.category, imageUrl: p.imageUrl ?? "" });
    setDialogOpen(true);
  }

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetTopProductsQueryKey() });
  }

  function handleSubmit() {
    const price = parseFloat(form.price);
    if (!form.name.trim() || isNaN(price) || !form.category.trim()) {
      toast({ title: "Invalid input", description: "Name, price, and category are required.", variant: "destructive" });
      return;
    }
    const data = { name: form.name, price, category: form.category, imageUrl: form.imageUrl || undefined };

    if (editingId !== null) {
      updateProduct.mutate(
        { id: editingId, data },
        {
          onSuccess: () => {
            invalidateAll();
            setDialogOpen(false);
            toast({ title: "Product updated!" });
          },
          onError: () => toast({ title: "Error", description: "Could not update product.", variant: "destructive" }),
        }
      );
    } else {
      createProduct.mutate(
        { data },
        {
          onSuccess: () => {
            invalidateAll();
            setDialogOpen(false);
            toast({ title: "Product created!" });
          },
          onError: () => toast({ title: "Error", description: "Could not create product.", variant: "destructive" }),
        }
      );
    }
  }

  function handleDelete(id: number) {
    if (!confirm("Delete this product?")) return;
    deleteProduct.mutate(
      { id },
      {
        onSuccess: () => {
          invalidateAll();
          toast({ title: "Product deleted." });
        },
        onError: () => toast({ title: "Error", description: "Could not delete product.", variant: "destructive" }),
      }
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="font-heading text-5xl text-secondary">Admin</h1>
        <p className="text-muted-foreground text-sm uppercase tracking-widest">Manage your menu and track performance</p>
      </div>

      {/* Dashboard summary */}
      <section>
        <h2 className="font-heading text-2xl mb-4">Today</h2>
        {summaryLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Sales Today", value: `$${(summary?.totalSalesToday ?? 0).toFixed(2)}`, color: "text-primary" },
              { label: "Orders Today", value: summary?.totalOrdersToday ?? 0, color: "text-accent" },
              { label: "All Time Orders", value: summary?.totalOrdersAllTime ?? 0, color: "text-secondary" },
              { label: "Best Seller", value: summary?.bestSellingItem ?? "—", color: "text-foreground" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                data-testid={`stat-${stat.label.toLowerCase().replace(/\s/g, "-")}`}
                className="bg-card border-2 border-border rounded-xl p-4"
              >
                <p className="text-xs text-muted-foreground uppercase mb-1">{stat.label}</p>
                <p className={`font-heading text-2xl truncate ${stat.color}`}>{stat.value}</p>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Top products */}
      {!topLoading && topProducts && topProducts.length > 0 && (
        <section>
          <h2 className="font-heading text-2xl mb-4">Top Sellers</h2>
          <div className="space-y-2">
            {topProducts.slice(0, 5).map((p, i) => (
              <div
                key={p.productId}
                data-testid={`top-product-${p.productId}`}
                className="flex items-center gap-4 bg-card border border-border rounded-xl px-4 py-3"
              >
                <span className="font-heading text-xl text-muted-foreground w-6">{i + 1}</span>
                <div className="flex-1">
                  <p className="font-bold text-sm">{p.productName}</p>
                  <p className="text-xs text-muted-foreground">${p.totalRevenue.toFixed(2)} total revenue</p>
                </div>
                <div className="text-right">
                  <p className="font-heading text-lg text-accent">{p.totalQuantity}</p>
                  <p className="text-xs text-muted-foreground">sold</p>
                </div>
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${Math.min(100, (p.totalQuantity / (topProducts[0]?.totalQuantity ?? 1)) * 120)}px` }}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Products CRUD */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-2xl">Menu Items</h2>
          <button
            data-testid="btn-add-product"
            onClick={openCreate}
            className="px-4 py-2 bg-primary text-white font-heading rounded-xl border-2 border-primary hover:bg-transparent hover:text-primary transition-all"
          >
            Add Item
          </button>
        </div>

        {productsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        ) : (
          <div className="overflow-auto rounded-xl border-2 border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left px-4 py-3 font-heading text-xs uppercase text-muted-foreground">Item</th>
                  <th className="text-left px-4 py-3 font-heading text-xs uppercase text-muted-foreground">Category</th>
                  <th className="text-left px-4 py-3 font-heading text-xs uppercase text-muted-foreground">Price</th>
                  <th className="text-left px-4 py-3 font-heading text-xs uppercase text-muted-foreground">Image</th>
                  <th className="text-right px-4 py-3 font-heading text-xs uppercase text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(products ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-muted-foreground">
                      No products yet. Add your first menu item.
                    </td>
                  </tr>
                ) : (
                  (products ?? []).map((p) => (
                    <tr key={p.id} data-testid={`row-product-${p.id}`} className="border-t border-border hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-bold">{p.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.category}</td>
                      <td className="px-4 py-3 text-primary font-bold">${Number(p.price).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} className="w-10 h-10 object-cover rounded-md border border-border" />
                        ) : (
                          <span className="text-muted-foreground text-xs">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            data-testid={`btn-edit-${p.id}`}
                            onClick={() => openEdit({ ...p, price: Number(p.price) })}
                            className="px-3 py-1 text-xs border border-border rounded-lg hover:border-primary hover:text-primary transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            data-testid={`btn-delete-${p.id}`}
                            onClick={() => handleDelete(p.id)}
                            className="px-3 py-1 text-xs border border-border rounded-lg hover:border-destructive hover:text-destructive transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Product dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-2 border-primary">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl text-primary">
              {editingId !== null ? "Edit Item" : "New Item"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs uppercase text-muted-foreground mb-1 block">Name</Label>
              <Input
                data-testid="input-product-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Matcha Latte"
                className="bg-background border-border"
              />
            </div>
            <div>
              <Label className="text-xs uppercase text-muted-foreground mb-1 block">Category</Label>
              <Input
                data-testid="input-product-category"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="e.g. Drinks"
                className="bg-background border-border"
              />
            </div>
            <div>
              <Label className="text-xs uppercase text-muted-foreground mb-1 block">Price ($)</Label>
              <Input
                data-testid="input-product-price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="0.00"
                className="bg-background border-border"
              />
            </div>
            <div>
              <Label className="text-xs uppercase text-muted-foreground mb-1 block">Image URL (optional)</Label>
              <Input
                data-testid="input-product-image"
                value={form.imageUrl}
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                placeholder="https://..."
                className="bg-background border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setDialogOpen(false)}
              className="px-4 py-2 text-sm border border-border rounded-lg hover:border-primary transition-colors"
            >
              Cancel
            </button>
            <button
              data-testid="btn-save-product"
              onClick={handleSubmit}
              disabled={createProduct.isPending || updateProduct.isPending}
              className="px-4 py-2 text-sm bg-primary text-white rounded-lg font-bold hover:bg-primary/80 transition-colors disabled:opacity-40"
            >
              {editingId !== null ? "Save Changes" : "Create Item"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
