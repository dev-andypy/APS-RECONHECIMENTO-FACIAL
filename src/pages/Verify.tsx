import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import FaceCamera from "@/components/FaceCamera";
import { ShieldAlert, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import * as faceapi from "@vladmandic/face-api";

const Verify = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    accessLevel?: number;
    name?: string;
  } | null>(null);

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

  const handleFaceDetected = async (descriptor: Float32Array) => {
    if (!isVerifying || isProcessing) return;
    
    setIsProcessing(true);
    setIsVerifying(false);

    try {
      // Buscar registros faciais do usuário
      const { data: registrations, error } = await supabase
        .from("face_registrations")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;

      if (!registrations || registrations.length === 0) {
        toast.error("Nenhum registro facial encontrado. Faça o cadastro primeiro.");
        setVerificationResult({ success: false });
        setIsVerifying(false);
        return;
      }

      // Verificar correspondência facial
      const registration = registrations[0];
      const descriptorArray = Array.isArray(registration.face_descriptor) 
        ? registration.face_descriptor 
        : Object.values(registration.face_descriptor);
      const storedDescriptor = new Float32Array(descriptorArray);
      const distance = faceapi.euclideanDistance(descriptor, storedDescriptor);

      // Threshold de 0.6 é considerado uma boa correspondência
      const isMatch = distance < 0.6;

      if (isMatch) {
        // Registrar log de acesso bem-sucedido
        await supabase.from("access_logs").insert({
          user_id: user.id,
          access_level: registration.access_level,
          access_granted: true,
        });

        setVerificationResult({
          success: true,
          accessLevel: registration.access_level,
          name: registration.name,
        });
        toast.success("Acesso concedido!");
      } else {
        // Registrar log de acesso negado
        await supabase.from("access_logs").insert({
          user_id: user.id,
          access_level: 0,
          access_granted: false,
        });

        setVerificationResult({ success: false });
        toast.error("Rosto não reconhecido. Acesso negado.");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao verificar rosto");
      setVerificationResult({ success: false });
    } finally {
      setIsProcessing(false);
    }
  };

  const getAccessLevelLabel = (level: number) => {
    switch (level) {
      case 1:
        return "Nível 1 - Acesso Geral";
      case 2:
        return "Nível 2 - Diretores";
      case 3:
        return "Nível 3 - Ministro";
      default:
        return "Nível Desconhecido";
    }
  };

  const resetVerification = () => {
    setVerificationResult(null);
    setIsProcessing(false);
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
            <div className="mx-auto bg-gradient-to-br from-secondary to-secondary/80 p-4 rounded-full w-16 h-16 flex items-center justify-center shadow-md">
              <ShieldAlert className="w-8 h-8 text-secondary-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold">Verificação de Acesso</CardTitle>
            <CardDescription>
              Posicione seu rosto na câmera para verificar suas permissões de acesso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <FaceCamera onFaceDetected={handleFaceDetected} isCapturing={isVerifying} />
                
                {!verificationResult ? (
                  <Button
                    variant="access"
                    className="w-full"
                    onClick={() => setIsVerifying(true)}
                    disabled={isVerifying || isProcessing}
                  >
                    {isVerifying || isProcessing ? "Verificando..." : "Iniciar Verificação"}
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" onClick={resetVerification}>
                    Nova Verificação
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-center">
                {verificationResult === null ? (
                  <div className="text-center text-muted-foreground">
                    <ShieldAlert className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Aguardando verificação...</p>
                  </div>
                ) : verificationResult.success ? (
                  <Card className="w-full border-2 border-primary shadow-md">
                    <CardContent className="pt-6 text-center space-y-4">
                      <CheckCircle2 className="w-16 h-16 mx-auto text-primary" />
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold text-primary">Acesso Concedido</h3>
                        <p className="text-lg font-semibold">{verificationResult.name}</p>
                        <div className="bg-primary/10 px-4 py-2 rounded-lg">
                          <p className="text-sm font-medium text-primary">
                            {getAccessLevelLabel(verificationResult.accessLevel!)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="w-full border-2 border-destructive shadow-md">
                    <CardContent className="pt-6 text-center space-y-4">
                      <XCircle className="w-16 h-16 mx-auto text-destructive" />
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold text-destructive">Acesso Negado</h3>
                        <p className="text-sm text-muted-foreground">
                          Rosto não reconhecido no sistema
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Verify;
