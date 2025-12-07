import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden overflow-x-hidden w-full max-w-full">
      {/* Full-screen hero background image */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url("${import.meta.env.BASE_URL}hero-background.jpg")` }}
      />
      
      {/* Overlay for better text readability */}
      <div className="fixed inset-0 bg-black/40" />
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-between px-6 py-12 md:py-16">
        {/* Logo near the top */}
        <div className="flex-shrink-0 mt-8 md:mt-12">
          <img 
            src={`${import.meta.env.BASE_URL}earth-space-logo-9.webp`}
            alt="Earth Space" 
            className="h-16 md:h-20 lg:h-24 w-auto mx-auto"
          />
          </div>
          
        {/* Main content - centered */}
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-3xl mx-auto space-y-8 md:space-y-12">
          {/* Large serif headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-white leading-tight tracking-tight">
            Welcome to Earth Space
          </h1>
          
          {/* Body text paragraph */}
          <p className="text-lg md:text-xl lg:text-2xl text-white/95 font-sans leading-relaxed max-w-2xl px-4">
            Discover a premium fitness experience with our comprehensive class timetable, seamless class booking system, and intuitive membership management. Your wellness journey starts here.
          </p>
        </div>
          
        {/* Bottom buttons - horizontally aligned pill-shaped, centered */}
        <div className="flex-shrink-0 w-full max-w-md mx-auto flex items-center justify-center space-x-4 mb-8 md:mb-12 px-4">
            <Button 
            onClick={() => navigate("/login")}
            className="flex-1 h-12 md:h-14 rounded-full bg-white text-black font-semibold text-base md:text-lg hover:bg-white/90 transition-all shadow-lg hover:shadow-xl"
            >
            LOG IN
            </Button>
            <Button 
            onClick={() => navigate("/register")}
              variant="outline" 
            className="flex-1 h-12 md:h-14 rounded-full border-2 border-white text-white font-semibold text-base md:text-lg hover:bg-white/10 transition-all backdrop-blur-sm"
            >
            JOIN EARTH SPACE
            </Button>
          </div>
        </div>
    </div>
  );
};

export default Landing;
