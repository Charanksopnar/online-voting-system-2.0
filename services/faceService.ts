// Face Recognition Service - Communicates with DeepFace Docker API

const BACKEND_URL = '/deepface';

export interface FaceRegistrationResult {
    success: boolean;
    embeddings?: number[];
    liveness_verified?: boolean;
    message: string;
}

export interface FaceVerificationResult {
    match: boolean;
    confidence: number;
    distance?: number;
    message: string;
}

function checkLiveness(frames: string[]): { ok: boolean; message?: string } {
    if (!frames || frames.length < 3) {
        return {
            ok: false,
            message: 'At least 3 frames are required for liveness detection.',
        };
    }

    const uniqueFrames = new Set(frames);
    if (uniqueFrames.size < 2) {
        return {
            ok: false,
            message: 'Frames are too similar. Please move your head and blink as instructed.',
        };
    }

    return { ok: true };
}

function computeDistance(a: number[], b: number[]): number {
    if (!a || !b || a.length === 0 || b.length === 0 || a.length !== b.length) {
        throw new Error('Invalid or mismatched face embeddings.');
    }

    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        const diff = a[i] - b[i];
        sum += diff * diff;
    }
    return Math.sqrt(sum);
}

function distanceToConfidence(distance: number): number {
    const confidence = 1 - distance / 20.0;
    return Math.max(0, Math.min(1, confidence));
}

async function getEmbeddingFromDocker(base64Frame: string): Promise<number[]> {
    const response = await fetch(`${BACKEND_URL}/represent`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            img_path: `data:image/jpeg;base64,${base64Frame}`,
            model_name: 'Facenet',
            detector_backend: 'opencv',
            enforce_detection: false, // Allow processing even if face detection is uncertain
        }),
    });

    const data = await response.json();

    console.log('DeepFace /represent response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
        const errorMsg = data?.error || data?.message || 'DeepFace /represent request failed';
        throw new Error(errorMsg);
    }

    let embedding: number[] | undefined;

    // DeepFace API returns: { results: [ { embedding: [...], ... } ] }
    if (data.results && Array.isArray(data.results) && data.results.length > 0) {
        const first = data.results[0];
        if (first && Array.isArray(first.embedding)) {
            embedding = first.embedding;
        }
    }
    // Fallback: direct array format (older API versions)
    else if (Array.isArray(data)) {
        const first = data[0];
        if (first && Array.isArray(first.embedding)) {
            embedding = first.embedding;
        }
    }
    // Fallback: flat embedding format
    else if (Array.isArray(data.embedding)) {
        embedding = data.embedding;
    }

    if (!embedding || embedding.length === 0) {
        throw new Error(`Could not extract face embedding from DeepFace response. Response structure: ${JSON.stringify(Object.keys(data))}`);
    }

    return embedding;
}

// Helper for single-image embedding extraction from other parts of the app
export async function getEmbeddingForBase64Image(base64Image: string): Promise<number[]> {
    return getEmbeddingFromDocker(base64Image);
}

export async function checkBackendHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${BACKEND_URL}/`, {
            method: 'GET',
        });
        return response.ok;
    } catch (error) {
        console.error('DeepFace Docker health check failed:', error);
        return false;
    }
}

export async function registerFace(
    userId: string,
    frames: string[],
): Promise<FaceRegistrationResult> {
    try {
        const liveness = checkLiveness(frames);
        if (!liveness.ok) {
            return {
                success: false,
                message: liveness.message || 'Liveness check failed.',
            };
        }

        const middleIndex = Math.floor(frames.length / 2);
        const middleFrame = frames[middleIndex];

        const embedding = await getEmbeddingFromDocker(middleFrame);

        return {
            success: true,
            embeddings: embedding,
            liveness_verified: true,
            message: 'Face registered successfully',
        };
    } catch (error: any) {
        console.error('Face registration error via DeepFace Docker:', error);
        return {
            success: false,
            message:
                error?.message ||
                'Could not connect to face recognition service. Make sure the DeepFace Docker container is running on port 5000.',
        };
    }
}

export async function verifyFace(
    liveFrames: string[],
    storedEmbedding: number[],
): Promise<FaceVerificationResult> {
    try {
        const liveness = checkLiveness(liveFrames);
        if (!liveness.ok) {
            return {
                match: false,
                confidence: 0,
                message: liveness.message || 'Liveness check failed.',
            };
        }

        if (!storedEmbedding || storedEmbedding.length === 0) {
            return {
                match: false,
                confidence: 0,
                message: 'No stored face embedding found for this user.',
            };
        }

        const middleIndex = Math.floor(liveFrames.length / 2);
        const liveFrame = liveFrames[middleIndex];

        const liveEmbedding = await getEmbeddingFromDocker(liveFrame);

        const distance = computeDistance(storedEmbedding, liveEmbedding);
        const threshold = 10.0;
        const match = distance < threshold;
        const confidence = distanceToConfidence(distance);

        return {
            match,
            confidence,
            distance: Number(distance.toFixed(3)),
            message: match ? 'Face verified successfully' : 'Face verification failed',
        };
    } catch (error: any) {
        console.error('Face verification error via DeepFace Docker:', error);
        return {
            match: false,
            confidence: 0,
            message:
                error?.message ||
                'Could not connect to face recognition service. Make sure the DeepFace Docker container is running on port 5000.',
        };
    }
}
