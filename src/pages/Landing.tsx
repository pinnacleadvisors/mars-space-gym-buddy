import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Dumbbell, Calendar, BarChart3, QrCode } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-95" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        
        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 mb-8">
            <Dumbbell className="w-4 h-4 text-secondary" />
            <span className="text-sm font-medium text-secondary">Modern Gym Management</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-primary-foreground mb-6">
            Transform Your
            <span className="block bg-gradient-secondary bg-clip-text text-transparent">
              Fitness Journey
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-primary-foreground/90 mb-12 max-w-2xl mx-auto">
            Streamline memberships, book classes, and track your progress with our comprehensive gym management platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-glow"
              onClick={() => navigate("/register")}
            >
              Get Started
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => navigate("/login")}
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Everything You Need to Manage Your Gym
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Calendar className="w-10 h-10 text-secondary" />}
              title="Class Booking"
              description="Easy-to-use class scheduling and booking system for members and staff."
            />
            <FeatureCard
              icon={<QrCode className="w-10 h-10 text-accent" />}
              title="QR Check-In"
              description="Fast and contactless entry/exit tracking with QR code scanning."
            />
            <FeatureCard
              icon={<BarChart3 className="w-10 h-10 text-primary" />}
              title="Analytics Dashboard"
              description="Comprehensive insights into member activity, class popularity, and revenue."
            />
          </div>
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) => (
  <div className="bg-card p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
    <div className="mb-4">{icon}</div>
    <h3 className="text-xl font-semibold mb-3 text-card-foreground">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

export default Landing;
