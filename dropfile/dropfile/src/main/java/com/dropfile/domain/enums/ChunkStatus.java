package com.dropfile.domain.enums;

public enum ChunkStatus {
    PENDING,    // presigned URL issued, client hasn't uploaded yet
    UPLOADED,   // client reported success — not yet server-verified
    VERIFIED,   // server confirmed ETag via S3 ListParts ✓
    FAILED
}
