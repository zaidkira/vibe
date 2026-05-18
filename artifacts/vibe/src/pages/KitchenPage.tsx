import { motion, AnimatePresence } from "framer-motion";
import { useListOrders, useUpdateOrderStatus, getListOrdersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function KitchenPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: orders, isLoading } = useListOrders(
    {},
    { query: { queryKey: getListOrdersQueryKey(), refetchInterval: 10000 } }
  );

  const updateStatus = useUpdateOrderStatus();

  const pending = (orders ?? []).filter((o) => o.status === "pending");
  const done = (orders ?? []).filter((o) => o.status === "done");

  function markDone(id: number) {
    updateStatus.mutate(
      { id, data: { status: "done" } },
      {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() }); toast({ title: "Order marked done!" }); },
        onError: () => toast({ title: "Error", description: "Could not update order.", variant: "destructive" }),
      }
    );
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto pb-20">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-4xl md:text-5xl text-accent">Kitchen</h1>
          <p className="text-muted-foreground text-xs uppercase tracking-widest">Live feed — refreshes every 10s</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-card border-2 border-primary rounded-xl px-4 py-2 text-center">
            <p className="font-heading text-2xl md:text-3xl text-primary">{pending.length}</p>
            <p className="text-xs text-muted-foreground uppercase">Pending</p>
          </div>
          <div className="bg-card border-2 border-accent rounded-xl px-4 py-2 text-center">
            <p className="font-heading text-2xl md:text-3xl text-accent">{done.length}</p>
            <p className="text-xs text-muted-foreground uppercase">Done</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : pending.length === 0 && done.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="font-heading text-3xl">All quiet</p>
          <p className="text-sm mt-2">No orders yet — waiting for customers</p>
        </div>
      ) : (
        <div className="space-y-8">
          {pending.length > 0 && (
            <section>
              <h2 className="font-heading text-xl md:text-2xl text-primary mb-4 flex items-center gap-3">
                <span className="inline-block w-3 h-3 rounded-full bg-primary animate-pulse" />
                Pending
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {pending.map((order) => (
                    <motion.div
                      key={order.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      data-testid={`card-order-${order.id}`}
                      className="bg-card border-2 border-primary rounded-xl p-4 flex flex-col gap-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-heading text-2xl text-primary">#{order.orderNumber}</p>
                          <p className="text-xs text-muted-foreground">{formatTime(order.createdAt)}</p>
                        </div>
                        <span className="px-3 py-1 bg-primary/20 text-primary border border-primary rounded-full text-xs font-bold uppercase animate-pulse">Pending</span>
                      </div>
                      <div className="space-y-1 flex-1">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-foreground font-bold">{item.productName}</span>
                            <span className="text-accent font-bold">x{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center border-t border-border pt-3">
                        <span className="text-muted-foreground text-xs">${order.totalAmount.toFixed(2)}</span>
                        <button
                          data-testid={`btn-done-${order.id}`}
                          onClick={() => markDone(order.id)}
                          disabled={updateStatus.isPending}
                          className="px-4 py-2 bg-accent text-background font-heading text-sm rounded-lg hover:bg-accent/80 transition-all disabled:opacity-40"
                        >
                          Mark Done
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}

          {done.length > 0 && (
            <section>
              <h2 className="font-heading text-xl md:text-2xl text-muted-foreground mb-4 flex items-center gap-3">
                <span className="inline-block w-3 h-3 rounded-full bg-accent" />
                Done
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {done.map((order) => (
                  <div
                    key={order.id}
                    data-testid={`card-done-${order.id}`}
                    className="bg-card/50 border border-border rounded-xl p-3 opacity-60"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-heading text-xl text-muted-foreground">#{order.orderNumber}</p>
                      <span className="px-2 py-0.5 bg-accent/20 text-accent rounded-full text-xs font-bold uppercase">Done</span>
                    </div>
                    <div className="space-y-1">
                      {order.items.map((item, i) => (
                        <p key={i} className="text-xs text-muted-foreground">{item.productName} x{item.quantity}</p>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{formatTime(order.createdAt)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
