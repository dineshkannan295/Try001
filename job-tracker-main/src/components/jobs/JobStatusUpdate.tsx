import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const statusUpdateSchema = z.object({
  queryDetails: z.string().trim().min(1, "Query details are required").max(1000, "Query details must be less than 1000 characters")
});

interface JobStatusUpdateProps {
  job: any;
  onClose: () => void;
}

const JobStatusUpdate = ({ job, onClose }: JobStatusUpdateProps) => {
  const { toast } = useToast();
  const [status, setStatus] = useState(job.status);
  const [queryDetails, setQueryDetails] = useState(job.query_details || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (status === "query") {
        const validationResult = statusUpdateSchema.safeParse({ queryDetails });
        
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
      }

      const updateData: any = {
        status,
        query_details: status === "query" ? queryDetails : null,
      };

      const { error } = await supabase
        .from("jobs")
        .update(updateData)
        .eq("id", job.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update status. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Job status updated successfully",
        });
        onClose();
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Update Job Status</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Job: {job.job_ref}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
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

            {status === "query" && (
              <div className="space-y-2">
                <Label htmlFor="queryDetails">What is the query?</Label>
                <Textarea
                  id="queryDetails"
                  value={queryDetails}
                  onChange={(e) => setQueryDetails(e.target.value)}
                  placeholder="Describe the query or issue..."
                  rows={4}
                  required
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default JobStatusUpdate;
