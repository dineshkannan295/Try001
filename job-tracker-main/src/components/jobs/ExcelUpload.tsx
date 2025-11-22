import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

interface ExcelUploadProps {
  userId: string;
  onClose: () => void;
}

const ExcelUpload = ({ userId, onClose }: ExcelUploadProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (!jsonData || jsonData.length === 0) {
        toast({
          title: "Error",
          description: "The Excel file is empty",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Check for required headers
      const firstRow: any = jsonData[0];
      const hasJobRef = "Job Ref" in firstRow || "job_ref" in firstRow;
      const hasImporterName = "Importer/Exporter" in firstRow || "Importer Name" in firstRow || "importer_name" in firstRow;

      if (!hasJobRef || !hasImporterName) {
        toast({
          title: "Error",
          description: "Excel file must contain 'Job Ref' and 'Importer/Exporter' columns",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Parse and prepare jobs for insertion
      const jobs = jsonData.map((row: any) => ({
        job_ref: row["Job Ref"] || row["job_ref"],
        importer_name: row["Importer/Exporter"] || row["Importer Name"] || row["importer_name"],
        etd: row["ETD"] || row["etd"] || null,
        allocated_by: userId,
        status: "pending" as const,
      })).filter(job => job.job_ref && job.importer_name);

      if (jobs.length === 0) {
        toast({
          title: "Error",
          description: "No valid job data found in the Excel file",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Insert jobs into database
      const { error } = await supabase.from("jobs").insert(jobs);

      if (error) {
        toast({
          title: "Error",
          description: error.code === "23505"
            ? "Some job references already exist"
            : "Failed to upload jobs. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Successfully uploaded ${jobs.length} job(s)`,
        });
        onClose();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to parse Excel file. Please check the file format.",
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Excel File</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="excel">Select Excel File</Label>
            <Input
              id="excel"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Expected columns: <strong>Job Ref</strong>, <strong>Importer/Exporter</strong>, and <strong>ETD</strong> (optional)
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Close
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExcelUpload;
