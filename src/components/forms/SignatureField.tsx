"use client";

import { useEffect, useRef } from "react";
import SignaturePad from "signature_pad";
import { Eraser } from "lucide-react";

interface SignatureFieldProps {
  onChange?: (signature: string) => void;
}

export default function SignatureField({
  onChange,
}: SignatureFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const resizeCanvas = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);

      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;

      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.scale(ratio, ratio);
      }

      signaturePadRef.current = new SignaturePad(canvas, {
        penColor: "#4338CA",
        minWidth: 1.5,
        maxWidth: 2.5,
      });
    };

    resizeCanvas();

    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      signaturePadRef.current?.off();
    };
  }, []);

  const clearSignature = () => {
    signaturePadRef.current?.clear();
    onChange?.("");
  };

  const saveSignature = () => {
    if (!signaturePadRef.current) return;

    if (signaturePadRef.current.isEmpty()) {
      onChange?.("");
      return;
    }

    const image = signaturePadRef.current.toDataURL("image/png");

    onChange?.(image);
  };

  return (
    <div className="rounded-2xl border-2 border-gray-100 bg-white p-5">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-primary">
          امضای دیجیتال
        </span>

        <button
          type="button"
          onClick={clearSignature}
          className="flex items-center gap-1 text-[11px] text-gray-400 transition hover:text-danger"
        >
          <Eraser className="h-3.5 w-3.5" />
          پاک کردن
        </button>
      </div>

      <p className="mb-3 text-xs text-gray-400">
        لطفاً با ماوس یا انگشت داخل کادر امضا کنید.
      </p>

      <div className="overflow-hidden rounded-xl border border-dashed border-gray-200 bg-gray-50">
        <canvas
          ref={canvasRef}
          className="h-40 w-full touch-none"
          onMouseUp={saveSignature}
          onTouchEnd={saveSignature}
        />
      </div>

      <div className="mt-2 text-center text-[10px] text-gray-300">
        امضای رضایت‌نامه
      </div>
    </div>
  );
}