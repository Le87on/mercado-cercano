import { Link, useRouterState } from "@tanstack/react-router";
import { ClipboardList, Home, ShieldCheck, ShoppingCart, Store, UserRound } from "lucide-react";
import { useCart } from "@/lib/marketplace-store";
import { cn } from "@/lib/utils";

export function Header() {
  const { cart } = useCart();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const count = cart.reduce((a, b) => a + b.qty, 0);

  const NavLink = ({
    to,
    icon: Icon,
    label,
  }: {
    to: string;
    icon: typeof Home;
    label: string;
  }) => (
    <Link
      to={to}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        pathname === to
          ? "bg-brand/10 text-brand"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden lg:inline">{label}</span>
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand text-brand-foreground shadow-sm">
            <Store className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-base font-bold leading-tight text-foreground">A la Vuelta</div>
            <div className="hidden text-[11px] leading-tight text-muted-foreground sm:block">
              Comercios cerca de casa
            </div>
          </div>
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto">
          <NavLink to="/" icon={Home} label="Comprar" />
          <NavLink to="/pedidos" icon={ClipboardList} label="Pedidos" />
          <NavLink to="/comercio" icon={Store} label="Comercio" />
          <NavLink to="/admin" icon={ShieldCheck} label="Admin" />
          <NavLink to="/perfil" icon={UserRound} label="Perfil" />
          <Link
            to="/carrito"
            className={cn(
              "relative inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              pathname === "/carrito"
                ? "bg-brand/10 text-brand"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden lg:inline">Guardados</span>
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[11px] font-bold text-brand-foreground">
                {count}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
