import { Button } from "@/components/ui/button";
import { Rocket, Dumbbell } from "lucide-react";
import heroImage from "@/assets/mars-gym-hero.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background"></div>
      </div>

      {/* Stars Effect */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-10 left-20 w-2 h-2 bg-foreground rounded-full animate-glow"></div>
        <div className="absolute top-40 right-32 w-1 h-1 bg-foreground rounded-full animate-glow" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-32 left-40 w-1.5 h-1.5 bg-foreground rounded-full animate-glow" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute top-60 right-20 w-1 h-1 bg-foreground rounded-full animate-glow" style={{ animationDelay: '1.5s' }}></div>
      </div>

      {/* Content */}
      <div className="container relative z-10 px-4 mx-auto text-center animate-fade-in">
        <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-card/50 backdrop-blur-sm border border-border rounded-full">
          <Rocket className="w-4 h-4 text-primary animate-float" />
          <span className="text-sm text-muted-foreground">Launch Your Fitness Journey</span>
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-tight">
          <span className="text-foreground">MARS</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-mars-orange"> SPACE</span>
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Train like an astronaut. Build strength for the extraordinary. Join Earth's most advanced fitness facility.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button variant="hero" size="lg" className="min-w-[200px]">
            <Dumbbell className="w-5 h-5" />
            Start Your Mission
          </Button>
          <Button variant="outline" size="lg" className="min-w-[200px]">
            Explore Programs
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-20">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary mb-2">500+</div>
            <div className="text-sm text-muted-foreground">Active Members</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary mb-2">50+</div>
            <div className="text-sm text-muted-foreground">Expert Trainers</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary mb-2">24/7</div>
            <div className="text-sm text-muted-foreground">Access Available</div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary/50 rounded-full flex items-start justify-center p-2">
          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
