import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/login", { replace: true });
    else navigate(role === "admin" ? "/admin" : "/dashboard", { replace: true });
  }, [user, role, loading, navigate]);

  return null;
};

export default Index;
