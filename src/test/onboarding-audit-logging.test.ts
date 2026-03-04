import { describe, expect, it, beforeEach } from 'vitest';
import {
  createOnboardingSession,
  saveOrganization,
  saveContact,
  submitOnboardingDraft,
  decideOnboardingCase,
  provisionOnboardingCase,
} from '@/services/onboardingApi';
import { reportStore } from '@/stores/reportStore';

function clearOnboardingStorage() {
  localStorage.removeItem('kardit.onboarding.drafts.v1');
  localStorage.removeItem('kardit.onboarding.cases.v1');
}

describe('onboarding decision audit logging', () => {
  beforeEach(() => {
    clearOnboardingStorage();
  });

  it('writes audit log entries for decision and provisioning', async () => {
    const before = reportStore.getAuditLogs();

    const sess = await createOnboardingSession({
      channel: 'web',
      email: 'aff@example.com',
      phone: '+1234567890',
      consentAccepted: true,
    });

    await saveOrganization(sess.draftId, {
      legalName: 'Example Affiliate LLC',
      registrationNumber: 'REG-123',
      country: 'NG',
      addressLine1: '1 Example Street',
      city: 'Lagos',
      state: 'LA',
    });

    await saveContact(sess.draftId, {
      contactName: 'Jane Reviewer',
      contactEmail: 'jane@example.com',
      contactPhone: '+23400000000',
    });

    const submitted = await submitOnboardingDraft(sess.draftId, {
      onboardingSessionId: sess.onboardingSessionId,
      declarations: { infoAccurate: true, authorizedSigner: true },
    });

    await decideOnboardingCase(submitted.caseId, { decision: 'APPROVE', reason: 'ok' }, { userEmail: 'sp@kardit.app' });

    const afterDecision = reportStore.getAuditLogs();
    expect(afterDecision.length).toBe(before.length + 1);
    expect(afterDecision[0]).toMatchObject({
      actionType: 'ONBOARDING_DECISION',
      entityType: 'OnboardingCase',
      entityId: submitted.caseId,
      userEmail: 'sp@kardit.app',
    });
    expect(afterDecision[0].oldValue?.status).toBe('SUBMITTED');
    expect(afterDecision[0].newValue?.status).toBe('APPROVED');

    await provisionOnboardingCase(submitted.caseId, { userEmail: 'sp@kardit.app' });

    const afterProvision = reportStore.getAuditLogs();
    expect(afterProvision.length).toBe(before.length + 2);
    expect(afterProvision[0]).toMatchObject({
      actionType: 'ONBOARDING_PROVISION',
      entityType: 'OnboardingCase',
      entityId: submitted.caseId,
      userEmail: 'sp@kardit.app',
    });
    expect(afterProvision[0].oldValue?.status).toBe('APPROVED');
    expect(afterProvision[0].newValue?.status).toBe('PROVISIONED');
  });
});
