import { useRef, useEffect, useState } from "react";
import * as faceapi from "@vladmandic/face-api";
import { Button } from "./ui/button";
import { Camera, CameraOff } from "lucide-react";

interface FaceCameraProps {
  onFaceDetected: (descriptor: Float32Array) => void;
  isCapturing?: boolean;
}

const FaceCamera = ({ onFaceDetected, isCapturing = false }: FaceCameraProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
      } catch (error) {
        console.error("Erro ao carregar modelos:", error);
      }
    };
    loadModels();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: "user"
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraOn(true);
      }
    } catch (error) {
      console.error("Erro ao acessar câmera:", error);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraOn(false);
      setFaceDetected(false);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const detectFace = async () => {
      if (videoRef.current && canvasRef.current && modelsLoaded && isCameraOn) {
        const detections = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (canvasRef.current) {
          const displaySize = { 
            width: videoRef.current.videoWidth, 
            height: videoRef.current.videoHeight 
          };
          faceapi.matchDimensions(canvasRef.current, displaySize);

          const context = canvasRef.current.getContext("2d");
          if (context) {
            context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          }

          if (detections) {
            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);
            setFaceDetected(true);

            if (isCapturing) {
              onFaceDetected(detections.descriptor);
            }
          } else {
            setFaceDetected(false);
          }
        }
      }
    };

    if (isCameraOn && modelsLoaded) {
      interval = setInterval(detectFace, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCameraOn, modelsLoaded, isCapturing, onFaceDetected]);

  return (
    <div className="space-y-4">
      <div className="relative bg-muted rounded-lg overflow-hidden" style={{ aspectRatio: "4/3" }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
          onLoadedMetadata={() => {
            if (canvasRef.current && videoRef.current) {
              canvasRef.current.width = videoRef.current.videoWidth;
              canvasRef.current.height = videoRef.current.videoHeight;
            }
          }}
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full"
        />
        {!isCameraOn && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <CameraOff className="w-16 h-16 text-muted-foreground" />
          </div>
        )}
        {faceDetected && (
          <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium shadow-md">
            Rosto Detectado
          </div>
        )}
      </div>
      <div className="flex gap-2">
        {!isCameraOn ? (
          <Button onClick={startCamera} variant="security" className="flex-1" disabled={!modelsLoaded}>
            <Camera className="w-4 h-4 mr-2" />
            {modelsLoaded ? "Ativar Câmera" : "Carregando modelos..."}
          </Button>
        ) : (
          <Button onClick={stopCamera} variant="destructive" className="flex-1">
            <CameraOff className="w-4 h-4 mr-2" />
            Desativar Câmera
          </Button>
        )}
      </div>
    </div>
  );
};

export default FaceCamera;
