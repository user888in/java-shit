package com.dropfile.domain.entity;

import com.dropfile.domain.enums.ChunkStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "file_chunks",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_file_chunk",
                columnNames = {"file_id", "part_number"}
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FileChunk {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "file_id", nullable = false)
    private FileMetadata file;

    @Column(name = "part_number", nullable = false)
    private Integer partNumber; // 1 based max - 10,000

    @Column(nullable = false)
    private Long size;

    @Column(length = 64)
    private String fingerprint;

    @Column(length = 200)
    private String etag;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ChunkStatus status = ChunkStatus.PENDING;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
