"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Home,
  Plus,
  Settings,
  LogOut,
  Building2,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/use-user";
import { getCommunities } from "@/services/communityService";
import { createClient } from "@/lib/supabase/client";
import type { Community } from "@/lib/types";
import { useRouter } from "next/navigation";

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const [communities, setCommunities] = useState<Community[]>([]);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (user) {
      loadCommunities();
    }
  }, [user]);

  const loadCommunities = async () => {
    if (!user) return;
    try {
      const data = await getCommunities(user.id);
      setCommunities(data);
    } catch (error) {
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
    {
      title: "Discovery",
      href: "/dashboard/discovery",
      icon: Compass,
    },
  ];

  return (
    <div className="flex h-full w-64 flex-col border-r bg-muted/10">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="text-xl font-bold gradient-text">
          Upper Base
        </Link>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {navItems.map((item) => (
            <Button
              key={item.href}
              variant={pathname === item.href ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start",
                pathname === item.href && "bg-secondary"
              )}
              asChild
            >
              <Link href={item.href}>
                <item.icon className="mr-2 h-4 w-4" />
                {item.title}
              </Link>
            </Button>
          ))}
        </div>

        <Separator className="my-4" />

        <div className="space-y-2">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Communities
            </h3>
            <Link href="/dashboard/communities/new">
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Plus className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="space-y-1">
            {communities.map((community) => (
              <Button
                key={community.id}
                variant={
                  pathname.includes(community.id) ? "secondary" : "ghost"
                }
                className="w-full justify-start"
                asChild
              >
                <Link href={`/dashboard/communities/${community.id}`}>
                  <Building2 className="mr-2 h-4 w-4" />
                  <span className="truncate">{community.name}</span>
                </Link>
              </Button>
            ))}

            {communities.length === 0 && (
              <p className="px-2 text-xs text-muted-foreground">
                No communities yet
              </p>
            )}
          </div>
        </div>
      </ScrollArea>

      <div className="border-t p-3 space-y-1">
        <Button
          variant="ghost"
          className="w-full justify-start"
          asChild
        >
          <Link href="/dashboard/settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
