import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, LogIn, LogOut, MapPin, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { QRCodeDisplay } from "@/components/qr/QRCodeDisplay";
import { QRCodeScanner } from "@/components/qr/QRCodeScanner";
import { decodeQRCodeData, isQRCodeValid, type QRCodeData } from "@/lib/utils/qrCode";
import { showErrorToast, toastMessages } from "@/lib/utils/toastHelpers";

// Updated target location: Grinstead Rd, London SE8 5FE, United Kingdom
const TARGET_LAT = 51.4881; // Approximate coordinates for SE8 5FE
const TARGET_LNG = -0.0300;
const MAX_DISTANCE_METERS = 100;
const TARGET_LOCATION = "Grinstead Rd, London SE8 5FE, United Kingdom";

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

const EntryExit = () => {
  const [locationStatus, setLocationStatus] = useState<"checking" | "valid" | "invalid">("checking");
  const [isChecking, setIsChecking] = useState(false);
  const [hasMembership, setHasMembership] = useState<boolean | null>(null);
  const [membershipChecking, setMembershipChecking] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [hasActiveCheckIn, setHasActiveCheckIn] = useState<boolean | null>(null);
  const [checkingCheckIn, setCheckingCheckIn] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Determine which QR code to show based on active check-in status
  const showEntryQR = hasActiveCheckIn === false;
  const showExitQR = hasActiveCheckIn === true;

  useEffect(() => {
    checkMembership();
    checkActiveCheckIn();
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

  const checkActiveCheckIn = async () => {
    try {
      setCheckingCheckIn(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setHasActiveCheckIn(false);
        setCheckingCheckIn(false);
        return;
      }

      // Check if user has an active check-in (no check-out time)
      const { data, error } = await supabase
        .from("check_ins")
        .select("id")
        .eq("user_id", user.id)
        .is("check_out_time", null)
        .order("check_in_time", { ascending: false })
        .limit(1);

      if (error) throw error;
      setHasActiveCheckIn(data && data.length > 0);
    } catch (error: any) {
      console.error("Error checking active check-in:", error);
      setHasActiveCheckIn(false);
    } finally {
      setCheckingCheckIn(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const checkLocation = () => {
      if (!navigator.geolocation) {
        if (isMounted) {
          setLocationStatus("invalid");
          showErrorToast({
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
            showErrorToast({
              title: "Location Error",
              description: `You must be at ${TARGET_LOCATION} to check in/out.`,
            });
          }
        },
        (error) => {
          if (!isMounted) return;
          
          setLocationStatus("invalid");
          showErrorToast({
            title: "Location Access Denied",
            description: "Please enable location services to check in/out.",
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
      showErrorToast({
        title: "No Valid Membership",
        description: "You need an active paid membership to check in.",
      });
      return;
    }

    if (locationStatus !== "valid") {
      showErrorToast({
        title: "Cannot Check In",
        description: `You must be at ${TARGET_LOCATION} to check in.`,
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
          location: TARGET_LOCATION
        }]);

      if (error) throw error;

      toast(toastMessages.bookingCreated("Check-in"));
      // Refresh check-in status
      await checkActiveCheckIn();
    } catch (error: any) {
      showErrorToast({
        title: "Error",
        description: error.message,
      });
    } finally {
      setTimeout(() => setIsChecking(false), 1000);
    }
  };

  const handleCheckOut = async () => {
    if (!hasMembership) {
      showErrorToast({
        title: "No Valid Membership",
        description: "You need an active paid membership to check out.",
      });
      return;
    }

    if (locationStatus !== "valid") {
      showErrorToast({
        title: "Cannot Check Out",
        description: `You must be at ${TARGET_LOCATION} to check out.`,
      });
      return;
    }

    setIsChecking(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Find the most recent check-in without a check-out
      const { data: checkIns, error: fetchError } = await supabase
        .from("check_ins")
        .select("id")
        .eq("user_id", user.id)
        .is("check_out_time", null)
        .order("check_in_time", { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      if (!checkIns || checkIns.length === 0) {
        showErrorToast({
          title: "No Check-In Found",
          description: "You don't have an active check-in to check out from.",
        });
        return;
      }

      const { error: updateError } = await supabase
        .from("check_ins")
        .update({
          check_out_time: new Date().toISOString()
        })
        .eq("id", checkIns[0].id);

      if (updateError) throw updateError;

      toast(toastMessages.bookingCancelled());
      // Refresh check-in status
      await checkActiveCheckIn();
    } catch (error: any) {
      showErrorToast({
        title: "Error",
        description: error.message,
      });
    } finally {
      setTimeout(() => setIsChecking(false), 1000);
    }
  };

  const handleQRScan = (qrData: QRCodeData) => {
    // Validate QR code
    if (!isQRCodeValid(qrData)) {
      showErrorToast({
        title: "QR Code Expired",
        description: "This QR code has expired. Please generate a new one.",
      });
      return;
    }

    // Check if QR code action matches current state
    if (showEntryQR && qrData.action !== 'entry') {
      showErrorToast({
        title: "Invalid QR Code",
        description: "This QR code is for check-out, not check-in.",
      });
      return;
    }

    if (showExitQR && qrData.action !== 'exit') {
      showErrorToast({
        title: "Invalid QR Code",
        description: "This QR code is for check-in, not check-out.",
      });
      return;
    }

    // Process the appropriate action
    if (qrData.action === 'entry') {
      handleCheckIn();
    } else {
      handleCheckOut();
    }
    
    setShowScanner(false);
  };

  if (checkingCheckIn || membershipChecking) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-lg">
        {!membershipChecking && !hasMembership && (
          <Alert variant="destructive" className="m-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You need an active paid membership to check in/out. Please contact admin.
            </AlertDescription>
          </Alert>
        )}
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className={`p-4 rounded-full ${showEntryQR ? 'bg-gradient-secondary' : 'bg-gradient-accent'}`}>
              <QrCode className={`w-12 h-12 ${showEntryQR ? 'text-secondary-foreground' : 'text-accent-foreground'}`} />
            </div>
          </div>
          <CardTitle className="text-2xl">
            {showEntryQR ? "Check In" : "Check Out"}
          </CardTitle>
          <CardDescription>
            {showEntryQR 
              ? "Scan your QR code to enter the gym" 
              : "Scan your QR code to exit the gym"}
          </CardDescription>
          <div className="flex items-center justify-center gap-2 mt-4">
            <MapPin className={`w-4 h-4 ${locationStatus === "valid" ? "text-green-500" : locationStatus === "invalid" ? "text-red-500" : "text-muted-foreground"}`} />
            <span className={`text-sm ${locationStatus === "valid" ? "text-green-500" : locationStatus === "invalid" ? "text-red-500" : "text-muted-foreground"}`}>
              {locationStatus === "checking" && "Checking location..."}
              {locationStatus === "valid" && "Location verified"}
              {locationStatus === "invalid" && `Must be at ${TARGET_LOCATION}`}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {showScanner ? (
            <QRCodeScanner
              onScan={handleQRScan}
              onError={(error) => {
                showErrorToast({
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
                  action={showEntryQR ? "entry" : "exit"}
                  size={250}
                  className="max-w-sm mx-auto"
                />
              )}
              <div className="flex gap-2">
                <Button 
                  className={`flex-1 ${showEntryQR ? 'bg-secondary hover:bg-secondary/90' : 'bg-accent hover:bg-accent/90'}`}
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
                  onClick={showEntryQR ? handleCheckIn : handleCheckOut}
                  disabled={locationStatus !== "valid" || isChecking || !hasMembership || membershipChecking}
                >
                  {showEntryQR ? (
                    <>
                      <LogIn className="w-5 h-5 mr-2" />
                      Manual Check In
                    </>
                  ) : (
                    <>
                      <LogOut className="w-5 h-5 mr-2" />
                      Manual Check Out
                    </>
                  )}
                </Button>
              </div>
              {showExitQR && (
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You have an active check-in. Scan the exit QR code or use manual check-out to exit.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EntryExit;

