import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { useIssuingBank } from '@/hooks/useIssuingBank';
import { ChevronLeft, Building2, Mail, Phone, MapPin, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function IssuingBankDetailPage() {
  const { bankId } = useParams<{ bankId: string }>();
  const navigate = useNavigate();
  const { bank, isLoading, error, updateBankDetails } = useIssuingBank(bankId);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (isLoading) {
    return (
      <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
        <AppLayout navVariant="service-provider">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="h-8 w-8 border-4 border-border border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading bank details...</p>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  if (error || !bank) {
    return (
      <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
        <AppLayout navVariant="service-provider">
          <div className="text-center py-20">
            <AlertCircle className="h-10 w-10 mx-auto text-red-500 mb-4" />
            <p className="text-red-600 mb-6">{error || 'Bank not found'}</p>
            <Button variant="outline" onClick={() => navigate('/super-admin/banks')}>
              <ChevronLeft className="h-4 w-4 mr-2" /> Back to Banks
            </Button>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  const handleStartEdit = (field: string, value: string) => {
    setIsEditing(field);
    setEditValue(value);
  };

  const handleCancelEdit = () => {
    setIsEditing(null);
    setEditValue('');
  };

  const handleSaveEdit = async (field: string) => {
    if (!editValue.trim()) {
      toast.error('Value cannot be empty');
      return;
    }

    // Validate email if it's an email field
    if (field === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editValue.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Validate phone if it's a phone field
    if (field === 'phone' && !/^\+?[\d\s\-()]{7,20}$/.test(editValue.trim())) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setIsSaving(true);
    try {
      const updates: Record<string, any> = {
        bankDetails: { ...bank.bankDetails }
      };

      if (field === 'email') {
        updates.bankDetails.contactEmail = editValue.trim();
      } else if (field === 'phone') {
        updates.bankDetails.contactPhone = editValue.trim();
      } else if (field === 'address') {
        updates.bankDetails.bankAddress = editValue.trim();
      } else if (field === 'info') {
        updates.bankDetails.additionalInfo = editValue.trim();
      }

      await updateBankDetails(updates);
      toast.success('Bank details updated successfully');
      setIsEditing(null);
      setEditValue('');
    } catch (err) {
      toast.error('Failed to update bank details');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
      <AppLayout navVariant="service-provider">
        <div className="animate-fade-in">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/issuing-banks')}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
          </div>

          <div className="max-w-3xl space-y-6">
            {/* Header Card */}
            <div className="kardit-card p-6 flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 p-3 bg-blue-100 rounded-lg">
                  <Building2 className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{bank.bankDetails.name}</h1>
                  <h3 className="text-lg font-medium text-foreground">{bank.bankDetails.shortName}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {bank.bankDetails.code} • {bank.bankDetails.country}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                  ✓ Active
                </span>
              </div>
            </div>

            {/* Contact Information */}
            <div className="kardit-card p-6">
              <h2 className="text-lg font-semibold mb-6">Contact Information</h2>

              <div className="space-y-6">
                {/* Email */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Contact Email
                    </label>
                    {/* <button
                      onClick={() => handleStartEdit('email', bank.bankDetails.contactEmail)}
                      className="text-xs text-primary hover:underline"
                      disabled={isEditing !== null && isEditing !== 'email'}
                    >
                      Edit
                    </button> */}
                  </div>

                  {isEditing === 'email' ? (
                    <div className="space-y-2">
                      <input
                        type="email"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit('email')}
                          disabled={isSaving}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-foreground">{bank.bankDetails.contactEmail}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Contact Phone
                    </label>
                    {/* <button
                      onClick={() => handleStartEdit('phone', bank.bankDetails.contactPhone)}
                      className="text-xs text-primary hover:underline"
                      disabled={isEditing !== null && isEditing !== 'phone'}
                    >
                      Edit
                    </button> */}
                  </div>

                  {isEditing === 'phone' ? (
                    <div className="space-y-2">
                      <input
                        type="tel"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit('phone')}
                          disabled={isSaving}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-foreground">{bank.bankDetails.contactPhone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="kardit-card p-6">
              <h2 className="text-lg font-semibold mb-6">Additional Information</h2>

              <div className="space-y-6">
                {/* Address */}
                {(bank.bankDetails.bankAddress || isEditing === 'address') && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Bank Address
                      </label>
                      {/* <button
                        onClick={() => handleStartEdit('address', bank.bankDetails.bankAddress || '')}
                        className="text-xs text-primary hover:underline"
                        disabled={isEditing !== null && isEditing !== 'address'}
                      >
                        Edit
                      </button> */}
                    </div>

                    {isEditing === 'address' ? (
                      <div className="space-y-2">
                        <textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          rows={3}
                          className="flex w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                            disabled={isSaving}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit('address')}
                            disabled={isSaving}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-foreground whitespace-pre-wrap">{bank.bankDetails.bankAddress}</p>
                    )}
                  </div>
                )}

                {/* Additional Info */}
                {(bank.bankDetails.additionalInfo || isEditing === 'info') && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Additional Information
                      </label>
                      <button
                        onClick={() => handleStartEdit('info', bank.bankDetails.additionalInfo || '')}
                        className="text-xs text-primary hover:underline"
                        disabled={isEditing !== null && isEditing !== 'info'}
                      >
                        Edit
                      </button>
                    </div>

                    {isEditing === 'info' ? (
                      <div className="space-y-2">
                        <textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          rows={3}
                          className="flex w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                            disabled={isSaving}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit('info')}
                            disabled={isSaving}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-foreground whitespace-pre-wrap">{bank.bankDetails.additionalInfo}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="kardit-card p-6">
              <h2 className="text-lg font-semibold mb-4">Details</h2>
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Bank Code</p>
                  <p className="font-semibold text-foreground">{bank.bankDetails.code}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Country</p>
                  <p className="font-semibold text-foreground">{bank.bankDetails.country}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Provisioned Date</p>
                  <p className="font-semibold text-foreground">
                    {bank.provisionedAt ? new Date(bank.provisionedAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Status</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ✓ Active
                  </span>
                </div>
              </div>
            </div>

            {bank.internalAffiliate && (
              <div className="kardit-card p-6">
                <h2 className="mb-4 text-lg font-semibold">Internal Affiliate Created</h2>
                <div className="grid grid-cols-1 gap-6 text-sm md:grid-cols-2">
                  <div>
                    <p className="mb-1 text-muted-foreground">Affiliate ID</p>
                    <p className="font-semibold text-foreground">{bank.internalAffiliate.affiliateId}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-muted-foreground">Affiliate Type</p>
                    <p className="font-semibold text-foreground">{bank.internalAffiliate.affiliateType}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-muted-foreground">Owner Bank ID</p>
                    <p className="font-semibold text-foreground">{bank.internalAffiliate.ownerBankId}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-muted-foreground">System Managed</p>
                    <p className="font-semibold text-foreground">{bank.internalAffiliate.isSystemManaged ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-muted-foreground">Affiliate Status</p>
                    <p className="font-semibold text-foreground">{bank.internalAffiliate.status}</p>
                  </div>
                  {bank.internalAffiliate.legalName && (
                    <div>
                      <p className="mb-1 text-muted-foreground">Legal Name</p>
                      <p className="font-semibold text-foreground">{bank.internalAffiliate.legalName}</p>
                    </div>
                  )}
                  {bank.internalAffiliate.shortName && (
                    <div>
                      <p className="mb-1 text-muted-foreground">Short Name</p>
                      <p className="font-semibold text-foreground">{bank.internalAffiliate.shortName}</p>
                    </div>
                  )}
                  {bank.internalPartnership && (
                    <div>
                      <p className="mb-1 text-muted-foreground">Partnership Request ID</p>
                      <p className="font-semibold text-foreground">{bank.internalPartnership.partnershipRequestId}</p>
                    </div>
                  )}
                  {bank.bankId && (
                    <div>
                      <p className="mb-1 text-muted-foreground">Bank ID</p>
                      <p className="font-semibold text-foreground">{bank.bankId}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
