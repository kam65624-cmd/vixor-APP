# VIXOR V2 — Provider Interfaces and Mock Data

Branch: rehab/provider-interfaces
Date: 2026-09-04
Status: Interfaces and mock implementations only — no real API calls, no UI.

## Purpose

Separate the UI and domain layers from external data sources. Every V2 surface (MOXI discovery, MR.VIGO evidence, DR.DEX risk, ECHO history) consumes data through a typed provider contract. This allows:

- Swapping real providers without changing UI code.
- Testing screens with deterministic mock data.
- Handling failures, partial data, and unsupported networks consistently.
- Never coercing incomplete or failed data into a "safe" risk status.

```
UI / Domain
  ↓
Provider Interfaces
  ↓
Mock Providers or Real Providers
  ↓
External APIs
```

## Provider Interfaces

All interfaces live in `src/domains/case/providers/`.

| Interface | File | Purpose |
|-----------|------|---------|
| `DiscoveryProvider` | `discovery-provider.ts` | Target feed and signal provenance for MOXI |
| `TokenIntelligenceProvider` | `token-intelligence-provider.ts` | Token profile and market snapshot |
| `EvidenceProvider` | `evidence-provider.ts` | Evidence items for MR.VIGO investigation |
| `SecurityScanProvider` | `security-scan-provider.ts` | Security scan lifecycle and status |
| `OutcomeProvider` | `outcome-provider.ts` | Outcome tracking for ECHO history |

## ProviderResult

All providers return a unified `ProviderResult<T>` shape:

```ts
interface ProviderResult<T> {
  data: T | null;
  status: ProviderStatus;
  source: string;
  fetchedAt: string;
  warnings?: ProviderWarning[];
  error?: ProviderError;
}
```

### Statuses

| Status | Meaning |
|--------|---------|
| `success` | Data completed successfully |
| `partial` | Some data available, some sources failed |
| `empty` | No results found |
| `failed` | Provider request failed |
| `unsupported` | Network or source not supported |
| `loading` | Request in progress |

A `partial` or `failed` result must never be interpreted as a safe risk status by the UI or domain layer.

## Error Model

```ts
interface ProviderError {
  code: ProviderErrorCode;
  message: string;
  retryable: boolean;
  provider: string;
}
```

Error codes:

- `NETWORK_ERROR`
- `TIMEOUT`
- `RATE_LIMITED`
- `UNAUTHORIZED`
- `UNSUPPORTED_NETWORK`
- `INVALID_TARGET`
- `NO_DATA`
- `UPSTREAM_ERROR`
- `UNKNOWN_ERROR`

Errors must not contain:
- API keys
- Tokens
- Private keys
- Environment values
- User-sensitive data

## Mock Providers

Mock implementations live alongside the interfaces in `src/domains/case/providers/`:

- `MockDiscoveryProvider`
- `MockTokenIntelligenceProvider`
- `MockEvidenceProvider`
- `MockSecurityScanProvider`
- `MockOutcomeProvider`

Each mock supports a `scenario` property that controls the response:

| Provider | Scenarios |
|----------|-----------|
| Discovery | `success`, `empty`, `unsupported`, `failed` |
| TokenIntelligence | `success`, `empty`, `failed` |
| Evidence | `success`, `partial`, `empty`, `failed` |
| SecurityScan | `success`, `partial`, `failed`, `rate-limited` |
| Outcome | `success`, `empty`, `failed` |

### Security Scan Helpers

`MockSecurityScanProvider` exports two helper functions:

- `isScanSafe(scan)` — returns `true` only if the scan is `complete` with coverage >= 80.
- `scanWarnings(scan)` — returns a warning list for non-complete scans.

A failed or partial scan is never safe to conclude a low-risk result.

## Usage Pattern

```ts
import { MockDiscoveryProvider } from "@/domains/case/providers";

const discovery = new MockDiscoveryProvider();

const targets = await discovery.listTargets({ network: "ethereum" });
if (targets.status === "success" && targets.data) {
  for (const target of targets.data) {
    const signal = await discovery.getSignal(target.id);
    // ...
  }
}
```

## Replacing Mocks with Real Providers

To swap a mock for a real provider:

1. Implement the same interface (e.g., `DiscoveryProvider`).
2. Use the same `ProviderResult<T>` shape.
3. Map real API errors to the unified `ProviderError` codes.
4. Inject the real provider where the mock was used.

No UI or domain code should need to change.

## Evidence vs Risk Assessment

- `EvidenceProvider` returns facts: what was observed, where, when, severity, status.
- `RiskAssessment` is derived from evidence by the domain layer, not by the evidence provider itself.
- A `partial` or `failed` evidence response must not produce a low-risk assessment.

## What This Commit Does NOT Include

- Real API integrations.
- UI components or screens.
- New routes.
- XP logic.
- Wallet, transaction, or execution changes.
- Changes to `routeTree.gen.ts`.

## File Map

```
src/domains/case/providers/
├── types.ts                              # ProviderResult, ProviderError, helpers
├── discovery-provider.ts                 # DiscoveryProvider interface
├── token-intelligence-provider.ts        # TokenIntelligenceProvider interface
├── evidence-provider.ts                  # EvidenceProvider interface
├── security-scan-provider.ts             # SecurityScanProvider interface
├── outcome-provider.ts                   # OutcomeProvider interface
├── mock-discovery-provider.ts            # Mock implementation
├── mock-token-intelligence-provider.ts   # Mock implementation
├── mock-evidence-provider.ts             # Mock implementation
├── mock-security-scan-provider.ts        # Mock implementation + isScanSafe helpers
├── mock-outcome-provider.ts              # Mock implementation
├── index.ts                              # Public exports
└── __tests__/                            # Tests
    └── providers.test.ts                  # (lives in src/domains/case/__tests__/)
```
