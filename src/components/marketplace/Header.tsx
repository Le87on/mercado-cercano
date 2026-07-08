import { Link, useRouterState } from "@tanstack/react-router";
import { ShoppingCart, Store, Home, LogIn, LogOut, User as UserIcon } from "lucide-react";
import { useCart } from "@/lib/marketplace-store";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { cart } = useCart();
  const { user, signOut } = useAuth();
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
      <span className="hidden sm:inline">{label}</span>
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
            <div className="truncate text-base font-bold leading-tight text-foreground">
              MercadoCercano
            </div>
            <div className="hidden text-[11px] leading-tight text-muted-foreground sm:block">
              Marketplace local argentino
            </div>
          </div>
        </Link>
        <nav className="flex items-center gap-1">
          <NavLink to="/" icon={Home} label="Comprar" />
          <NavLink to="/vender" icon={Store} label="Vender" />
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
            <span className="hidden sm:inline">Carrito</span>
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[11px] font-bold text-brand-foreground">
                {count}
              </span>
            )}
          </Link>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-brand hover:bg-brand/20">
                <UserIcon className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
                  {user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/vender">Mis publicaciones</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              to="/auth"
              className="ml-1 inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/90"
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Ingresar</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
