# Kardit Mini CMS — Frontend Implementation Extract (from SRS)

This is the minimal subset of the pasted SRS needed to complete the frontend UX and wire a typed API/service layer.

## 1) Stakeholders & governance boundaries

Stakeholder types
- `AFFILIATE`: operational users (customers, cards, loads, etc.) within their tenant.
- `BANK`: supervisory users with read-only visibility within bank portfolio scope.
- `SERVICE_PROVIDER` (Chamsswitch): global supervisory authority; only operational capability is onboarding/KYB decisions + provisioning credentials.

Separation rules (frontend must enforce)
- Tenant isolation: affiliate users only see and act within their `tenantId`.
- Bank scope: bank users can only view portfolio for their `bankId` and cannot trigger operational actions.
- Service provider scope: global read access; operational actions limited to onboarding decisions/provisioning.

## 2) Frontend-critical journeys (what screens to build)

### UJR002 — Sign-in (incl. first-login password change)
- Login collects username/email + password.
- If `requiresPasswordChange`, force password change before loading dashboard/scope.
- Handle locked/inactive users with dedicated messaging.

Screens
- `SCR-AUTH-01` Login Screen
- `SCR-AUTH-02` Dashboard Redirect (resolving scope)
- `SCR-AUTH-03` Force Password Change
- `SCR-AUTH-04` Account Locked Screen

### UJR003 — Forgot password (OTP/link + policy enforcement)
- Request reset by username/email.
- Verify OTP (or open reset link) then set new password.
- Enforce password policy; allow retry within token expiry.

Screens
- `SCR-FPWD-01` Request Reset
- `SCR-FPWD-02` Enter OTP / Reset Link
- `SCR-FPWD-03` Set New Password

### UJR001 — Affiliate onboarding & KYB (pre-tenant)
Affiliate self-onboarding (no login), then Chamsswitch approval.

Affiliate screens
- `SCR-ONB-01` Onboarding Start
- `SCR-ONB-02` Organization & Contact Details
- `SCR-ONB-03` KYB/KYC Document Upload
- `SCR-ONB-04` Select Issuing Banks
- `SCR-ONB-05` Review & Submit
- `SCR-ONB-06` Submission Success
- `SCR-ONB-07` Missing Data / Validation Errors
- `SCR-ONB-08` Onboarding Status Tracker
- `SCR-ONB-09` Clarification Response
- `SCR-ONB-10` Rejected Notice

Service provider (Chamsswitch) screens
- `SCR-ONB-11` Reviewer Case List
- `SCR-ONB-12` Reviewer Case Detail
- `SCR-ONB-13` Provisioning Result
- `SCR-ONB-14` Reject Case Modal
- `SCR-ONB-15` Clarification Request Modal

### UJR025 — Logout
- Ends session; tokens/cookies invalidated; returns to unauthenticated state.

Screens
- `SCR-LOGOUT-01` Logout Confirmation

### UJR019 / UJR023 / UJR024 — Dashboards & oversight (scope-based)
- Affiliate dashboard: tenant KPIs + operational module entry.
- Bank dashboard: bank portfolio KPIs + read-only drilldown.
- Service provider dashboard: global KPIs + onboarding decisions.

## 3) API contracts the frontend should code against

All authenticated endpoints require `Authorization: Bearer <accessToken>`.

### API-AUTH-01 — Login
- Endpoint: `/api/v1/auth/login`
- Method: `POST`

Request
```json
{
  "username": "ops@acmefinance.ng",
  "password": "TempPass#2026",
  "channel": "WEB",
  "deviceInfo": {
    "ipAddress": "102.89.44.21",
    "userAgent": "Mozilla/5.0",
    "deviceFingerprint": "dfp-884492021"
  }
}
```

Response (first login required)
```json
{
  "requiresPasswordChange": true,
  "userId": "USR-AFF-20011",
  "userType": "AFFILIATE",
  "message": "Password change required before access."
}
```

