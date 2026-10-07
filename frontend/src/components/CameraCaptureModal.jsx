import React, { useState, useEffect, useRef } from 'react';

export default function CameraCaptureModal({ isOpen, onClose, onCapturePhoto }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back) or 'user' (front)

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    setCameraError('');
    setCapturedImage(null);
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.warn('[CameraCaptureModal] WebRTC Camera error:', err);
      setCameraError('Camera access denied or unavailable. You can use native file capture below.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleTakeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);
  };

  const handleConfirmPhoto = () => {
    if (!capturedImage) return;

    // Convert DataURL to File
    fetch(capturedImage)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], `captured_document_${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCapturePhoto(file);
        stopCamera();
        onClose();
      })
      .catch((err) => {
        console.error('Error creating file from snapshot:', err);
        alert('Failed to process captured image.');
      });
  };

  const handleFallbackFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      onCapturePhoto(e.target.files[0]);
      stopCamera();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div class="fixed inset-0 z-50 bg-on-surface/80 backdrop-blur-md flex items-center justify-center p-space-md animate-fade-in select-none">
      <div class="bg-surface-container-lowest border-2 border-surface-container rounded-3xl p-space-lg max-w-2xl w-full text-center flex flex-col items-center gap-space-md shadow-2xl relative">
        
        {/* Modal Header */}
        <div class="flex items-center justify-between w-full border-b border-surface-container pb-space-xs">
          <div class="flex items-center gap-space-xs text-primary font-title-lg text-title-lg font-bold">
            <span class="material-symbols-outlined text-[28px]">photo_camera</span>
            <span>Capture Medical Document</span>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            class="w-10 h-10 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-bold flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Camera Error Banner */}
        {cameraError ? (
          <div class="w-full bg-error-container/30 border border-error/40 rounded-2xl p-space-lg flex flex-col items-center gap-space-md my-space-md">
            <span class="material-symbols-outlined text-error text-[48px]">no_photography</span>
            <p class="font-title-md text-title-md text-on-surface font-bold">{cameraError}</p>
            <label class="px-space-xl py-space-sm bg-primary text-on-primary font-headline-sm text-headline-sm font-bold rounded-xl shadow-md cursor-pointer hover:bg-primary-container transition-all">
              <span>Use Device Camera / File</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFallbackFileInput}
                class="hidden"
              />
            </label>
          </div>
        ) : (
          <div class="w-full flex flex-col items-center gap-space-md">
            
            {/* Live Video Preview or Captured Snapshot */}
            <div class="relative w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden border-2 border-surface-container flex items-center justify-center">
              {!capturedImage ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  class="w-full h-full object-contain"
                ></video>
              ) : (
                <img
                  src={capturedImage}
                  alt="Captured document snapshot"
                  class="w-full h-full object-contain"
                />
              )}

              {/* Grid Guide Overlay */}
              {!capturedImage && (
                <div class="absolute inset-4 border-2 border-dashed border-white/50 rounded-xl pointer-events-none flex items-center justify-center">
                  <span class="bg-black/60 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    Position document inside frame
                  </span>
                </div>
              )}
            </div>

            {/* Hidden Canvas for Frame Capture */}
            <canvas ref={canvasRef} class="hidden"></canvas>

            {/* Action Buttons */}
            <div class="flex items-center justify-between w-full pt-space-xs">
              {!capturedImage ? (
                <>
                  <button
                    type="button"
                    onClick={() => setFacingMode(facingMode === 'environment' ? 'user' : 'environment')}
                    class="px-space-md py-space-xs bg-surface-container hover:bg-surface-container-high font-title-sm text-title-sm font-bold rounded-xl flex items-center gap-1"
                  >
                    <span class="material-symbols-outlined text-[20px]">flip_camera_ios</span>
                    <span>Flip Camera</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTakeSnapshot}
                    class="px-space-2xl py-space-md bg-primary hover:bg-primary-container text-on-primary font-headline-md text-headline-md font-black rounded-2xl shadow-xl flex items-center gap-space-xs active:scale-95 cursor-pointer"
                  >
                    <span class="material-symbols-outlined text-[32px]">camera</span>
                    <span>Take Photo</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setCapturedImage(null)}
                    class="px-space-lg py-space-sm bg-surface-container hover:bg-surface-container-high text-on-surface font-title-md text-title-md font-bold rounded-xl flex items-center gap-1"
                  >
                    <span class="material-symbols-outlined text-[20px]">restart_alt</span>
                    <span>Retake</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmPhoto}
                    class="px-space-xl py-space-sm bg-tertiary hover:bg-tertiary-container text-on-tertiary font-headline-sm text-headline-sm font-black rounded-xl shadow-xl flex items-center gap-space-xs active:scale-95 cursor-pointer"
                  >
                    <span class="material-symbols-outlined text-[24px]">check_circle</span>
                    <span>Use This Photo</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
