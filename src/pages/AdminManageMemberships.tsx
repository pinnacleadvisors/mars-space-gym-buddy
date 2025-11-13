import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Edit, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Membership {
  id: string;
  name: string;
  price: number | null;
  duration_days: number | null;
  access_level: string | null;
  created_at: string;
}

const AdminManageMemberships = () => {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMembership, setEditingMembership] = useState<Membership | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    duration_days: "",
    access_level: "",
  });

  useEffect(() => {
    fetchMemberships();
  }, []);

  const fetchMemberships = async () => {
    try {
      const { data, error } = await supabase
        .from("memberships")
        .select("*")
        .order("name");

      if (error) throw error;
      setMemberships(data || []);
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

  const resetForm = () => {
    setFormData({
      name: "",
      price: "",
      duration_days: "",
      access_level: "",
    });
    setEditingMembership(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const membershipData = {
        name: formData.name,
        price: formData.price ? parseFloat(formData.price) : null,
        duration_days: formData.duration_days ? parseInt(formData.duration_days) : null,
        access_level: formData.access_level || null,
      };

      if (editingMembership) {
        const { error } = await supabase
          .from("memberships")
          .update(membershipData)
          .eq("id", editingMembership.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Membership updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("memberships")
          .insert([membershipData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Membership created successfully",
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchMemberships();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleEdit = (membership: Membership) => {
    setEditingMembership(membership);
    setFormData({
      name: membership.name,
      price: membership.price?.toString() || "",
      duration_days: membership.duration_days?.toString() || "",
      access_level: membership.access_level || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this membership?")) return;

    try {
      const { error } = await supabase
        .from("memberships")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Membership deleted successfully",
      });

      fetchMemberships();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manage Memberships</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Membership
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingMembership ? "Edit Membership" : "Add New Membership"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Gold Membership"
                  required
                />
              </div>
              <div>
                <Label htmlFor="price">Price (£)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="e.g., 49.99"
                />
              </div>
              <div>
                <Label htmlFor="duration_days">Duration (Days)</Label>
                <Input
                  id="duration_days"
                  type="number"
                  value={formData.duration_days}
                  onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                  placeholder="e.g., 30"
                />
              </div>
              <div>
                <Label htmlFor="access_level">Access Level</Label>
                <Input
                  id="access_level"
                  value={formData.access_level}
                  onChange={(e) => setFormData({ ...formData, access_level: e.target.value })}
                  placeholder="e.g., Full Access"
                />
              </div>
              <Button type="submit" className="w-full">
                {editingMembership ? "Update" : "Create"} Membership
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Membership Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Access Level</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberships.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No memberships found
                  </TableCell>
                </TableRow>
              ) : (
                memberships.map((membership) => (
                  <TableRow key={membership.id}>
                    <TableCell className="font-medium">{membership.name}</TableCell>
                    <TableCell>
                      {membership.price ? `£${membership.price.toFixed(2)}` : "-"}
                    </TableCell>
                    <TableCell>
                      {membership.duration_days ? `${membership.duration_days} days` : "-"}
                    </TableCell>
                    <TableCell>{membership.access_level || "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(membership)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(membership.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminManageMemberships;
