---
description: Fix face service vulnerabilities - liveness detection and embedding security
---

# Fix Face Service Vulnerabilities

This workflow addresses security issues in the face recognition service.

## Prerequisites
- DeepFace Docker container running at `localhost:5000`
- Access to modify `services/faceService.ts`

## Steps

### 1. Improve Face Embedding Comparison Logic
**Problem**: Distance to confidence conversion uses arbitrary formula with weak threshold.

**Location**: `services/faceService.ts`

**Current Functions**:
- `computeDistance` (lines 38-49)
- `distanceToConfidence` (lines 51-54)

**Improvements**:
```typescript
// Multi-factor verification
interface QualityMetrics {
  brightness: number;
  blur: number;
  faceSize: number;
}

function evaluateImageQuality(base64Frame: string): QualityMetrics {
  // Add quality checks
}

function multiFactorVerify(
  liveEmbedding: number[],
  storedEmbedding: number[],
  quality: QualityMetrics
): { match: boolean; confidence: number } {
  const euclidean = computeDistance(liveEmbedding, storedEmbedding);
  const cosine = computeCosineSimilarity(liveEmbedding, storedEmbedding);
  
  // Combine scores with weighted average
  // Adjust threshold based on image quality
}
```

### 2. Enhance Liveness Detection
**CRITICAL**: Current liveness check only validates frame differences.

**Location**: `services/faceService.ts` - `checkLiveness` function (lines 19-36)

**Improvements**:
1. Add challenge-response mechanism:
   ```typescript
   const CHALLENGES = ['BLINK', 'TURN_LEFT', 'TURN_RIGHT', 'SMILE'];
   
   function generateRandomChallenge(): string {
     return CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
   }
   
   async function validateChallenge(
     challenge: string, 
     frames: string[]
   ): Promise<boolean> {
     // Validate challenge was completed
   }
   ```

2. Use DeepFace anti-spoofing models
3. Check for screen reflections in eyes

### 3. Add Backend Health Check Enforcement
**Problem**: No handling if backend goes down mid-verification.

**Location**: `services/faceService.ts` - `checkBackendHealth` function (lines 208-218)

**Improvements**:
```typescript
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 5000,
};

async function callWithRetry<T>(
  fn: () => Promise<T>,
  config = RETRY_CONFIG
): Promise<T> {
  let lastError: Error;
  for (let attempt = 0; attempt < config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const delay = Math.min(
        config.baseDelay * Math.pow(2, attempt),
        config.maxDelay
      );
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}
```

### 4. Protect Face Embedding Integrity
**Problem**: Embeddings stored without integrity protection.

**Database Changes**:
```sql
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS face_embedding_hash text,
  ADD COLUMN IF NOT EXISTS face_embedding_version int DEFAULT 1,
  ADD COLUMN IF NOT EXISTS face_embedding_created_at timestamptz;
```

**Implementation**:
```typescript
import { createHash } from 'crypto';

function computeEmbeddingHash(embeddings: number[]): string {
  return createHash('sha256')
    .update(JSON.stringify(embeddings))
    .digest('hex');
}

// Store hash with embeddings
// Verify hash before using for verification
```

## Verification
// turbo
```bash
npm run dev
```

1. Test face registration with various lighting conditions
2. Attempt spoofing with photo/video playback
3. Verify liveness challenge-response
4. Check database for embedding hashes
5. Test backend failure handling
