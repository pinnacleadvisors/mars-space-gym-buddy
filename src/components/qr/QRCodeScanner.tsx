import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, X, AlertCircle } from 'lucide-react';
import { decodeQRCodeData, isQRCodeValid, type QRCodeData } from '@/lib/utils/qrCode';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Html5Qrcode } from 'html5-qrcode';

interface QRCodeScannerProps {
  onScan: (data: QRCodeData) => void;
  onError?: (error: string) => void;
  className?: string;
  showCamera?: boolean;
}

/**
 * Component for scanning QR codes using device camera
 * Uses html5-qrcode library for QR code detection
 */
export const QRCodeScanner = ({
  onScan,
  onError,
  className,
  showCamera = true,
}: QRCodeScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerId = 'qr-scanner';

  const startScanning = async () => {
    try {
      setError(null);
      
      const html5QrCode = new Html5Qrcode(scannerId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' }, // Use back camera on mobile
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // QR code detected
          try {
            const qrData = decodeQRCodeData(decodedText);
            if (qrData && isQRCodeValid(qrData)) {
              onScan(qrData);
              stopScanning();
            } else {
              setError('Invalid or expired QR code');
              onError?.('Invalid or expired QR code');
            }
          } catch (err: any) {
            setError('Failed to decode QR code: ' + err.message);
            onError?.(err.message);
          }
        },
        (errorMessage) => {
          // Ignore scanning errors (they're frequent during scanning)
          // Only show errors for actual failures
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      let errorMessage = 'Failed to start camera: ' + err.message;
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please enable camera access in your browser settings.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera is already in use by another application.';
      }
      
      setError(errorMessage);
      onError?.(errorMessage);
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        // Ignore errors when stopping
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const handleManualInput = () => {
    const qrDataString = prompt('Enter QR code data (JSON string):');
    if (qrDataString) {
      try {
        const qrData = decodeQRCodeData(qrDataString);
        if (qrData && isQRCodeValid(qrData)) {
          onScan(qrData);
        } else {
          setError('Invalid or expired QR code');
          onError?.('Invalid or expired QR code');
        }
      } catch (err: any) {
        setError('Failed to decode QR code: ' + err.message);
        onError?.(err.message);
      }
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-6 space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {showCamera && (
          <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
            <div id={scannerId} className="w-full h-full" />
            {!isScanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                <div className="text-center text-white">
                  <Camera className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm">Camera not active</p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          {!isScanning ? (
            <Button onClick={startScanning} className="flex-1">
              <Camera className="w-4 h-4 mr-2" />
              Start Scanning
            </Button>
          ) : (
            <Button onClick={stopScanning} variant="destructive" className="flex-1">
              <X className="w-4 h-4 mr-2" />
              Stop Scanning
            </Button>
          )}
          <Button onClick={handleManualInput} variant="outline">
            Manual Entry
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          {isScanning
            ? 'Point your camera at a QR code'
            : 'Click "Start Scanning" to begin'}
        </p>
      </CardContent>
    </Card>
  );
};
