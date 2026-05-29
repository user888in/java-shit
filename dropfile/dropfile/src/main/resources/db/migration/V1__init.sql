CREATE TYPE file_status AS ENUM (
    'INITIATING',   -- presigned URL issued, upload not started
    'UPLOADING',    -- multipart in progress
    'UPLOADED',     -- S3 confirmed complete, file is accessible
    'FAILED',       -- upload failed or timed out
    'DELETED'       -- soft deleted
);

CREATE TYPE chunk_status AS ENUM (
    'PENDING',      -- presigned URL issued, awaiting client upload
    'UPLOADED',     -- client reported success (not yet verified)
    'VERIFIED',     -- server confirmed ETag via S3 ListParts
    'FAILED'        -- upload or verification failed
);
CREATE TYPE change_event_type AS ENUM (
    'CREATED',
    'UPDATED',
    'DELETED',
    'SHARED'
);

CREATE TABLE users (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email        VARCHAR(255) NOT NULL UNIQUE,
    password     VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);


CREATE TABLE file_metadata (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name         VARCHAR(500)  NOT NULL,
    size         BIGINT        NOT NULL DEFAULT 0,
    mime_type    VARCHAR(200),
    -- SHA-256 of entire file content for deduplication and resumable upload checks.
    fingerprint  VARCHAR(64),
    -- S3 object key. UUID-based, NOT the file name.
    -- Format: {ownerId}/{fileId}/{randomUUID}
    -- Prevents path traversal and name collisions.
    s3_key       VARCHAR(1000) NOT NULL,
    s3_upload_id VARCHAR(500),
    status       file_status   NOT NULL DEFAULT 'INITIATING',
    owner_id     UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_file_metadata_owner
    ON file_metadata(owner_id);

CREATE INDEX idx_file_metadata_fingerprint
    ON file_metadata(fingerprint)
    WHERE fingerprint IS NOT NULL;

CREATE INDEX idx_file_metadata_owner_updated
    ON file_metadata(owner_id, updated_at DESC);


CREATE TABLE file_chunks (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id      UUID         NOT NULL REFERENCES file_metadata(id) ON DELETE CASCADE,
    part_number  INT          NOT NULL,      -- S3 part number, 1-based
    size         BIGINT       NOT NULL,      -- bytes in this chunk
    fingerprint  VARCHAR(64),               -- SHA-256 of this chunk
    etag         VARCHAR(200),              -- S3 ETag returned after part upload
    status       chunk_status NOT NULL DEFAULT 'PENDING',
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_file_chunk UNIQUE (file_id, part_number)
);
CREATE INDEX idx_file_chunks_file_id ON file_chunks(file_id);

CREATE TABLE shared_files (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id     UUID        NOT NULL REFERENCES file_metadata(id) ON DELETE CASCADE,
    owner_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shared_with UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_share UNIQUE (file_id, shared_with)
);
CREATE INDEX idx_shared_files_shared_with ON shared_files(shared_with);
CREATE INDEX idx_shared_files_file_id     ON shared_files(file_id);

CREATE TABLE file_change_events (
    id          UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id     UUID              NOT NULL,   -- no FK — file may be deleted
    user_id     UUID              NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type  change_event_type NOT NULL,
    payload     JSONB,                        -- snapshot of file state at change time
    created_at  TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_change_events_user_time
    ON file_change_events(user_id, created_at DESC);


CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_file_metadata_updated_at
    BEFORE UPDATE ON file_metadata
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_file_chunks_updated_at
    BEFORE UPDATE ON file_chunks
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();