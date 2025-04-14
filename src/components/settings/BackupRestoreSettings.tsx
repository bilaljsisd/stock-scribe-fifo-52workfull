import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { exportDataToFile, importDataFromFile } from '@/lib/localStorageUtils';
import { toast } from 'sonner';

export function BackupRestoreSettings() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleExport = () => {
    exportDataToFile();
    toast.success('Data exported successfully');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleImport = () => {
    if (selectedFile) {
      importDataFromFile(selectedFile);
      toast.success('Data imported successfully. Reloading...');
    } else {
      toast.error('Please select a backup file first');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backup & Restore</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Button onClick={handleExport} variant="outline">
            Export Data Backup
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            Create a JSON backup of all your inventory data
          </p>
        </div>
        
        <div className="space-y-2">
          <input 
            type="file" 
            accept=".json" 
            onChange={handleFileSelect} 
            className="w-full"
          />
          <Button 
            onClick={handleImport} 
            variant="secondary" 
            disabled={!selectedFile}
          >
            Restore from Backup
          </Button>
          <p className="text-sm text-muted-foreground">
            Select a previously exported JSON backup file
          </p>
        </div>
      </CardContent>
    </Card>
  );
}