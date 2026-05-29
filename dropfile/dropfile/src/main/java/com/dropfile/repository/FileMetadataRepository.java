package com.dropfile.repository;

import com.dropfile.domain.entity.FileMetadata;
import com.dropfile.domain.enums.FileStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface FileMetadataRepository extends JpaRepository<FileMetadata, UUID> {
    Page<FileMetadata> findByOwnerIdAndStatusNot(
            UUID ownerId,
            FileStatus excludedStatus,
            Pageable pageable);

    @Query("""
            SELECT f FROM FileMetadata f
            WHERE f.owner.id  = :ownerId
              AND f.fingerprint = :fingerprint
              AND f.status IN ('INITIATING', 'UPLOADING')
            ORDER BY f.createdAt DESC
            """)
    Optional<FileMetadata> findResumableUpload(
            @Param("ownerId") UUID ownerId,
            @Param("fingerprint") String fingerprint);

}
