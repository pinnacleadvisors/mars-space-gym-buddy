import { useState, useEffect } from 'react';
import { generateQRCodeImage, generateQRCodeData, type QRCodeData } from '@/lib/utils/qrCode';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QRCodeDisplayProps {
  userId: string;
  action?: 'entry' | 'exit';
  sessionId?: string;
  title?: string;
  description?: string;
  size?: number;
  className?: string;
  showDownload?: boolean;
  showRefresh?: boolean;
  onRefresh?: () => void;
}

/**
 * Component to display a QR code for user check-in/check-out
 */
export const QRCodeDisplay = ({
  userId,
  action = 'entry',
  sessionId,
  title,
  description,
  size = 300,
  className,
  showDownload = true,
  showRefresh = true,
  onRefresh,
}: QRCodeDisplayProps) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generateQR = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const qrData = generateQRCodeData(userId, action, sessionId);
      const dataUrl = await generateQRCodeImage(qrData, {
        width: size,
        margin: 2,
      });
      
      setQrCodeUrl(dataUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to generate QR code');
      console.error('QR code generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateQR();
  }, [userId, action, sessionId, size]);

  const handleDownload = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `qr-code-${action}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRefresh = () => {
    generateQR();
    onRefresh?.();
  };

  return (
    <Card className={cn("w-full", className)}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center justify-center space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center space-y-2" style={{ width: size, height: size }}>
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Generating QR code...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center space-y-2 p-8" style={{ width: size, height: size }}>
              <p className="text-sm text-destructive">{error}</p>
              {showRefresh && (
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              )}
            </div>
          ) : qrCodeUrl ? (
            <>
              <div className="bg-white p-4 rounded-lg shadow-md">
                <img
                  src={qrCodeUrl}
                  alt={`QR Code for ${action}`}
                  className="w-full h-auto"
                  loading="lazy"
                  decoding="async"
                  style={{ maxWidth: size, maxHeight: size }}
                />
              </div>
              <div className="flex gap-2">
                {showDownload && (
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                )}
                {showRefresh && (
                  <Button variant="outline" size="sm" onClick={handleRefresh}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                )}
              </div>
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};

