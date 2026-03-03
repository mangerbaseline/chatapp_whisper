"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Coins,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

interface Plan {
  _id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  tokens: number;
  isActive: boolean;
  createdBy?: { firstName: string; lastName: string; email: string };
  createdAt: string;
}

export default function ManagePlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    currency: "usd",
    tokens: "",
  });

  const fetchPlans = async () => {
    try {
      const res = await axios.get("/api/admin/plans");
      setPlans(res.data.data);
    } catch {
      toast.error("Failed to fetch plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      price: "",
      currency: "usd",
      tokens: "",
    });
    setEditingPlan(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      description: plan.description,
      price: plan.price.toString(),
      currency: plan.currency,
      tokens: plan.tokens.toString(),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.price || !form.tokens) {
      toast.error("Name, price, and tokens are required.");
      return;
    }
    setSaving(true);
    try {
      const data = {
        name: form.name,
        description: form.description,
        price: parseInt(form.price),
        currency: form.currency,
        tokens: parseInt(form.tokens),
      };

      if (editingPlan) {
        await axios.patch(`/api/admin/plans/${editingPlan._id}`, data);
        toast.success("Plan updated!");
      } else {
        await axios.post("/api/admin/plans", data);
        toast.success("Plan created!");
      }
      setDialogOpen(false);
      resetForm();
      fetchPlans();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save plan");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (plan: Plan) => {
    try {
      await axios.patch(`/api/admin/plans/${plan._id}`, {
        isActive: !plan.isActive,
      });
      toast.success(`Plan ${plan.isActive ? "deactivated" : "activated"}!`);
      fetchPlans();
    } catch {
      toast.error("Failed to toggle plan");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/admin/plans/${id}`);
      toast.success("Plan deleted!");
      fetchPlans();
    } catch {
      toast.error("Failed to delete plan");
    }
  };

  const formatCurrency = (amount: number, currency: string = "usd") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" /> Token Plans
          </h2>
          <p className="text-sm text-muted-foreground">
            Create and manage token plans for users to purchase.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="cursor-pointer">
              <Plus className="h-4 w-4 mr-2" /> New Plan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingPlan ? "Edit Plan" : "Create Plan"}
              </DialogTitle>
              <DialogDescription>
                {editingPlan
                  ? "Update the plan details below."
                  : "Fill in the details to create a new token plan."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Plan Name</label>
                <Input
                  placeholder="e.g., Starter Pack"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  placeholder="Optional description"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Price (in cents)
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g., 500 = $5.00"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Currency</label>
                  <Input
                    placeholder="usd"
                    value={form.currency}
                    onChange={(e) =>
                      setForm({ ...form, currency: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tokens</label>
                <Input
                  type="number"
                  placeholder="Number of tokens user gets"
                  value={form.tokens}
                  onChange={(e) => setForm({ ...form, tokens: e.target.value })}
                />
              </div>
              <Button
                onClick={handleSubmit}
                disabled={saving}
                className="w-full cursor-pointer"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editingPlan ? (
                  "Update Plan"
                ) : (
                  "Create Plan"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {plans.length === 0 ? (
        <Card>
          <CardContent className="text-center py-10">
            <Coins className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground">
              No plans yet. Create your first plan!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Tokens</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan._id} className="hover:bg-muted/50">
                  <TableCell>
                    <div>
                      <p className="font-medium">{plan.name}</p>
                      {plan.description && (
                        <p className="text-xs text-muted-foreground">
                          {plan.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(plan.price, plan.currency)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      <Coins className="h-3 w-3 mr-1" /> {plan.tokens}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={plan.isActive ? "default" : "destructive"}>
                      {plan.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggle(plan)}
                      className="cursor-pointer"
                    >
                      {plan.isActive ? (
                        <ToggleRight className="h-4 w-4" />
                      ) : (
                        <ToggleLeft className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(plan)}
                      className="cursor-pointer"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Plan</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete &quot;{plan.name}
                            &quot;? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(plan._id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
