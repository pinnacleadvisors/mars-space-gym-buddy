import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Memberships from "@/components/Memberships";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      <section id="features">
        <Features />
      </section>
      <section id="memberships">
        <Memberships />
      </section>
      <Footer />
    </div>
  );
};

export default Index;
