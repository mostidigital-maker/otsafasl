import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) nav("/admin");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) nav("/admin");
    });
    return () => sub.subscription.unsubscribe();
  }, [nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${window.location.origin}/admin` },
      });
      setLoading(false);
      if (error) return toast({ title: t.auth.errorTitle, description: error.message, variant: "destructive" });
      toast({ title: t.auth.successSignUp });
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return toast({ title: t.auth.errorTitle, description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 font-cairo">
      <form onSubmit={submit} className="w-full max-w-md bg-card rounded-3xl p-8 shadow-card border border-border/50 space-y-5">
        <h1 className="text-2xl font-bold text-center">{t.auth.title}</h1>
        <div className="space-y-2">
          <Label>{t.auth.email}</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" />
        </div>
        <div className="space-y-2">
          <Label>{t.auth.password}</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required dir="ltr" minLength={6} />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t.auth.signingIn : mode === "signin" ? t.auth.signIn : t.auth.signUp}
        </Button>
        <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="w-full text-sm text-muted-foreground hover:text-primary">
          {mode === "signin" ? t.auth.toggleToSignUp : t.auth.toggleToSignIn}
        </button>
      </form>
    </div>
  );
};

export default Auth;