Response (success)
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "expiresIn": 3600,
  "user": {
    "userId": "USR-AFF-20011",
    "fullName": "Amaka Okoye",
    "userType": "AFFILIATE",
    "roles": ["AFFILIATE_ADMIN"],
    "scope": {
      "scopeType": "AFFILIATE_TENANT",
      "tenantId": "TNT-AFF-10291"
    }
  }
}
```

Errors
- 400 Missing credentials
- 401 Invalid username/password
- 423 Account locked
- 403 User inactive

### API-AUTH-02 — Change Password (first login)
- Endpoint: `/api/v1/auth/change-password`
- Method: `POST`

Request
```json
{
  "userId": "USR-AFF-20011",
  "temporaryPassword": "TempPass#2026",
  "newPassword": "SecurePass#2026!"
}
```

Response
```json
{
  "status": "PASSWORD_UPDATED",
  "updatedAt": "2026-02-19T21:05:12Z"
}
```

### API-FPWD-01 — Request Password Reset
- Endpoint: `/api/v1/auth/forgot-password`
- Method: `POST`

Request
```json
{
  "username": "ops@acmefinance.ng",
  "channel": "WEB"
}
```

Response
```json
{
  "resetRequestId": "RST-998712",
  "deliveryChannel": "EMAIL",
  "expiresAt": "2026-02-19T22:30:00Z"
}
```

### API-FPWD-02 — Confirm Reset & Set New Password
- Endpoint: `/api/v1/auth/reset-password`
- Method: `POST`

Request
```json
{
  "resetRequestId": "RST-998712",
  "otp": "449821",
  "newPassword": "NewSecure#2026!"
}
```

Response
```json
{
  "status": "PASSWORD_RESET_SUCCESS",
  "updatedAt": "2026-02-19T22:12:55Z"
}
```

### API-LOGOUT-01 — Logout
- Endpoint: `/api/v1/auth/logout`
- Method: `POST`

Request
```json
{
  "userId": "USR-AFF-20011",
  "sessionId": "SESS-88219921"
}
```

Response
```json
{
  "status": "SESSION_TERMINATED",
  "terminatedAt": "2026-02-19T22:20:45Z"
}
```

## 4) Onboarding APIs (pre-tenant + reviewer)

### API-ONB-01 — Create onboarding session
- Endpoint: `/api/v1/onboarding/sessions`
- Method: `POST`

Request
```json
{
  "channel": "web",
  "email": "ops@acmefinance.ng",
  "phone": "+2348012345678",
  "consentAccepted": true
}
```

Response
```json
{
  "onboardingSessionId": "onb_sess_9f3c2a1d",
  "draftId": "onb_draft_100245",
  "expiresAt": "2026-02-19T18:30:00Z"
}
```

### API-ONB-02 — Save organization details
- Endpoint: `/api/v1/onboarding/drafts/{draftId}/organization`
- Method: `PUT`

### API-ONB-03 — Upload document
- Endpoint: `/api/v1/onboarding/drafts/{draftId}/documents`
- Method: `POST`

### API-ONB-04 — Save selected issuing banks
- Endpoint: `/api/v1/onboarding/drafts/{draftId}/issuing-banks`
- Method: `PUT`

### API-ONB-05 — Submit onboarding draft
- Endpoint: `/api/v1/onboarding/drafts/{draftId}/submit`
- Method: `POST`

Request
```json
{
  "onboardingSessionId": "onb_sess_9f3c2a1d",
  "declarations": {
    "infoAccurate": true,
    "authorizedSigner": true
  }
}
```

Response
```json
{
  "caseId": "CASE-2026-000981",
  "affiliateId": "AFF-PENDING-00981",
  "status": "SUBMITTED",
  "submittedAt": "2026-02-19T18:12:55Z"
}
```

### API-ONB-06 — Get onboarding case status (affiliate tracking)
- Endpoint: `/api/v1/onboarding/cases/{caseId}`
- Method: `GET`

### API-ONB-07 — List onboarding cases (service provider)
- Endpoint: `/api/v1/admin/onboarding/cases`
- Method: `GET`

### API-ONB-08 — Decision (approve/reject/clarify)
- Endpoint: `/api/v1/admin/onboarding/cases/{caseId}/decision`
- Method: `POST`

### API-ONB-09 — Provision tenant + initial admin credentials
- Endpoint: `/api/v1/admin/onboarding/cases/{caseId}/provision`
- Method: `POST`

---

If you want, I can next align the existing frontend mocks (`useAuth`, mock stores) to these exact request/response shapes so the UI matches the SRS contract end-to-end.
