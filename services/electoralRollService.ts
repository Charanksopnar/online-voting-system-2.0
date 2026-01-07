// Electoral Roll Verification Service
// Cross-checks registration data against official voter lists

import { supabase } from '../supabase';

export interface ElectoralRollMatch {
    id: string;
    aadhaar_number: string | null;
    epic_number: string | null;
    full_name: string | null;
    father_name: string | null;
    dob: string | null;
    age: number | null;
    gender: string | null;
    address_state: string | null;
    address_district: string | null;
    address_city: string | null;
    full_address: string | null;
    polling_booth: string | null;
}

export interface ElectoralRollVerificationResult {
    found: boolean;
    match: ElectoralRollMatch | null;
    verified: boolean;
    matchScore: number;
    message: string;
    details: {
        nameMatch: boolean;
        dobMatch: boolean;
        fatherNameMatch: boolean;
        addressMatch: boolean;
    };
}

/**
 * Normalize string for comparison (lowercase, trim, remove extra spaces)
 */
function normalizeString(str: string | null | undefined): string {
    if (!str) return '';
    return str.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Calculate similarity between two strings (simple Levenshtein-based)
 */
function calculateSimilarity(str1: string, str2: string): number {
    const s1 = normalizeString(str1);
    const s2 = normalizeString(str2);

    if (s1 === s2) return 1.0;
    if (s1.length === 0 || s2.length === 0) return 0.0;

    // Simple contains check for partial matches
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;

    // Levenshtein distance
    const matrix: number[][] = [];

    for (let i = 0; i <= s2.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= s1.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= s2.length; i++) {
        for (let j = 1; j <= s1.length; j++) {
            if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    const distance = matrix[s2.length][s1.length];
    const maxLength = Math.max(s1.length, s2.length);
    return 1 - (distance / maxLength);
}

/**
 * Verify user data against electoral roll
 */
export async function verifyAgainstElectoralRoll(userData: {
    aadhaarNumber?: string;
    epicNumber?: string;
    firstName: string;
    lastName: string;
    fatherName?: string;
    dob?: string;
    state?: string;
    district?: string;
    city?: string;
}): Promise<ElectoralRollVerificationResult> {
    try {
        // 1. Query electoral roll by Aadhaar or EPIC
        let query = supabase
            .from('official_voter_lists')
            .select('*');

        // Priority: EPIC number (more reliable for voter identification)
        if (userData.epicNumber && userData.epicNumber.trim()) {
            query = query.eq('epic_number', userData.epicNumber.trim());
        } else if (userData.aadhaarNumber && userData.aadhaarNumber.trim()) {
            query = query.eq('aadhaar_number', userData.aadhaarNumber.trim());
        } else {
            // No ID numbers provided
            return {
                found: false,
                match: null,
                verified: false,
                matchScore: 0,
                message: 'No Aadhaar or EPIC number provided for verification.',
                details: {
                    nameMatch: false,
                    dobMatch: false,
                    fatherNameMatch: false,
                    addressMatch: false
                }
            };
        }

        const { data, error } = await query.limit(1).single();

        if (error || !data) {
            // Not found in electoral roll
            return {
                found: false,
                match: null,
                verified: false,
                matchScore: 0,
                message: 'Your data is not registered in the voter list. You may not generate your voter ID till now.',
                details: {
                    nameMatch: false,
                    dobMatch: false,
                    fatherNameMatch: false,
                    addressMatch: false
                }
            };
        }

        // 2. Found in electoral roll - now verify data matches
        const fullName = `${userData.firstName} ${userData.lastName}`.trim();
        const officialName = data.full_name || '';

        // Calculate individual field matches
        const nameMatch = calculateSimilarity(fullName, officialName) >= 0.8;
        const dobMatch = normalizeString(userData.dob) === normalizeString(data.dob);
        const fatherNameMatch = userData.fatherName
            ? calculateSimilarity(userData.fatherName, data.father_name || '') >= 0.8
            : true; // If not provided, don't penalize

        // Address matching (state, district, city)
        let addressMatchCount = 0;
        let addressTotalFields = 0;

        if (userData.state && data.address_state) {
            addressTotalFields++;
            if (normalizeString(userData.state) === normalizeString(data.address_state)) {
                addressMatchCount++;
            }
        }

        if (userData.district && data.address_district) {
            addressTotalFields++;
            if (normalizeString(userData.district) === normalizeString(data.address_district)) {
                addressMatchCount++;
            }
        }

        if (userData.city && data.address_city) {
            addressTotalFields++;
            if (normalizeString(userData.city) === normalizeString(data.address_city)) {
                addressMatchCount++;
            }
        }

        const addressMatch = addressTotalFields > 0
            ? (addressMatchCount / addressTotalFields) >= 0.67 // At least 2/3 match
            : true; // If no address data, don't penalize

        // 3. Calculate overall match score
        let matchScore = 0;
        let totalWeight = 0;

        // Weighted scoring
        if (nameMatch) matchScore += 30;
        totalWeight += 30;

        if (dobMatch) matchScore += 25;
        totalWeight += 25;

        if (fatherNameMatch) matchScore += 25;
        totalWeight += 25;

        if (addressMatch) matchScore += 20;
        totalWeight += 20;

        const finalScore = totalWeight > 0 ? (matchScore / totalWeight) : 0;

        // 4. Determine verification status
        const verified = finalScore >= 0.8; // 80% threshold for auto-verification

        let message = '';
        if (verified) {
            message = 'Electoral roll verified successfully. All data matches official records.';
        } else if (finalScore >= 0.5) {
            message = 'Partial match with electoral roll. Manual review required for verification.';
        } else {
            message = 'Data mismatch with electoral roll. Manual review required.';
        }

        return {
            found: true,
            match: data as ElectoralRollMatch,
            verified,
            matchScore: finalScore,
            message,
            details: {
                nameMatch,
                dobMatch,
                fatherNameMatch,
                addressMatch
            }
        };

    } catch (error: any) {
        console.error('Electoral roll verification error:', error);
        return {
            found: false,
            match: null,
            verified: false,
            matchScore: 0,
            message: `Verification failed: ${error.message || 'Unknown error'}`,
            details: {
                nameMatch: false,
                dobMatch: false,
                fatherNameMatch: false,
                addressMatch: false
            }
        };
    }
}
