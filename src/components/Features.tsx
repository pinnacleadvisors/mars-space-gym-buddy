import { Trophy, Users, Zap, Shield, Clock, Heart } from "lucide-react";

const features = [
  {
    icon: Trophy,
    title: "Elite Training",
    description: "State-of-the-art equipment and programs designed by professional athletes"
  },
  {
    icon: Users,
    title: "Expert Coaches",
    description: "Certified trainers with decades of combined experience in fitness and nutrition"
  },
  {
    icon: Zap,
    title: "High Performance",
    description: "Advanced technology to track your progress and optimize every workout"
  },
  {
    icon: Shield,
    title: "Safe Environment",
    description: "Clean, sanitized facilities with 24/7 security and medical support"
  },
  {
    icon: Clock,
    title: "Flexible Hours",
    description: "24/7 access so you can train on your schedule, any time of day"
  },
  {
    icon: Heart,
    title: "Community",
    description: "Join a supportive community of fitness enthusiasts pushing their limits"
  }
];

const Features = () => {
  return (
    <section className="py-24 px-4 bg-background">
      <div className="container mx-auto">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Why <span className="text-primary">Mars Space</span>?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Experience fitness training that's out of this world
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group p-8 bg-card border border-border rounded-lg hover:border-primary transition-all hover:shadow-[0_0_30px_rgba(255,68,68,0.2)] animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="mb-4 inline-flex p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
