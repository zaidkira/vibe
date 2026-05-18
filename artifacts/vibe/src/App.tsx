import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import OrderPage from "@/pages/OrderPage";
import KitchenPage from "@/pages/KitchenPage";
import AdminPage from "@/pages/AdminPage";

const queryClient = new QueryClient();

function Navbar() {
  const [location] = useLocation();
  return (
    <nav className="sticky top-0 z-50 w-full border-b-4 border-primary bg-background/95 backdrop-blur">
      <div className="container mx-auto px-3 md:px-4 h-16 md:h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 md:gap-3">
          <img
            src="/vibe-logo.jpeg"
            alt="VIBE Logo"
            className="w-9 h-9 md:w-12 md:h-12 rounded-lg border-2 border-primary object-cover"
          />
          <span className="font-heading text-xl md:text-2xl tracking-tight text-primary">VIBE</span>
        </Link>
        <div className="flex items-center gap-1 md:gap-2">
          <Link
            href="/"
            data-testid="nav-order"
            className={`px-3 md:px-5 py-1.5 md:py-2 font-heading text-xs md:text-sm rounded-xl border-2 transition-all ${
              location === "/" ? "bg-primary border-primary text-white" : "border-border text-muted-foreground hover:border-primary hover:text-primary"
            }`}
          >
            Order
          </Link>
          <Link
            href="/kitchen"
            data-testid="nav-kitchen"
            className={`px-3 md:px-5 py-1.5 md:py-2 font-heading text-xs md:text-sm rounded-xl border-2 transition-all ${
              location === "/kitchen" ? "bg-accent border-accent text-background" : "border-border text-muted-foreground hover:border-accent hover:text-accent"
            }`}
          >
            Kitchen
          </Link>
          <Link
            href="/admin"
            data-testid="nav-admin"
            className={`px-3 md:px-5 py-1.5 md:py-2 font-heading text-xs md:text-sm rounded-xl border-2 transition-all ${
              location === "/admin" ? "bg-secondary border-secondary text-white" : "border-border text-muted-foreground hover:border-secondary hover:text-secondary"
            }`}
          >
            Admin
          </Link>
        </div>
      </div>
    </nav>
  );
}

function AppRouter() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground dark">
      <Navbar />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={OrderPage} />
          <Route path="/kitchen" component={KitchenPage} />
          <Route path="/admin" component={AdminPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppRouter />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
