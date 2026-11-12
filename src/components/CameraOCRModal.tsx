import React, { useState, useRef, useEffect } from 'react';
import { Camera, Image as ImageIcon, X, RefreshCw, Check, AlertCircle, Sparkles } from 'lucide-react';
import { createWorker } from 'tesseract.js';
import { Language } from '../types';

interface CameraOCRModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceLang: Language;
  onTextExtracted: (text: string) => void;
  isDark: boolean;
}

export const CameraOCRModal: React.FC<CameraOCRModalProps> = ({
  isOpen,
  onClose,
  sourceLang,
  onTextExtracted,
  isDark,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [extractedText, setExtractedText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLiveCamera, setIsLiveCamera] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  // Reset state when opening/closing
  useEffect(() => {
    if (!isOpen) {
      stopLiveCamera();
      setSelectedImage(null);
      setIsProcessing(false);
      setExtractedText('');
      setErrorMsg(null);
    }
  }, [isOpen]);

  const stopLiveCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsLiveCamera(false);
  };

  const startLiveCamera = async () => {
    try {
      setErrorMsg(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsLiveCamera(true);
    } catch (err) {
      console.warn('Live camera stream not supported or denied, falling back to file picker', err);
      // Trigger native iOS photo sheet directly
      fileInputRef.current?.click();
    }
  };

  const captureFromVideo = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setSelectedImage(dataUrl);
      stopLiveCamera();
      runOCR(dataUrl);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setSelectedImage(dataUrl);
        runOCR(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const runOCR = async (imageSrc: string) => {
    setIsProcessing(true);
    setProgressPercent(10);
    setProgressMsg('Iniciando motor OCR...');
    setErrorMsg(null);
    setExtractedText('');

    try {
      // Determine language: Japanese ('jpn+eng') or Spanish ('spa+eng')
      const langParam = sourceLang === 'ja' ? 'jpn' : 'spa';

      const worker = await createWorker(langParam, 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgressMsg('Escaneando caracteres del cartel / menú...');
            setProgressPercent(Math.round((m.progress || 0) * 100));
          } else if (m.status === 'loading tesseract core') {
            setProgressMsg('Cargando núcleo Tesseract...');
            setProgressPercent(25);
          } else if (m.status === 'loading language traineddata') {
            setProgressMsg(`Descargando diccionario (${langParam})...`);
            setProgressPercent(50);
          } else if (m.status === 'initializing api') {
            setProgressMsg('Preparando reconocedor...');
            setProgressPercent(70);
          }
        },
      });

      const ret = await worker.recognize(imageSrc);
      await worker.terminate();

      let text = ret.data.text || '';
      // Clean up common OCR noise
      text = text.replace(/[\f\r]+/g, '\n').trim();

      if (!text) {
        throw new Error('No se detectó ningún texto claro en la imagen. Prueba con mejor iluminación o más cerca.');
      }

      setExtractedText(text);
      setIsProcessing(false);
      setProgressPercent(100);
      setProgressMsg('¡Texto extraído con éxito!');
    } catch (err: any) {
      console.error('OCR Error:', err);
      setIsProcessing(false);
      setErrorMsg(
        err.message ||
          'Error al procesar la imagen con OCR. Asegúrate de tener buena luz y enfocar las letras.'
      );
    }
  };

  const handleConfirmAndTranslate = () => {
    if (extractedText.trim()) {
      onTextExtracted(extractedText.trim());
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-black/90 backdrop-blur-md p-4 sm:p-6 pt-safe pb-safe animate-in fade-in duration-200">
      {/* Hidden native iOS camera input: capture="environment" launches the native iPhone camera app directly */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-red-500" />
          <span className="text-sm font-bold tracking-tight text-white">
            Cámara OCR · {sourceLang === 'ja' ? 'Carteles y Menús (Japonés)' : 'Texto en Español'}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white transition"
          aria-label="Cerrar cámara"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main View Area */}
      <div className="flex-1 flex flex-col items-center justify-center my-3 relative overflow-hidden rounded-2xl bg-slate-950 border border-slate-800">
        {/* Live Video Viewfinder */}
        {isLiveCamera && (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Guide overlay box */}
            <div className="absolute inset-8 border-2 border-dashed border-red-400/80 rounded-2xl pointer-events-none flex items-center justify-center">
              <span className="bg-black/60 backdrop-blur-sm text-xs font-semibold px-3 py-1 rounded-full text-slate-200">
                Apunta al texto o menú
              </span>
            </div>
            {/* Shutter button */}
            <div className="absolute bottom-6 flex items-center gap-4">
              <button
                onClick={captureFromVideo}
                className="w-18 h-18 rounded-full border-4 border-white bg-red-600 shadow-2xl flex items-center justify-center active:scale-95 transition"
                aria-label="Capturar foto"
              >
                <div className="w-14 h-14 rounded-full bg-white/20" />
              </button>
            </div>
          </div>
        )}

        {/* Selected Image Preview & OCR State */}
        {!isLiveCamera && selectedImage && (
          <div className="relative w-full h-full flex flex-col p-4 overflow-y-auto">
            <div className="relative h-44 w-full rounded-xl overflow-hidden bg-black shrink-0 border border-slate-800">
              <img
                src={selectedImage}
                alt="Foto a escanear"
                className="w-full h-full object-contain"
              />
              {isProcessing && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-4">
                  <RefreshCw className="w-8 h-8 text-red-500 animate-spin mb-3" />
                  <p className="text-xs font-semibold text-white text-center">{progressMsg}</p>
                  <div className="w-48 h-2 bg-slate-700 rounded-full mt-2.5 overflow-hidden">
                    <div
                      className="h-full bg-red-500 transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">{progressPercent}%</span>
                </div>
              )}
            </div>

            {/* Extracted Text Box */}
            <div className="mt-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Texto Detectado:
                </span>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-red-400 hover:text-red-300 underline font-medium"
                >
                  Tomar otra foto
                </button>
              </div>

              <textarea
                value={extractedText}
                onChange={(e) => setExtractedText(e.target.value)}
                placeholder={isProcessing ? 'Extrayendo texto...' : 'El texto detectado aparecerá aquí.'}
                rows={4}
                className="w-full flex-1 p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              />

              {errorMsg && (
                <div className="mt-3 flex items-start gap-2 p-2.5 rounded-xl bg-red-950/50 border border-red-800 text-xs text-red-200">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Initial Choice Screen (Take Photo vs Open Camera vs Upload) */}
        {!isLiveCamera && !selectedImage && (
          <div className="p-6 text-center max-w-sm">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto mb-4">
              <Camera className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">Escaneo de Carteles y Menús</h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Toma una foto de un menú, cartel de tren o letrero en Japón o España. Tesseract.js extraerá el texto directamente en tu iPhone.
            </p>

            <div className="mt-6 space-y-2.5">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl font-bold bg-red-600 hover:bg-red-500 active:scale-[0.98] text-white shadow-lg transition"
              >
                <Camera className="w-5 h-5" />
                Hacer Foto con Cámara iPhone
              </button>

              <button
                onClick={startLiveCamera}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 active:scale-[0.98] transition text-sm"
              >
                <ImageIcon className="w-4 h-4" />
                Abrir Visor en Vivo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Footer */}
      <div className="flex items-center gap-3">
        {selectedImage && extractedText.trim() && !isProcessing ? (
          <button
            onClick={handleConfirmAndTranslate}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl active:scale-[0.98] transition"
          >
            <Check className="w-5 h-5" />
            Traducir este texto
          </button>
        ) : (
          <button
            onClick={onClose}
            className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm bg-slate-800 text-slate-300 hover:text-white transition"
          >
            Cerrar
          </button>
        )}
      </div>
    </div>
  );
};
