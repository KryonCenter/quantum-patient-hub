import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { clearDoctorCache } from "@/lib/api";

export type Role = "admin" | "doctor" | "user";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  role: Role | null;
  isAdmin: boolean;
  isDoctor: boolean;
  fullName: string;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDoctor, setIsDoctor] = useState(false);
  const [fullName, setFullName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const loadRoleAndProfile = async (uid: string) => {
    const [{ data: roles }, { data: profile }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", uid),
      supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", uid)
        .maybeSingle(),
    ]);
    const all = (roles ?? []).map((r) => r.role as string);
    const adm = all.includes("admin");
    const doc = all.includes("doctor");
    setIsAdmin(adm);
    setIsDoctor(doc);
    setRole(adm ? "admin" : doc ? "doctor" : "user");
    setFullName(profile?.full_name || profile?.email || "");
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          setTimeout(() => loadRoleAndProfile(newSession.user.id), 0);
        } else {
          setRole(null);
          setIsAdmin(false);
          setIsDoctor(false);
          setFullName("");
          clearDoctorCache();
        }
      },
    );

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        loadRoleAndProfile(s.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    clearDoctorCache();
    await supabase.auth.signOut();
  };

  const refreshRole = async () => {
    if (user) await loadRoleAndProfile(user.id);
  };

  return (
    <AuthContext.Provider
      value={{ session, user, role, isAdmin, isDoctor, fullName, loading, signOut, refreshRole }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
