import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import FaceCamera from "@/components/FaceCamera";
import { ShieldCheck, ArrowLeft } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState<Float32Array | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    accessLevel: "1",
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleFaceDetected = (descriptor: Float32Array) => {
    if (isCapturing) {
      setFaceDescriptor(descriptor);
      setIsCapturing(false);
      toast.success("Rosto capturado com sucesso!");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!faceDescriptor) {
      toast.error("Por favor, capture seu rosto antes de continuar");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("face_registrations")
        .upsert({
          user_id: user.id,
          name: formData.name,
          access_level: parseInt(formData.accessLevel),
          face_descriptor: Array.from(faceDescriptor),
        });

      if (error) throw error;

      toast.success("Cadastro facial realizado com sucesso!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Erro ao realizar cadastro");
    } finally {
      setLoading(false);
    }
  };

  const getAccessLevelDescription = (level: string) => {
    switch (level) {
      case "1":
        return "Permissões Gerais - Acesso básico ao sistema";
      case "2":
        return "Diretores de Divisões - Acesso restrito a áreas específicas";
      case "3":
        return "Ministro - Acesso exclusivo de alto nível";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen p-4" style={{ background: "var(--gradient-hero)" }}>
      <div className="max-w-4xl mx-auto space-y-4">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Card className="shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto bg-gradient-to-br from-primary to-accent p-4 rounded-full w-16 h-16 flex items-center justify-center shadow-md">
              <ShieldCheck className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold">Cadastro Biométrico Facial</CardTitle>
            <CardDescription>
              Registre seu rosto para acessar os níveis de segurança do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Digite seu nome completo"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accessLevel">Nível de Acesso</Label>
                    <Select
                      value={formData.accessLevel}
                      onValueChange={(value) => setFormData({ ...formData, accessLevel: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o nível" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Nível 1 - Acesso Geral</SelectItem>
                        <SelectItem value="2">Nível 2 - Diretores</SelectItem>
                        <SelectItem value="3">Nível 3 - Ministro</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      {getAccessLevelDescription(formData.accessLevel)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant={faceDescriptor ? "secondary" : "access"}
                      className="w-full"
                      onClick={() => setIsCapturing(true)}
                      disabled={isCapturing}
                    >
                      {faceDescriptor ? "✓ Rosto Capturado" : isCapturing ? "Capturando..." : "Capturar Rosto"}
                    </Button>
                  </div>
                </div>

                <div>
                  <FaceCamera onFaceDetected={handleFaceDetected} isCapturing={isCapturing} />
                </div>
              </div>

              <Button type="submit" variant="security" className="w-full" disabled={loading || !faceDescriptor}>
                {loading ? "Processando..." : "Finalizar Cadastro"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
