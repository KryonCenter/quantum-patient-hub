import { useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export function NotificationsBell() {
  const { role } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);

  const reload = async () => {
    try { setItems(await fetchNotifications(20)); } catch { /* ignore */ }
  };

  useEffect(() => {
    if (role !== "doctor" && role !== "admin") return;
    reload();
    const t = setInterval(reload, 60_000);
    return () => clearInterval(t);
  }, [role]);

  if (role !== "doctor" && role !== "admin") return null;

  const unread = items.filter((i) => !i.readAt).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs">{unread}</Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b p-3">
          <span className="font-semibold">Notificaciones</span>
          {unread > 0 && (
            <Button variant="ghost" size="sm" onClick={async () => { await markAllNotificationsRead(); reload(); }}>
              <Check className="h-3 w-3 mr-1" /> Marcar todo
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Sin notificaciones</p>
          ) : items.map((n) => (
            <button
              key={n.id}
              onClick={async () => { if (!n.readAt) { await markNotificationRead(n.id); reload(); } }}
              className={`w-full text-left p-3 border-b hover:bg-muted/50 ${!n.readAt ? "bg-primary/5" : ""}`}
            >
              <p className="text-sm font-medium">{n.title}</p>
              {n.body && <p className="text-xs text-muted-foreground mt-1">{n.body}</p>}
              <p className="text-xs text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString()}</p>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
