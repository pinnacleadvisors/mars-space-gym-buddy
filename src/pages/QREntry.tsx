import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, LogIn, MapPin, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { QRCodeDisplay } from "@/components/qr/QRCodeDisplay";
import { QRCodeScanner } from "@/components/qr/QRCodeScanner";
import { decodeQRCodeData, isQRCodeValid, type QRCodeData } from "@/lib/utils/qrCode";

const TARGET_LAT = 51.4981;
const TARGET_LNG = -0.0544;
const MAX_DISTANCE_METERS = 100;

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const QREntry = () => {
  const [locationStatus, setLocationStatus] = useState<"checking" | "valid" | "invalid">("checking");
  const [isChecking, setIsChecking] = useState(false);
  const [hasMembership, setHasMembership] = useState<boolean | null>(null);
  const [membershipChecking, setMembershipChecking] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    checkMembership();
  }, []);

  const checkMembership = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setHasMembership(false);
        setMembershipChecking(false);
        return;
      }

      const { data, error } = await supabase.rpc('has_valid_membership', {
        _user_id: user.id
      });

      if (error) throw error;
      setHasMembership(data);
    } catch (error: any) {
      console.error("Error checking membership:", error);
      setHasMembership(false);
    } finally {
      setMembershipChecking(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const checkLocation = () => {
      if (!navigator.geolocation) {
        if (isMounted) {
          setLocationStatus("invalid");
          toast({
            variant: "destructive",
            title: "Location not supported",
            description: "Your device doesn't support geolocation.",
          });
        }
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!isMounted) return;
          
          const distance = calculateDistance(
            position.coords.latitude,
            position.coords.longitude,
            TARGET_LAT,
            TARGET_LNG
          );

          if (distance <= MAX_DISTANCE_METERS) {
            setLocationStatus("valid");
          } else {
            setLocationStatus("invalid");
            toast({
              variant: "destructive",
              title: "Location Error",
              description: "You must be at SE16 2RW, London to check in.",
            });
          }
        },
        (error) => {
          if (!isMounted) return;
          
          setLocationStatus("invalid");
          toast({
            variant: "destructive",
            title: "Location Access Denied",
            description: "Please enable location services to check in.",
          });
        }
      );
    };
    
    checkLocation();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCheckIn = async () => {
    if (!hasMembership) {
      toast({
        variant: "destructive",
        title: "No Valid Membership",
        description: "You need an active paid membership to check in.",
      });
      return;
    }

    if (locationStatus !== "valid") {
      toast({
        variant: "destructive",
        title: "Cannot Check In",
        description: "You must be at SE16 2RW, London to check in.",
      });
      return;
    }

    setIsChecking(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("check_ins")
        .insert([{
          user_id: user.id,
          check_in_time: new Date().toISOString(),
          location: "SE16 2RW, London"
        }]);

      if (error) throw error;

      toast({
        title: "Checked In Successfully",
        description: "Welcome to the gym!",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setTimeout(() => setIsChecking(false), 1000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-lg">
        {!membershipChecking && !hasMembership && (
          <Alert variant="destructive" className="m-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You need an active paid membership to check in. Please contact admin.
            </AlertDescription>
          </Alert>
        )}
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gradient-secondary rounded-full">
              <QrCode className="w-12 h-12 text-secondary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Check In</CardTitle>
          <CardDescription>Scan your QR code to enter the gym</CardDescription>
          <div className="flex items-center justify-center gap-2 mt-4">
            <MapPin className={`w-4 h-4 ${locationStatus === "valid" ? "text-green-500" : locationStatus === "invalid" ? "text-red-500" : "text-muted-foreground"}`} />
            <span className={`text-sm ${locationStatus === "valid" ? "text-green-500" : locationStatus === "invalid" ? "text-red-500" : "text-muted-foreground"}`}>
              {locationStatus === "checking" && "Checking location..."}
              {locationStatus === "valid" && "Location verified"}
              {locationStatus === "invalid" && "Must be at SE16 2RW, London"}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {showScanner ? (
            <QRCodeScanner
              onScan={(qrData: QRCodeData) => {
                // Validate QR code
                if (!isQRCodeValid(qrData)) {
                  toast({
                    variant: "destructive",
                    title: "QR Code Expired",
                    description: "This QR code has expired. Please generate a new one.",
                  });
                  return;
                }
                
                if (qrData.action !== 'entry') {
                  toast({
                    variant: "destructive",
                    title: "Invalid QR Code",
                    description: "This QR code is for check-out, not check-in.",
                  });
                  return;
                }
                
                // Auto check-in when QR code is scanned
                handleCheckIn();
                setShowScanner(false);
              }}
              onError={(error) => {
                toast({
                  variant: "destructive",
                  title: "Scanning Error",
                  description: error,
                });
              }}
            />
          ) : (
            <>
              {user && (
                <QRCodeDisplay
                  userId={user.id}
                  action="entry"
                  size={250}
                  className="max-w-sm mx-auto"
                />
              )}
              <div className="flex gap-2">
                <Button 
                  className="flex-1 bg-secondary hover:bg-secondary/90" 
                  size="lg"
                  onClick={() => setShowScanner(true)}
                  disabled={!hasMembership || membershipChecking}
                >
                  <QrCode className="w-5 h-5 mr-2" />
                  Scan QR Code
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1" 
                  size="lg"
                  onClick={handleCheckIn}
                  disabled={locationStatus !== "valid" || isChecking || !hasMembership || membershipChecking}
                >
                  <LogIn className="w-5 h-5 mr-2" />
                  Manual Check In
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QREntry;
