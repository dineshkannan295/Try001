import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface JobStats {
  total: number;
  pending: number;
  processing: number;
  query: number;
  complete: number;
  completionRate: number;
}

interface UserActivity {
  declarant_name: string;
  total_jobs: number;
  completed_jobs: number;
}

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

const ReportingDashboard = () => {
  const [jobStats, setJobStats] = useState<JobStats>({
    total: 0,
    pending: 0,
    processing: 0,
    query: 0,
    complete: 0,
    completionRate: 0,
  });
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportingData();

    const channel = supabase
      .channel("jobs_reporting")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "jobs" },
        () => {
          fetchReportingData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchReportingData = async () => {
    try {
      // Fetch all jobs with status counts
      const { data: jobs } = await supabase
        .from("jobs")
        .select("status, allocated_to, profiles!jobs_allocated_to_fkey(full_name)");

      if (jobs) {
        const stats: JobStats = {
          total: jobs.length,
          pending: jobs.filter((j) => j.status === "pending").length,
          processing: jobs.filter((j) => j.status === "processing").length,
          query: jobs.filter((j) => j.status === "query").length,
          complete: jobs.filter((j) => j.status === "complete").length,
          completionRate: jobs.length > 0 ? (jobs.filter((j) => j.status === "complete").length / jobs.length) * 100 : 0,
        };
        setJobStats(stats);

        // Calculate user activity
        const activityMap = new Map<string, { total: number; completed: number }>();
        jobs.forEach((job) => {
          if (job.allocated_to && job.profiles) {
            const name = (job.profiles as any).full_name;
            if (!activityMap.has(name)) {
              activityMap.set(name, { total: 0, completed: 0 });
            }
            const activity = activityMap.get(name)!;
            activity.total++;
            if (job.status === "complete") {
              activity.completed++;
            }
          }
        });

        const activity: UserActivity[] = Array.from(activityMap.entries()).map(([name, stats]) => ({
          declarant_name: name,
          total_jobs: stats.total,
          completed_jobs: stats.completed,
        }));

        setUserActivity(activity);
      }
    } catch (error) {
      console.error("Error fetching reporting data:", error);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading reports...</p>
      </div>
    );
  }

  const statusData = [
    { name: "Pending", value: jobStats.pending },
    { name: "Processing", value: jobStats.processing },
    { name: "Query", value: jobStats.query },
    { name: "Complete", value: jobStats.complete },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobStats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobStats.complete}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobStats.completionRate.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobStats.processing + jobStats.query}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Job Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={userActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="declarant_name" stroke="hsl(var(--foreground))" />
                <YAxis stroke="hsl(var(--foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--background))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)"
                  }} 
                />
                <Legend />
                <Bar dataKey="total_jobs" fill="hsl(var(--chart-1))" name="Total Jobs" />
                <Bar dataKey="completed_jobs" fill="hsl(var(--chart-2))" name="Completed Jobs" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportingDashboard;
