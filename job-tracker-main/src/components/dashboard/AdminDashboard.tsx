import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import JobTable from "@/components/jobs/JobTable";
import JobForm from "@/components/jobs/JobForm";
import ExcelUpload from "@/components/jobs/ExcelUpload";
import UserRoleManager from "@/components/admin/UserRoleManager";
import ReportingDashboard from "@/components/dashboard/ReportingDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload } from "lucide-react";

interface AdminDashboardProps {
  userId: string;
}

const AdminDashboard = ({ userId }: AdminDashboardProps) => {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<any[]>([]);
  const [showJobForm, setShowJobForm] = useState(false);
  const [showExcelUpload, setShowExcelUpload] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from("jobs")
      .select(`
        *,
        allocated_by_profile:profiles!jobs_allocated_by_fkey(employee_id, full_name),
        allocated_to_profile:profiles!jobs_allocated_to_fkey(employee_id, full_name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch jobs",
        variant: "destructive",
      });
    } else {
      setJobs(data || []);
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
  }, []);

  const handleDelete = async (jobId: string) => {
    const { error } = await supabase.from("jobs").delete().eq("id", jobId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete job",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Job deleted successfully",
      });
    }
  };

  const handleEdit = (job: any) => {
    setEditingJob(job);
    setShowJobForm(true);
  };

  const handleFormClose = () => {
    setShowJobForm(false);
    setEditingJob(null);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="reports" className="w-full">
        <TabsList className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 p-1">
          <TabsTrigger value="reports" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Reports</TabsTrigger>
          <TabsTrigger value="jobs" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">Jobs Management</TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">User Roles</TabsTrigger>
        </TabsList>

        <TabsContent value="reports">
          <ReportingDashboard />
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <div className="flex justify-between items-center p-6 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 rounded-xl border-2 border-primary/10">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">All Jobs</h2>
            <div className="flex gap-2">
              <Button onClick={() => setShowExcelUpload(true)} className="bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-lg">
                <Upload className="mr-2 h-4 w-4" />
                Upload Excel
              </Button>
              <Button onClick={() => setShowJobForm(true)} className="bg-primary hover:bg-primary/90 shadow-lg">Create Job</Button>
            </div>
          </div>

          {showJobForm && (
            <JobForm
              userId={userId}
              onClose={handleFormClose}
              editingJob={editingJob}
            />
          )}

          {showExcelUpload && (
            <ExcelUpload
              userId={userId}
              onClose={() => setShowExcelUpload(false)}
            />
          )}

          <JobTable
            jobs={jobs}
            onEdit={handleEdit}
            onDelete={handleDelete}
            showAllActions={true}
          />
        </TabsContent>

        <TabsContent value="users">
          <UserRoleManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
