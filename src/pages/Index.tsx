import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, UserPlus, ScanFace, LogOut, Lock } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [registration, setRegistration] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      
      if (session?.user) {
        const { data } = await supabase
          .from("face_registrations")
          .select("*")
          .eq("user_id", session.user.id)
          .maybeSingle();
        setRegistration(data);
      }
      
      setLoading(false);
    };
    
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        supabase
          .from("face_registrations")
          .select("*")
          .eq("user_id", session.user.id)
          .maybeSingle()
          .then(({ data }) => setRegistration(data));
      } else {
        setRegistration(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado com sucesso");
  };

  const getAccessLevelBadge = (level: number) => {
    const badges = {
      1: { label: "Nível 1", color: "bg-accent text-accent-foreground" },
      2: { label: "Nível 2", color: "bg-secondary text-secondary-foreground" },
      3: { label: "Nível 3", color: "bg-primary text-primary-foreground" },
    };
    return badges[level as keyof typeof badges] || badges[1];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--gradient-hero)" }}>
        <p className="text-lg">Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: "var(--gradient-hero)" }}>
        <Card className="w-full max-w-2xl shadow-lg text-center">
          <CardHeader className="space-y-4">
            <div className="mx-auto bg-gradient-to-br from-primary to-accent p-6 rounded-full w-24 h-24 flex items-center justify-center shadow-md">
              <Shield className="w-12 h-12 text-primary-foreground" />
            </div>
            <CardTitle className="text-3xl font-bold">
              Sistema de Reconhecimento Facial
            </CardTitle>
            <CardDescription className="text-lg">
              Ministério do Meio Ambiente - Controle de Acesso por Biometria
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pb-8">
            <div className="grid gap-4 text-left">
              <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                <Lock className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold">Nível 1 - Acesso Geral</h3>
                  <p className="text-sm text-muted-foreground">Permissões básicas do sistema</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                <Lock className="w-6 h-6 text-secondary mt-1" />
                <div>
                  <h3 className="font-semibold">Nível 2 - Diretores de Divisões</h3>
                  <p className="text-sm text-muted-foreground">Acesso restrito a áreas específicas</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                <Lock className="w-6 h-6 text-accent mt-1" />
                <div>
                  <h3 className="font-semibold">Nível 3 - Ministro</h3>
                  <p className="text-sm text-muted-foreground">Acesso exclusivo de alto nível</p>
                </div>
              </div>
            </div>
            <Button variant="security" size="lg" className="w-full" onClick={() => navigate("/auth")}>
              Acessar Sistema
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4" style={{ background: "var(--gradient-hero)" }}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Painel de Controle</h1>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>

        {registration && (
          <Card className="shadow-md border-2 border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Cadastro Ativo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Nome:</span>
                <span>{registration.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Nível de Acesso:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getAccessLevelBadge(registration.access_level).color}`}>
                  {getAccessLevelBadge(registration.access_level).label}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/register")}>
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto bg-gradient-to-br from-primary to-accent p-4 rounded-full w-16 h-16 flex items-center justify-center shadow-md">
                <UserPlus className="w-8 h-8 text-primary-foreground" />
              </div>
              <CardTitle>Cadastrar Rosto</CardTitle>
              <CardDescription>
                {registration ? "Atualizar seu cadastro facial" : "Registre seu rosto no sistema"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="security" className="w-full">
                {registration ? "Atualizar Cadastro" : "Iniciar Cadastro"}
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/verify")}>
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto bg-gradient-to-br from-secondary to-secondary/80 p-4 rounded-full w-16 h-16 flex items-center justify-center shadow-md">
                <ScanFace className="w-8 h-8 text-secondary-foreground" />
              </div>
              <CardTitle>Verificar Acesso</CardTitle>
              <CardDescription>
                Valide seu nível de acesso através do reconhecimento facial
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="access" className="w-full" disabled={!registration}>
                {registration ? "Verificar Agora" : "Cadastro Necessário"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
