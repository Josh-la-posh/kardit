import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Calendar, FileText, Users, Building2, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ReportType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  format: 'csv' | 'pdf' | 'both';
}

const reportTypes: ReportType[] = [
  {
    id: 'affiliates',
    name: 'Affiliates Report',
    description: 'Download all affiliates data including status and details',
    icon: <Building2 className="h-6 w-6" />,
    format: 'both',
  },
  {
    id: 'banks',
    name: 'Banks Report',
    description: 'Download all banks data with their portfolio metrics',
    icon: <Building2 className="h-6 w-6" />,
    format: 'both',
  },
  {
    id: 'users',
    name: 'Users Report',
    description: 'Download all users data with roles and status',
    icon: <Users className="h-6 w-6" />,
    format: 'both',
  },
  {
    id: 'cards',
    name: 'Cards Report',
    description: 'Download all cards data with balances and status',
    icon: <CreditCard className="h-6 w-6" />,
    format: 'both',
  },
  {
    id: 'audits',
    name: 'Audit Logs Report',
    description: 'Download audit logs with timestamps and changes',
    icon: <AlertCircle className="h-6 w-6" />,
    format: 'both',
  },
//   {
//     id: 'transactions',
//     name: 'Transactions Report',
//     description: 'Download transaction records with amounts and dates',
//     icon: <FileText className="h-6 w-6" />,
//     format: 'both',
//   },
];

export default function SuperAdminReportsPage() {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'pdf'>('csv');
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (reportId: string, reportName: string) => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    if (startDateObj > endDateObj) {
      toast.error('Start date must be before end date');
      return;
    }

    setDownloading(reportId);
    try {
      // Simulate download
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const fileName = `${reportName.toLowerCase().replace(/\s+/g, '-')}-report-${startDate}-to-${endDate}.${selectedFormat}`;
      toast.success(`Downloaded: ${fileName}`);
      
      // In a real app, you would trigger actual file download here
      console.log(`Downloading ${reportName} from ${startDate} to ${endDate} as ${selectedFormat}`);
    } catch (err) {
      toast.error('Failed to download report');
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadAllReports = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    if (startDateObj > endDateObj) {
      toast.error('Start date must be before end date');
      return;
    }

    setDownloading('all');
    try {
      // Simulate batch download
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('All reports downloaded as ZIP archive');
      console.log(`Downloading all reports from ${startDate} to ${endDate}`);
    } catch (err) {
      toast.error('Failed to download reports');
    } finally {
      setDownloading(null);
    }
  };

  const isValidDateRange = startDate && endDate && new Date(startDate) <= new Date(endDate);

  return (
    <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
      <AppLayout navVariant="service-provider">
        <div className="animate-fade-in space-y-6">
          <PageHeader
            title="Reports"
            subtitle="Download batch reports for affiliates, banks, users, audits, and more"
            showBack={false}
          />

          {/* Date Range Filter */}
          <Card className="border-0 shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Report Date Range
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="start-date" className="text-sm font-semibold mb-2 block">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="end-date" className="text-sm font-semibold mb-2 block">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="format" className="text-sm font-semibold mb-2 block">Format</Label>
                <select
                  id="format"
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value as 'csv' | 'pdf')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="csv">CSV</option>
                  <option value="pdf">PDF</option>
                </select>
              </div>
            </div>

            {isValidDateRange && (
              <div className="mt-4 flex gap-2">
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleDownloadAllReports}
                  disabled={downloading === 'all'}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {downloading === 'all' ? 'Downloading...' : 'Download All Reports'}
                </Button>
              </div>
            )}
          </Card>

          {/* Reports Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTypes.map((report) => (
              <Card key={report.id} className="border-0 shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                      {report.icon}
                    </div>
                    <h3 className="text-lg font-semibold">{report.name}</h3>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4">{report.description}</p>

                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => handleDownload(report.id, report.name)}
                  disabled={!isValidDateRange || downloading === report.id}
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {downloading === report.id ? 'Downloading...' : `Download (${selectedFormat.toUpperCase()})`}
                </Button>

                {!isValidDateRange && (
                  <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Select date range to download
                  </p>
                )}
              </Card>
            ))}
          </div>

          {/* Recent Exports */}
          {/* <Card className="border-0 shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Exports
            </h3>
            <div className="space-y-3">
              {[
                { name: 'Affiliates Report', date: '2024-03-15', status: 'completed' },
                { name: 'Banks Report', date: '2024-03-14', status: 'completed' },
                { name: 'Users Report', date: '2024-03-10', status: 'completed' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.status === 'completed' && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                    <Button variant="outline" size="sm">Download</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card> */}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
