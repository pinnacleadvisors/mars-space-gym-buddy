"use client";

import { useState } from "react";
import { QRCodeScanner } from "@/components/qr/QRCodeScanner";
import { decodeQRCodeData, QRCodeData, isQRCodeValid } from "@/lib/utils/qrCode";
import { claimReward } from "@/lib/utils/rewardClaim";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { Gift, CheckCircle2, XCircle } from "lucide-react";

const AdminRewardClaim = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [lastClaimResult, setLastClaimResult] = useState<{ success: boolean; message: string } | null>(null);
  const { toast } = useToast();

  const handleQRScan = async (qrData: QRCodeData) => {
    if (!isQRCodeValid(qrData)) {
      toast({
        variant: "destructive",
        title: "QR Code Expired",
        description: "This QR code has expired. Please ask the member to generate a new one.",
      });
      setShowScanner(false);
      return;
    }

    if (qrData.action !== 'reward') {
      toast({
        variant: "destructive",
        title: "Invalid QR Code",
        description: "This QR code is not for rewards.",
      });
      setShowScanner(false);
      return;
    }

    setClaiming(true);
    setLastClaimResult(null);

    try {
      const result = await claimReward(qrData, 'free_drink');
      
      if (result.success) {
        setLastClaimResult({
          success: true,
          message: result.message || 'Reward claimed successfully!'
        });
        toast({
          variant: "default",
          title: "Success!",
          description: "Free drink reward has been claimed.",
        });
      } else {
        setLastClaimResult({
          success: false,
          message: result.error || 'Failed to claim reward'
        });
        toast({
          variant: "destructive",
          title: "Claim Failed",
          description: result.error || 'Failed to claim reward',
        });
      }
    } catch (error: any) {
      setLastClaimResult({
        success: false,
        message: error.message || 'An error occurred'
      });
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || 'An error occurred',
      });
    } finally {
      setClaiming(false);
      setShowScanner(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Claim Reward
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showScanner ? (
              <>
                <Button
                  onClick={() => setShowScanner(true)}
                  className="w-full"
                  size="lg"
                  disabled={claiming}
                >
                  {claiming ? "Processing..." : "Scan QR Code"}
                </Button>
                
                {lastClaimResult && (
                  <div className={`p-4 rounded-lg flex items-center gap-2 ${
                    lastClaimResult.success 
                      ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800' 
                      : 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800'
                  }`}>
                    {lastClaimResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    )}
                    <p className={lastClaimResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}>
                      {lastClaimResult.message}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <QRCodeScanner
                  onScan={handleQRScan}
                  onError={(error) => {
                    toast({
                      variant: "destructive",
                      title: "Scan Error",
                      description: error,
                    });
                    setShowScanner(false);
                  }}
                />
                <Button
                  onClick={() => setShowScanner(false)}
                  variant="outline"
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Wrap with AdminRoute
const AdminRewardClaimPage = () => (
  <AdminRoute>
    <AdminRewardClaim />
  </AdminRoute>
);

export default AdminRewardClaimPage;

