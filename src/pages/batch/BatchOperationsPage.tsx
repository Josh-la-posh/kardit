import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { store } from '@/stores/mockStore';
import { Users, CreditCard, Upload, FileText, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

type BatchType = 'customers' | 'cards';

interface BatchUploadState {
  file: File | null;
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'failed';
  message?: string;
}

export default function BatchOperationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<BatchType>('customers');
  const [uploadState, setUploadState] = useState<BatchUploadState>({ file: null, status: 'idle' });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadState({ file, status: 'idle' });
    }
  };

  const handleUpload = async () => {
    if (!uploadState.file) return;

    setUploadState(s => ({ ...s, status: 'uploading' }));
    
    // Simulate upload delay
    await new Promise(r => setTimeout(r, 1000));
    setUploadState(s => ({ ...s, status: 'processing' }));
    
    // Simulate processing
    await new Promise(r => setTimeout(r, 1500));

    // Add batch record
    store.addBatch(uploadState.file.name, user?.tenantId || 'tenant_alpha_affiliate');
    
    setUploadState({ file: null, status: 'completed', message: 'Batch uploaded successfully' });
    toast.success(`${activeTab === 'customers' ? 'Customer' : 'Card'} batch uploaded for processing`);
  };

  const resetUpload = () => {
    setUploadState({ file: null, status: 'idle' });
  };

  const tabs = [
    { id: 'customers' as BatchType, label: 'Batch Customer Creation', icon: Users, description: 'Upload a CSV file to create multiple customers at once' },
    { id: 'cards' as BatchType, label: 'Batch Card Creation', icon: CreditCard, description: 'Upload a CSV file to issue cards for multiple customers' },
  ];

  const activeTabInfo = tabs.find(t => t.id === activeTab)!;

  return (
    <ProtectedRoute requiredStakeholderTypes={['AFFILIATE']}>
      <AppLayout>
        <div className="animate-fade-in">
          <PageHeader
            title="Batch Operations"
            subtitle="Bulk processing for customers and cards"
          />

          {/* Tab Navigation */}
          <div className="kardit-card p-1 mb-6">
            <div className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); resetUpload(); }}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upload Area */}
            <div className="lg:col-span-2">
              <div className="kardit-card p-6">
                <div className="flex items-start gap-3 mb-6">
                  <div className="rounded-lg bg-primary/10 p-2.5">
                    <activeTabInfo.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-medium">{activeTabInfo.label}</h2>
                    <p className="text-sm text-muted-foreground">{activeTabInfo.description}</p>
                  </div>
                </div>

                {uploadState.status === 'completed' ? (
                  <div className="text-center py-8">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <CheckCircle className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Upload Complete</h3>
                    <p className="text-sm text-muted-foreground mb-4">{uploadState.message}</p>
                    <Button onClick={resetUpload}>Upload Another File</Button>
                  </div>
                ) : (
                  <>
                    {/* File Drop Zone */}
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center mb-4">
                      {uploadState.file ? (
                        <div className="space-y-2">
                          <FileText className="h-10 w-10 mx-auto text-primary" />
                          <p className="font-medium">{uploadState.file.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(uploadState.file.size / 1024).toFixed(1)} KB
                          </p>
                          {uploadState.status === 'idle' && (
                            <Button variant="outline" size="sm" onClick={resetUpload}>
                              Remove
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                          <p className="font-medium">Drop your CSV file here</p>
                          <p className="text-sm text-muted-foreground">or click to browse</p>
                          <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileSelect}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            style={{ position: 'relative' }}
                          />
                          <Button variant="outline" size="sm" asChild>
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileSelect}
                                className="hidden"
                              />
                              Browse Files
                            </label>
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Upload Button */}
                    <div className="flex justify-end gap-3">
                      <Button
                        onClick={handleUpload}
                        disabled={!uploadState.file || uploadState.status !== 'idle'}
                      >
                        {uploadState.status === 'uploading' && (
                          <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Uploading...</>
                        )}
                        {uploadState.status === 'processing' && (
                          <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Processing...</>
                        )}
                        {uploadState.status === 'idle' && (
                          <><Upload className="h-4 w-4 mr-1" /> Upload & Process</>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Instructions Sidebar */}
            <div className="space-y-4">
              <div className="kardit-card p-6">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  File Requirements
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• CSV format only</li>
                  <li>• Maximum 1,000 records per file</li>
                  <li>• UTF-8 encoding</li>
                  <li>• Headers required in first row</li>
                </ul>
              </div>

              <div className="kardit-card p-6">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {activeTab === 'customers' ? 'Customer Fields' : 'Card Fields'}
                </h3>
                <ul className="space-y-1 text-sm text-muted-foreground font-mono">
                  {activeTab === 'customers' ? (
                    <>
                      <li>first_name*</li>
                      <li>last_name*</li>
                      <li>email*</li>
                      <li>phone</li>
                      <li>date_of_birth</li>
                      <li>nationality</li>
                      <li>id_type</li>
                      <li>id_number</li>
                    </>
                  ) : (
                    <>
                      <li>customer_id*</li>
                      <li>emboss_name*</li>
                      <li>product_code*</li>
                      <li>issuing_bank*</li>
                      <li>currency*</li>
                      <li>delivery_method</li>
                    </>
                  )}
                </ul>
                <p className="text-xs text-muted-foreground mt-2">* Required fields</p>
              </div>

              <Button variant="outline" className="w-full" onClick={() => navigate('/customers/batches')}>
                View Batch History
              </Button>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
