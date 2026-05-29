package com.dropfile.domain.enums;

public enum FileStatus {
    INITIATING,   // presigned URL generated, upload not started
    UPLOADING,    // multipart upload in progress
    UPLOADED,     // S3 confirmed complete — file is accessible
    FAILED,       // upload failed or timed out
    DELETED       // soft deleted
}
