import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const jobSchema = z.object({
  jobRef: z.string().trim().min(1, "Job reference is required").max(100, "Job reference must be less than 100 characters"),
  importerName: z.string().trim().min(1, "Importer/Exporter name is required").max(200, "Importer/Exporter name must be less than 200 characters"),
  etd: z.string().optional()
});

interface JobFormProps {
  userId: string;
  onClose: () => void;
  editingJob?: any;
}

const JobForm = ({ userId, onClose, editingJob }: JobFormProps) => {
  const { toast } = useToast();
  const [declarants, setDeclarants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDeclarants = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("user_id, profiles(id, employee_id, full_name)")
        .eq("role", "declarant");

      if (data) {
        setDeclarants(
          data.map((item: any) => ({
            id: item.profiles.id,
            employee_id: item.profiles.employee_id,
            full_name: item.profiles.full_name,
          }))
        );
      }
    };

    fetchDeclarants();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const jobRef = formData.get("jobRef") as string;
    const importerName = formData.get("importerName") as string;
    const etd = formData.get("etd") as string;
    const allocatedTo = formData.get("allocatedTo") as string;
    const status = formData.get("status") as string;

    try {
      const validationResult = jobSchema.safeParse({ jobRef, importerName, etd });
      
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast({
          title: "Validation Error",
          description: firstError.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
    
      const jobData = {
        job_ref: jobRef,
        importer_name: importerName,
        etd: etd || null,
        allocated_by: userId,
        allocated_to: allocatedTo || null,
        status: (status || "pending") as "pending" | "processing" | "query" | "complete",
      };

      if (editingJob) {
        const { error } = await supabase
          .from("jobs")
          .update(jobData)
          .eq("id", editingJob.id);

        if (error) {
          toast({
            title: "Error",
            description: error.code === "23505" 
              ? "This job reference already exists" 
              : "Failed to update job. Please try again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Success",
            description: "Job updated successfully",
          });
          onClose();
        }
      } else {
        const { error } = await supabase.from("jobs").insert([jobData]);

        if (error) {
          toast({
            title: "Error",
            description: error.code === "23505" 
              ? "This job reference already exists" 
              : "Failed to create job. Please try again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Success",
            description: "Job created successfully",
          });
          onClose();
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editingJob ? "Edit Job" : "Create New Job"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="jobRef">Job Reference</Label>
            <Input
              id="jobRef"
              name="jobRef"
              required
              defaultValue={editingJob?.job_ref}
              placeholder="Enter job reference"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="importerName">Importer/Exporter</Label>
            <Input
              id="importerName"
              name="importerName"
              required
              defaultValue={editingJob?.importer_name}
              placeholder="Enter importer/exporter name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="etd">ETD</Label>
            <Input
              id="etd"
              name="etd"
              type="date"
              defaultValue={editingJob?.etd}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="allocatedTo">Allocate To (Optional)</Label>
            <Select name="allocatedTo" defaultValue={editingJob?.allocated_to}>
              <SelectTrigger>
                <SelectValue placeholder="Select declarant" />
              </SelectTrigger>
              <SelectContent>
                {declarants.map((declarant) => (
                  <SelectItem key={declarant.id} value={declarant.id}>
                    {declarant.full_name} ({declarant.employee_id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {editingJob && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={editingJob?.status}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="query">Query</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : editingJob ? "Update" : "Create"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default JobForm;
