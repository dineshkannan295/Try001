import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import JobTable from "@/components/jobs/JobTable";
import JobStatusUpdate from "@/components/jobs/JobStatusUpdate";

interface DeclarantDashboardProps {
  userId: string;
}

const DeclarantDashboard = ({ userId }: DeclarantDashboardProps) => {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<any[]>([]);
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [updatingJob, setUpdatingJob] = useState<any>(null);

  const fetchJobs = async () => {
    const { data: myJobs, error: myJobsError } = await supabase
      .from("jobs")
      .select(`
        *,
        allocated_by_profile:profiles!jobs_allocated_by_fkey(employee_id, full_name),
        allocated_to_profile:profiles!jobs_allocated_to_fkey(employee_id, full_name)
      `)
      .eq("allocated_to", userId)
      .order("created_at", { ascending: false });

    const { data: unallocatedJobs, error: unallocatedError } = await supabase
      .from("jobs")
      .select(`
        *,
        allocated_by_profile:profiles!jobs_allocated_by_fkey(employee_id, full_name)
      `)
      .is("allocated_to", null)
      .order("created_at", { ascending: false });

    if (myJobsError) {
      toast({
        title: "Error",
        description: "Failed to fetch your jobs",
        variant: "destructive",
      });
    } else {
      setJobs(myJobs || []);
    }

    if (!unallocatedError) {
      setAvailableJobs(unallocatedJobs || []);
    }
  };

  useEffect(() => {
    fetchJobs();

    const channel = supabase
      .channel("jobs-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "jobs",
        },
        () => {
          fetchJobs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const handleTakeJob = async (jobId: string) => {
    const { error } = await supabase
      .from("jobs")
      .update({ allocated_to: userId, status: "processing" })
      .eq("id", jobId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to take job",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Job assigned to you",
      });
    }
  };

  const handleUpdateStatus = (job: any) => {
    setUpdatingJob(job);
  };

  const handleStatusUpdateClose = () => {
    setUpdatingJob(null);
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="p-6 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 rounded-xl border-2 border-primary/10 mb-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">My Jobs</h2>
        </div>
        <JobTable
          jobs={jobs}
          onUpdateStatus={handleUpdateStatus}
          showStatusUpdate={true}
        />
      </div>

      <div>
        <div className="p-6 bg-gradient-to-r from-accent/5 via-success/5 to-info/5 rounded-xl border-2 border-accent/10 mb-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-accent via-success to-info bg-clip-text text-transparent">Available Jobs</h2>
        </div>
        <JobTable
          jobs={availableJobs}
          onTakeJob={handleTakeJob}
          showTakeAction={true}
        />
      </div>

      {updatingJob && (
        <JobStatusUpdate job={updatingJob} onClose={handleStatusUpdateClose} />
      )}
    </div>
  );
};

export default DeclarantDashboard;
