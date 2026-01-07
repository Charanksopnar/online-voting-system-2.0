---
description: Fix electoral roll verification - name matching, address matching, and multiple match handling
---

# Fix Electoral Roll Verification

This workflow addresses issues in the electoral roll verification service.

## Prerequisites
- Access to `services/electoralRollService.ts`
- Test data in `official_voter_lists` table

## Steps

### 1. Improve Name Matching Algorithm
**Problem**: Levenshtein distance doesn't handle name order variations, nicknames, etc.

**Location**: `services/electoralRollService.ts` - `calculateSimilarity` function

**Improvements**:
```typescript
// Phonetic matching using Soundex
function soundex(name: string): string {
  if (!name) return '';
  const a = name.toLowerCase().split('');
  const firstLetter = a.shift();
  const codes = [
    ['b', 'f', 'p', 'v'],
    ['c', 'g', 'j', 'k', 'q', 's', 'x', 'z'],
    ['d', 't'],
    ['l'],
    ['m', 'n'],
    ['r'],
  ];
  
  const codeMap: Record<string, string> = {};
  codes.forEach((group, index) => {
    group.forEach(letter => codeMap[letter] = String(index + 1));
  });
  
  return (
    firstLetter +
    a
      .map(letter => codeMap[letter] || '')
      .join('')
      .replace(/(\d)\1+/g, '$1')
      .slice(0, 3)
      .padEnd(3, '0')
  ).toUpperCase();
}

// Token-based name matching
function matchNameTokens(inputName: string, dbName: string): number {
  const inputTokens = inputName.toLowerCase().split(/\s+/);
  const dbTokens = dbName.toLowerCase().split(/\s+/);
  
  let matchedTokens = 0;
  for (const inputToken of inputTokens) {
    for (const dbToken of dbTokens) {
      if (
        inputToken === dbToken ||
        soundex(inputToken) === soundex(dbToken) ||
        levenshteinDistance(inputToken, dbToken) <= 2
      ) {
        matchedTokens++;
        break;
      }
    }
  }
  
  return matchedTokens / Math.max(inputTokens.length, dbTokens.length);
}
```

### 2. Fix Address Matching Logic
**Problem**: City name variations cause false mismatches.

**Create City Alias Table**:
```sql
CREATE TABLE IF NOT EXISTS public.city_aliases (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  primary_name text NOT NULL,
  alias text NOT NULL,
  state text
);

-- Insert common aliases
INSERT INTO city_aliases (primary_name, alias, state) VALUES
  ('Bengaluru', 'Bangalore', 'Karnataka'),
  ('Mumbai', 'Bombay', 'Maharashtra'),
  ('Chennai', 'Madras', 'Tamil Nadu'),
  ('Kolkata', 'Calcutta', 'West Bengal');
```

**Improved Address Matching**:
```typescript
async function matchAddress(
  inputAddress: AddressInfo, 
  dbAddress: AddressInfo
): Promise<{ match: boolean; score: number; details: string[] }> {
  const details: string[] = [];
  let score = 0;
  
  // State match (strict)
  if (inputAddress.state.toLowerCase() === dbAddress.state.toLowerCase()) {
    score += 40;
    details.push('State: match');
  } else {
    details.push(`State: mismatch (${inputAddress.state} vs ${dbAddress.state})`);
  }
  
  // District match (fuzzy)
  if (fuzzyMatch(inputAddress.district, dbAddress.district, 0.8)) {
    score += 30;
    details.push('District: match');
  } else {
    details.push(`District: mismatch`);
  }
  
  // City match with aliases
  const cityMatches = await checkCityWithAliases(inputAddress.city, dbAddress.city);
  if (cityMatches) {
    score += 30;
    details.push('City: match');
  }
  
  return { match: score >= 70, score, details };
}
```

### 3. Fix DOB Matching Logic
**Problem**: Single character difference fails match.

**Flexible Date Matching**:
```typescript
function flexibleDateMatch(
  inputDate: string, 
  dbDate: string
): { match: boolean; confidence: number } {
  // Parse dates in multiple formats
  const formats = ['YYYY-MM-DD', 'DD-MM-YYYY', 'DD/MM/YYYY', 'MM/DD/YYYY'];
  
  let inputParsed: Date | null = null;
  let dbParsed: Date | null = null;
  
  for (const format of formats) {
    if (!inputParsed) inputParsed = parseDate(inputDate, format);
    if (!dbParsed) dbParsed = parseDate(dbDate, format);
  }
  
  if (!inputParsed || !dbParsed) {
    return { match: false, confidence: 0 };
  }
  
  const diffDays = Math.abs(
    (inputParsed.getTime() - dbParsed.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (diffDays === 0) return { match: true, confidence: 100 };
  if (diffDays <= 1) return { match: true, confidence: 95 }; // Allow 1 day difference
  
  // Check if year and month match (day typo)
  if (
    inputParsed.getFullYear() === dbParsed.getFullYear() &&
    inputParsed.getMonth() === dbParsed.getMonth()
  ) {
    return { match: true, confidence: 80 };
  }
  
  return { match: false, confidence: 0 };
}
```

### 4. Handle Multiple Electoral Roll Matches
**Problem**: Only first match returned when multiple exist.

**Return All Matches**:
```typescript
async function findElectoralRollMatches(
  aadhaarNumber: string,
  epicNumber?: string
): Promise<ElectoralRollMatch[]> {
  let query = supabase
    .from('official_voter_lists')
    .select('*');
  
  if (epicNumber) {
    query = query.or(`epic_number.eq.${epicNumber},aadhaar_number.eq.${aadhaarNumber}`);
  } else {
    query = query.eq('aadhaar_number', aadhaarNumber);
  }
  
  const { data, error } = await query;
  
  if (error || !data || data.length === 0) {
    return [];
  }
  
  // Calculate match scores for each result
  const scoredMatches = data.map(record => ({
    record,
    score: calculateMatchScore(record),
    isDuplicate: data.length > 1,
  }));
  
  // Sort by score descending
  return scoredMatches.sort((a, b) => b.score - a.score);
}
```

**Update Admin UI** to show all potential matches and let admin choose.

## Verification
// turbo
```bash
npm run dev
```

1. Add test records with name variations to electoral roll
2. Test registration with different name orders
3. Verify city aliases work (Bangalore vs Bengaluru)
4. Test DOB with minor differences
5. Test scenario with multiple potential matches
