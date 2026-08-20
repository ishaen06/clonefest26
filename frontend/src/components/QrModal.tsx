import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { X, QrCode, Download, Copy, Check } from 'lucide-react';
import { copySecureToClipboard } from '../utils/clipboard';

interface QrModalProps {
  url: string;
  isOpen: boolean;
  onClose: () => void;
}

export const QrModal: React.FC<QrModalProps> = ({ url, isOpen, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    if (isOpen && canvasRef.current && url) {
      QRCode.toCanvas(
        canvasRef.current,
        url,
        {
          width: 260,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) console.error('QR Generation failed:', error);
        }
      );
    }
  }, [isOpen, url]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    await copySecureToClipboard(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = 'jigsaw-airgap-qr.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 text-blue-400 mb-2 font-mono text-sm font-semibold">
          <QrCode className="w-5 h-5" />
          <span>Airgap Mobile Scanner</span>
        </div>
        <p className="text-xs text-zinc-400 mb-5">
          Scan with your mobile camera to open and decrypt this secret without pasting keys into third-party chat apps.
        </p>

        <div className="bg-white p-4 rounded-xl flex items-center justify-center shadow-inner mb-5">
          <canvas ref={canvasRef} className="rounded" />
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-mono font-medium transition"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied Link' : 'Copy Secret Link'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-mono transition"
            title="Download QR Image"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
