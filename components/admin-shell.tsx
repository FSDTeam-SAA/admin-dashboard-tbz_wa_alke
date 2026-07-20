"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Bell,
  BookCopy,
  CreditCard,
  Grid2X2,
  LogOut,
  Menu,
  Radio,
  RefreshCcw,
  Settings,
  UserRoundCog,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { avatar } from "@/lib/mock-data";
import { authApi } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: Grid2X2 },
  { href: "/users", label: "User List", icon: Users },
  { href: "/instructors", label: "Instructor List", icon: UserRoundCog },
  { href: "/submissions", label: "User Submission", icon: UserRoundCog },
  { href: "/groups", label: "Class & Group\nManagement", icon: Users },
  { href: "/live-classes", label: "Live Classes", icon: Radio },
  { href: "/payments", label: "Payments &\nSubscriptions", icon: CreditCard },
  { href: "/wallet", label: "Wallet Management", icon: WalletCards },
  { href: "/referrals", label: "Referral System", icon: RefreshCcw },
  { href: "/content", label: "Content\nManagement", icon: BookCopy },
  { href: "/settings", label: "Settings", icon: Settings },
];

function Logo() {
  return (
    <div className="flex px-4 pt-5">
      <Image
        src="/brand/tbz-logo-full.png"
        alt="Talk BZ"
        width={95}
        height={53}
        priority
        className="mx-auto h-auto w-[95px]"
      />
    </div>
  );
}

function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await authApi.logout().catch(() => null);
      await signOut({ callbackUrl: "/auth/login" });
    } catch {
      toast.error("Logout failed");
    }
  };

  return (
    <aside className="flex h-full w-[240px] max-w-full shrink-0 flex-col bg-gradient-to-b from-fuchsia-600 to-violet-800 text-white">
      <Logo />
      <nav className="mt-7 flex flex-1 flex-col gap-2 px-4">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex min-h-12 items-center gap-3 rounded-[8px] px-4 text-base font-semibold transition",
                active ? "bg-white text-fuchsia-700" : "text-white hover:bg-white/10",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="whitespace-pre-line leading-5">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <button
        onClick={() => setLogoutOpen(true)}
        className="mx-4 mb-7 flex h-12 items-center gap-3 rounded-[8px] px-4 text-left text-base font-semibold hover:bg-white/10"
      >
        <LogOut className="h-5 w-5" />
        Logout
      </button>
      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Logout</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm text-slate-600">Are you sure you want to logout?</p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setLogoutOpen(false)}>
                No
              </Button>
              <Button onClick={handleLogout}>Yes</Button>
            </div>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </aside>
  );
}

function Topbar({ onMenu }: { onMenu: () => void }) {
  const { data: session } = useSession();
  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between bg-gradient-to-r from-fuchsia-600 to-violet-900 px-4 text-white md:justify-end md:px-6">
      <button className="rounded-md p-2 md:hidden" onClick={onMenu} aria-label="Open menu">
        <Menu className="h-6 w-6" />
      </button>
      <div className="flex min-w-0 items-center gap-3 sm:gap-5">
        <div className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-orange-400" />
        </div>
        <span className="hidden max-w-[160px] truncate text-sm font-semibold sm:inline">{session?.user?.name ?? "Mr. Raja"}</span>
        <Avatar className="h-8 w-8">
          <AvatarImage src={session?.user?.image ?? avatar} />
          <AvatarFallback>MR</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      <div className="fixed inset-y-0 left-0 z-40 hidden md:block">
        <Sidebar />
      </div>
      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} aria-label="Close menu" />
          <div className="relative h-full w-[min(260px,85vw)]">
            <button className="absolute right-3 top-3 z-10 rounded-md p-2 text-white" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
            </button>
            <Sidebar onClose={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
      <div className="md:pl-[240px]">
        <Topbar onMenu={() => setOpen(true)} />
        <main className="min-h-[calc(100vh-60px)] overflow-x-hidden px-4 py-6 sm:px-8 sm:py-7 lg:px-[50px]">{children}</main>
      </div>
    </div>
  );
}
