import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Class {
  id: string;
  name: string;
  description: string | null;
  instructor: string;
  schedule: string;
  duration: number;
  capacity: number;
  category: string | null;
  image_url: string | null;
  is_active: boolean;
}

const Classes = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setClasses(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-8">Available Classes</h1>
        
        {classes.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No classes available at the moment. Check back soon!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((classItem) => (
              <ClassCard
                key={classItem.id}
                name={classItem.name}
                description={classItem.description}
                instructor={classItem.instructor}
                schedule={classItem.schedule}
                duration={classItem.duration}
                capacity={classItem.capacity}
                category={classItem.category}
                imageUrl={classItem.image_url}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ClassCard = ({ 
  name, 
  description,
  instructor, 
  schedule, 
  duration,
  capacity,
  category,
  imageUrl,
}: {
  name: string;
  description: string | null;
  instructor: string;
  schedule: string;
  duration: number;
  capacity: number;
  category: string | null;
  imageUrl: string | null;
}) => (
  <Card className="hover:shadow-lg transition-shadow overflow-hidden">
    {imageUrl && (
      <div className="h-48 overflow-hidden">
        <img 
          src={imageUrl} 
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
    )}
    <CardHeader>
      <div className="flex items-start justify-between mb-2">
        {category && <Badge variant="secondary">{category}</Badge>}
      </div>
      <CardTitle>{name}</CardTitle>
      <CardDescription>with {instructor}</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {description && (
        <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
      )}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="w-4 h-4" />
        <span>{schedule} • {duration} min</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="w-4 h-4" />
        <span>Max {capacity} participants</span>
      </div>
      <Button className="w-full bg-secondary hover:bg-secondary/90">
        Book Class
      </Button>
    </CardContent>
  </Card>
);

export default Classes;
