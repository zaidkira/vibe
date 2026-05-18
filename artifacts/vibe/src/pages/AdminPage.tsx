import { useState, useRef } from "react";
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

function ImageUploader({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploadMode, setUploadMode] = useState<"file" | "url">("file");

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === "string") onChange(result);
    };
    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setUploadMode("file")}
          className={`px-3 py-1 text-xs rounded-lg border-2 transition-all font-bold ${uploadMode === "file" ? "bg-primary border-primary text-white" : "border-border text-muted-foreground hover:border-primary"}`}
        >
          Upload from PC
        </button>
        <button
          type="button"
          onClick={() => setUploadMode("url")}
          className={`px-3 py-1 text-xs rounded-lg border-2 transition-all font-bold ${uploadMode === "url" ? "bg-primary border-primary text-white" : "border-border text-muted-foreground hover:border-primary"}`}
        >
          Paste URL
        </button>
      </div>

      {uploadMode === "file" ? (
        <div
          data-testid="upload-dropzone"
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${dragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/60"}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            data-testid="input-file-upload"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          {value && (value.startsWith("data:") || value.startsWith("http")) ? (
            <div className="flex flex-col items-center gap-2">
              <img src={value} alt="Preview" className="w-24 h-24 object-cover rounded-lg border-2 border-primary mx-auto" />
              <p className="text-xs text-muted-foreground">Click or drag to replace</p>
            </div>
          ) : (
            <div className="py-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm font-bold text-foreground">Drag photo here or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP, GIF supported</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Input
            data-testid="input-product-image-url"
            value={value.startsWith("data:") ? "" : value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://example.com/photo.jpg"
            className="bg-background border-border"
          />
          {value && !value.startsWith("data:") && value.startsWith("http") && (
            <img src={value} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-border" />
          )}
        </div>
      )}
    </div>
  );
}

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
          onSuccess: () => { invalidateAll(); setDialogOpen(false); toast({ title: "Product updated!" }); },
          onError: () => toast({ title: "Error", description: "Could not update product.", variant: "destructive" }),
        }
      );
    } else {
      createProduct.mutate(
        { data },
        {
          onSuccess: () => { invalidateAll(); setDialogOpen(false); toast({ title: "Product created!" }); },
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
        onSuccess: () => { invalidateAll(); toast({ title: "Product deleted." }); },
        onError: () => toast({ title: "Error", description: "Could not delete product.", variant: "destructive" }),
      }
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="font-heading text-4xl md:text-5xl text-secondary">Admin</h1>
        <p className="text-muted-foreground text-xs uppercase tracking-widest">Manage your menu and track performance</p>
      </div>

      {/* Dashboard summary */}
      <section>
        <h2 className="font-heading text-xl md:text-2xl mb-4">Today</h2>
        {summaryLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Sales Today", value: `$${(summary?.totalSalesToday ?? 0).toFixed(2)}`, color: "text-primary" },
              { label: "Orders Today", value: summary?.totalOrdersToday ?? 0, color: "text-accent" },
              { label: "All Time", value: summary?.totalOrdersAllTime ?? 0, color: "text-secondary" },
              { label: "Best Seller", value: summary?.bestSellingItem ?? "—", color: "text-foreground" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                data-testid={`stat-${stat.label.toLowerCase().replace(/\s/g, "-")}`}
                className="bg-card border-2 border-border rounded-xl p-3 md:p-4"
              >
                <p className="text-xs text-muted-foreground uppercase mb-1 leading-tight">{stat.label}</p>
                <p className={`font-heading text-xl md:text-2xl truncate ${stat.color}`}>{stat.value}</p>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Top products */}
      {!topLoading && topProducts && topProducts.length > 0 && (
        <section>
          <h2 className="font-heading text-xl md:text-2xl mb-4">Top Sellers</h2>
          <div className="space-y-2">
            {topProducts.slice(0, 5).map((p, i) => (
              <div
                key={p.productId}
                data-testid={`top-product-${p.productId}`}
                className="flex items-center gap-3 bg-card border border-border rounded-xl px-3 md:px-4 py-3"
              >
                <span className="font-heading text-lg md:text-xl text-muted-foreground w-5 shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{p.productName}</p>
                  <p className="text-xs text-muted-foreground">${p.totalRevenue.toFixed(2)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-heading text-lg text-accent">{p.totalQuantity}</p>
                  <p className="text-xs text-muted-foreground">sold</p>
                </div>
                <div
                  className="h-2 rounded-full bg-primary hidden sm:block"
                  style={{ width: `${Math.min(100, (p.totalQuantity / (topProducts[0]?.totalQuantity ?? 1)) * 80)}px` }}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Products CRUD */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl md:text-2xl">Menu Items</h2>
          <button
            data-testid="btn-add-product"
            onClick={openCreate}
            className="px-4 py-2 bg-primary text-white font-heading text-sm rounded-xl border-2 border-primary hover:bg-transparent hover:text-primary transition-all"
          >
            Add Item
          </button>
        </div>

        {productsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        ) : (
          /* Mobile: card list | Desktop: table */
          <>
            {/* Mobile card view */}
            <div className="md:hidden space-y-3">
              {(products ?? []).length === 0 ? (
                <div className="text-center py-10 text-muted-foreground bg-card border border-border rounded-xl">
                  <p className="font-heading text-lg">No products yet</p>
                  <p className="text-sm mt-1">Tap "Add Item" to get started</p>
                </div>
              ) : (
                (products ?? []).map((p) => (
                  <div key={p.id} data-testid={`card-product-mobile-${p.id}`} className="bg-card border border-border rounded-xl p-3 flex gap-3">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-14 h-14 object-cover rounded-lg border border-border shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-lg border border-border bg-muted shrink-0 flex items-center justify-center">
                        <span className="text-muted-foreground text-xs">No img</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.category}</p>
                      <p className="text-primary font-heading">${Number(p.price).toFixed(2)}</p>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        data-testid={`btn-edit-${p.id}`}
                        onClick={() => openEdit({ ...p, price: Number(p.price) })}
                        className="px-3 py-1 text-xs border border-border rounded-lg hover:border-primary hover:text-primary transition-colors"
                      >Edit</button>
                      <button
                        data-testid={`btn-delete-${p.id}`}
                        onClick={() => handleDelete(p.id)}
                        className="px-3 py-1 text-xs border border-border rounded-lg hover:border-destructive hover:text-destructive transition-colors"
                      >Del</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block overflow-auto rounded-xl border-2 border-border">
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
                      <td colSpan={5} className="text-center py-12 text-muted-foreground">No products yet. Add your first menu item.</td>
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
                            <button data-testid={`btn-edit-${p.id}`} onClick={() => openEdit({ ...p, price: Number(p.price) })} className="px-3 py-1 text-xs border border-border rounded-lg hover:border-primary hover:text-primary transition-colors">Edit</button>
                            <button data-testid={`btn-delete-${p.id}`} onClick={() => handleDelete(p.id)} className="px-3 py-1 text-xs border border-border rounded-lg hover:border-destructive hover:text-destructive transition-colors">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* Product dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-2 border-primary max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl text-primary">
              {editingId !== null ? "Edit Item" : "New Item"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-1">
            <div>
              <Label className="text-xs uppercase text-muted-foreground mb-1 block">Photo</Label>
              <ImageUploader value={form.imageUrl} onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))} />
            </div>
            <div>
              <Label className="text-xs uppercase text-muted-foreground mb-1 block">Name</Label>
              <Input data-testid="input-product-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Matcha Latte" className="bg-background border-border" />
            </div>
            <div>
              <Label className="text-xs uppercase text-muted-foreground mb-1 block">Category</Label>
              <Input data-testid="input-product-category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="e.g. Drinks" className="bg-background border-border" />
            </div>
            <div>
              <Label className="text-xs uppercase text-muted-foreground mb-1 block">Price ($)</Label>
              <Input data-testid="input-product-price" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="0.00" className="bg-background border-border" />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <button onClick={() => setDialogOpen(false)} className="px-4 py-2 text-sm border border-border rounded-lg hover:border-primary transition-colors">Cancel</button>
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
