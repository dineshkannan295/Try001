import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface JobListProps {
  jobs: any[];
  onEdit?: (job: any) => void;
  onDelete?: (jobId: string) => void;
  onTakeJob?: (jobId: string) => void;
  onUpdateStatus?: (job: any) => void;
  showAllActions?: boolean;
  showTakeAction?: boolean;
  showStatusUpdate?: boolean;
}

const JobList = ({
  jobs,
  onEdit,
  onDelete,
  onTakeJob,
  onUpdateStatus,
  showAllActions,
  showTakeAction,
  showStatusUpdate,
}: JobListProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "processing":
        return "bg-blue-500";
      case "query":
        return "bg-orange-500";
      case "complete":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No jobs found
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <Card key={job.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{job.job_ref}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {job.importer_name}
                </p>
              </div>
              <Badge className={getStatusColor(job.status)}>
                {job.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Received Time:</p>
                <p>{format(new Date(job.received_time), "PPpp")}</p>
              </div>
              {job.etd && (
                <div>
                  <p className="text-muted-foreground">ETD:</p>
                  <p>{format(new Date(job.etd), "PP")}</p>
                </div>
              )}
              {job.allocated_by_profile && (
                <div>
                  <p className="text-muted-foreground">Allocated By:</p>
                  <p>
                    {job.allocated_by_profile.full_name} (
                    {job.allocated_by_profile.employee_id})
                  </p>
                </div>
              )}
              {job.allocated_to_profile && (
                <div>
                  <p className="text-muted-foreground">Allocated To:</p>
                  <p>
                    {job.allocated_to_profile.full_name} (
                    {job.allocated_to_profile.employee_id})
                  </p>
                </div>
              )}
              {job.query_details && (
                <div className="col-span-2">
                  <p className="text-muted-foreground">Query Details:</p>
                  <p className="text-orange-600">{job.query_details}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              {showTakeAction && onTakeJob && (
                <Button onClick={() => onTakeJob(job.id)} size="sm">
                  Take Job
                </Button>
              )}
              {showStatusUpdate && onUpdateStatus && (
                <Button onClick={() => onUpdateStatus(job)} size="sm">
                  Update Status
                </Button>
              )}
              {showAllActions && (
                <>
                  {onEdit && (
                    <Button onClick={() => onEdit(job)} size="sm" variant="outline">
                      Edit
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      onClick={() => onDelete(job.id)}
                      size="sm"
                      variant="destructive"
                    >
                      Delete
                    </Button>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default JobList;
