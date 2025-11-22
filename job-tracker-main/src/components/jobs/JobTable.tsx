import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Trash2, CheckCircle, Clock } from "lucide-react";

interface JobTableProps {
  jobs: any[];
  onEdit?: (job: any) => void;
  onDelete?: (jobId: string) => void;
  onTakeJob?: (jobId: string) => void;
  onUpdateStatus?: (job: any) => void;
  showAllActions?: boolean;
  showTakeAction?: boolean;
  showStatusUpdate?: boolean;
}

const JobTable = ({
  jobs,
  onEdit,
  onDelete,
  onTakeJob,
  onUpdateStatus,
  showAllActions,
  showTakeAction,
  showStatusUpdate,
}: JobTableProps) => {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-warning text-warning-foreground";
      case "processing":
        return "bg-info text-info-foreground";
      case "query":
        return "bg-accent text-accent-foreground";
      case "complete":
        return "bg-success text-success-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (jobs.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-primary/20 p-12 text-center">
        <p className="text-lg text-muted-foreground">No jobs found</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-primary/10 overflow-hidden shadow-lg bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 hover:from-primary/15 hover:via-secondary/15 hover:to-accent/15">
            <TableHead className="font-bold text-foreground">Job Ref</TableHead>
            <TableHead className="font-bold text-foreground">Importer/Exporter</TableHead>
            <TableHead className="font-bold text-foreground">ETD</TableHead>
            <TableHead className="font-bold text-foreground">Received</TableHead>
            <TableHead className="font-bold text-foreground">Status</TableHead>
            <TableHead className="font-bold text-foreground">Allocated To</TableHead>
            <TableHead className="font-bold text-foreground">Allocated By</TableHead>
            {(showAllActions || showTakeAction || showStatusUpdate) && (
              <TableHead className="font-bold text-foreground text-right">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job, index) => (
            <TableRow
              key={job.id}
              className={`
                transition-all hover:bg-gradient-to-r 
                ${index % 2 === 0 
                  ? 'hover:from-primary/5 hover:to-secondary/5' 
                  : 'hover:from-secondary/5 hover:to-accent/5'
                }
              `}
            >
              <TableCell className="font-semibold text-primary">{job.job_ref}</TableCell>
              <TableCell className="text-foreground">{job.importer_name}</TableCell>
              <TableCell className="text-muted-foreground">
                {job.etd ? format(new Date(job.etd), "PP") : "-"}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {format(new Date(job.received_time), "PPp")}
              </TableCell>
              <TableCell>
                <Badge className={`${getStatusVariant(job.status)} font-semibold shadow-sm`}>
                  {job.status}
                </Badge>
              </TableCell>
              <TableCell className="text-foreground">
                {job.allocated_to_profile ? (
                  <div className="flex flex-col">
                    <span className="font-medium">{job.allocated_to_profile.full_name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({job.allocated_to_profile.employee_id})
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground italic">Unassigned</span>
                )}
              </TableCell>
              <TableCell className="text-foreground">
                {job.allocated_by_profile ? (
                  <div className="flex flex-col">
                    <span className="font-medium">{job.allocated_by_profile.full_name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({job.allocated_by_profile.employee_id})
                    </span>
                  </div>
                ) : (
                  "-"
                )}
              </TableCell>
              {(showAllActions || showTakeAction || showStatusUpdate) && (
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    {showTakeAction && onTakeJob && (
                      <Button 
                        onClick={() => onTakeJob(job.id)} 
                        size="sm"
                        className="bg-success hover:bg-success/90 text-success-foreground shadow-md"
                      >
                        <CheckCircle className="mr-1 h-4 w-4" />
                        Take
                      </Button>
                    )}
                    {showStatusUpdate && onUpdateStatus && (
                      <Button 
                        onClick={() => onUpdateStatus(job)} 
                        size="sm"
                        className="bg-info hover:bg-info/90 text-info-foreground shadow-md"
                      >
                        <Clock className="mr-1 h-4 w-4" />
                        Update
                      </Button>
                    )}
                    {showAllActions && (
                      <>
                        {onEdit && (
                          <Button 
                            onClick={() => onEdit(job)} 
                            size="sm" 
                            variant="outline"
                            className="border-primary/50 text-primary hover:bg-primary/10 shadow-sm"
                          >
                            <Edit className="mr-1 h-4 w-4" />
                            Edit
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            onClick={() => onDelete(job.id)}
                            size="sm"
                            variant="destructive"
                            className="shadow-md"
                          >
                            <Trash2 className="mr-1 h-4 w-4" />
                            Delete
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default JobTable;
