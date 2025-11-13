import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

const membershipPlans = [
  {
    name: "Explorer",
    price: "$49",
    period: "/month",
    description: "Perfect for beginners starting their fitness journey",
    features: [
      "Access to gym floor",
      "Basic equipment usage",
      "Locker room access",
      "Mobile app access",
      "Group fitness classes"
    ],
    popular: false
  },
  {
    name: "Astronaut",
    price: "$99",
    period: "/month",
    description: "Our most popular plan for serious fitness enthusiasts",
    features: [
      "Everything in Explorer",
      "Personal training (2 sessions/month)",
      "Advanced equipment access",
      "Nutrition consultation",
      "Priority class booking",
      "Guest passes (2/month)"
    ],
    popular: true
  },
  {
    name: "Commander",
    price: "$199",
    period: "/month",
    description: "Elite training for peak performance athletes",
    features: [
      "Everything in Astronaut",
      "Unlimited personal training",
      "Custom meal planning",
      "Recovery suite access",
      "Private training space",
      "Unlimited guest passes",
      "24/7 trainer support"
    ],
    popular: false
  }
];

const Memberships = () => {
  return (
    <section className="py-24 px-4 bg-gradient-to-b from-background to-space-darker">
      <div className="container mx-auto">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Choose Your <span className="text-primary">Mission</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Select the membership that aligns with your fitness goals
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {membershipPlans.map((plan, index) => (
            <Card 
              key={plan.name}
              className={`relative overflow-hidden transition-all hover:scale-105 ${
                plan.popular 
                  ? 'border-primary shadow-[0_0_30px_rgba(255,68,68,0.3)]' 
                  : 'border-border'
              }`}
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              {plan.popular && (
                <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button 
                  variant={plan.popular ? "hero" : "outline"} 
                  className="w-full"
                  size="lg"
                >
                  {plan.popular ? "Start Now" : "Get Started"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Memberships;
