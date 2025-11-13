import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";

const Bookings = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Bookings</h1>
        
        <div className="space-y-4">
          <BookingCard
            className="Morning Yoga"
            date="2025-11-08"
            time="07:00 AM"
            status="confirmed"
            instructor="Sarah Johnson"
          />
          <BookingCard
            className="HIIT Training"
            date="2025-11-10"
            time="06:00 PM"
            status="confirmed"
            instructor="Mike Chen"
          />
        </div>
      </div>
    </div>
  );
};

const BookingCard = ({
  className,
  date,
  time,
  status,
  instructor
}: {
  className: string;
  date: string;
  time: string;
  status: string;
  instructor: string;
}) => (
  <Card>
    <CardHeader>
      <div className="flex items-start justify-between">
        <div>
          <CardTitle>{className}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">with {instructor}</p>
        </div>
        <Badge variant={status === 'confirmed' ? 'default' : 'secondary'}>
          {status}
        </Badge>
      </div>
    </CardHeader>
    <CardContent>
      <div className="flex items-center gap-6 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span>{new Date(date).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span>{time}</span>
        </div>
      </div>
      <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
        Cancel Booking
      </Button>
    </CardContent>
  </Card>
);

export default Bookings;
