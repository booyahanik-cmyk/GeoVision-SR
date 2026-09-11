package team.nexaura.geovision_backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import team.nexaura.geovision_backend.exception.FileValidationException;

import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Service
public class FileValidationService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("tif", "tiff", "jp2", "zip");
    private static final Set<String> GEOSPATIAL_PAYLOAD_EXTENSIONS = Set.of("tif", "tiff", "jp2");

    private static final Set<String> DANGEROUS_EXTENSIONS = Set.of(
            "exe", "bat", "cmd", "sh", "dll", "vbs", "js", "jsp", "jar", "war", "php", "py", "com", "scr", "msi", "ps1"
    );

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/tiff",
            "image/geotiff",
            "image/jp2",
            "image/jpeg2000",
            "image/jpx",
            "application/zip",
            "application/x-zip-compressed",
            "application/x-zip",
            "multipart/x-zip",
            "application/octet-stream"
    );

    // 100MB default max file size
    private final long maxFileSizeBytes;

    // Zip bomb limits: Max 500MB uncompressed, Max 10,000 entries, Max 100:1 ratio
    private static final long MAX_UNCOMPRESSED_ZIP_SIZE_BYTES = 500L * 1024 * 1024;
    private static final int MAX_ZIP_ENTRIES = 10_000;
    private static final double MAX_ZIP_COMPRESSION_RATIO = 100.0;

    public FileValidationService(
            @Value("${geovision.upload.max-file-size:104857600}") long maxFileSizeBytes
    ) {
        this.maxFileSizeBytes = maxFileSizeBytes;
    }

    /**
     * Complete validation pipeline for uploaded geospatial files.
     * Validates: non-empty, file extension, max size, mime type, magic bytes, and ZIP archive security.
     */
    public void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new FileValidationException("Uploaded file cannot be null or empty.");
        }

        // 1. Validate File Size
        if (file.getSize() > maxFileSizeBytes) {
            double sizeMb = (double) file.getSize() / (1024 * 1024);
            double maxMb = (double) maxFileSizeBytes / (1024 * 1024);
            throw new FileValidationException(
                    String.format("File size (%.2f MB) exceeds maximum allowed limit (%.0f MB).", sizeMb, maxMb)
            );
        }

        // 2. Validate File Extension
        String rawFilename = file.getOriginalFilename();
        if (rawFilename == null || rawFilename.isBlank()) {
            throw new FileValidationException("File name is missing or invalid.");
        }

        String extension = getFileExtension(rawFilename).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new FileValidationException(
                    String.format("Unsupported file format '.%s'. Allowed formats are: .tif, .tiff, .jp2, .zip", extension)
            );
        }

        // 3. Validate MIME Type
        String contentType = file.getContentType();
        if (contentType != null && !contentType.isBlank()) {
            String normalizedMime = contentType.toLowerCase().split(";")[0].trim();
            if (!ALLOWED_MIME_TYPES.contains(normalizedMime)) {
                throw new FileValidationException(
                        String.format("Invalid MIME type '%s' for geospatial file.", contentType)
                );
            }
        }

        // 4. Validate Magic Bytes / File Signatures
        byte[] headerBytes = readHeaderBytes(file, 16);
        validateMagicBytes(extension, headerBytes);

        // 5. Secure ZIP Archive Deep Validation
        if ("zip".equals(extension)) {
            validateZipArchive(file);
        }
    }

    /**
     * Extracts file extension from filename
     */
    public String getFileExtension(String filename) {
        int dotIndex = filename.lastIndexOf('.');
        if (dotIndex > 0 && dotIndex < filename.length() - 1) {
            return filename.substring(dotIndex + 1);
        }
        return "";
    }

    /**
     * Inspects magic bytes / binary signatures
     */
    private void validateMagicBytes(String extension, byte[] header) {
        if (header.length < 4) {
            throw new FileValidationException("File header is too small to be a valid geospatial or archive file.");
        }

        switch (extension) {
            case "tif":
            case "tiff":
                // TIFF little-endian (II* / 49 49 2A 00) or big-endian (MM / 4D 4D 00 2A) or BigTIFF (2B 00)
                boolean isLittleEndianTiff = (header[0] == 0x49 && header[1] == 0x49 && (header[2] == 0x2A || header[2] == 0x2B) && header[3] == 0x00);
                boolean isBigEndianTiff = (header[0] == 0x4D && header[1] == 0x4D && header[2] == 0x00 && (header[3] == 0x2A || header[3] == 0x2B));
                if (!isLittleEndianTiff && !isBigEndianTiff) {
                    throw new FileValidationException("Invalid TIFF signature. File does not appear to be a valid TIFF/GeoTIFF image.");
                }
                break;

            case "jp2":
                // JPEG 2000 signature box: 00 00 00 0C 6A 50 20 20 (or codestream FF 4F FF 51)
                boolean isJp2Box = (header.length >= 8 && header[0] == 0x00 && header[1] == 0x00 && header[2] == 0x00 && header[3] == 0x0C
                        && header[4] == 0x6A && header[5] == 0x50 && header[6] == 0x20 && header[7] == 0x20);
                boolean isJp2Codestream = (header[0] == (byte) 0xFF && header[1] == (byte) 0x4F && header[2] == (byte) 0xFF && header[3] == 0x51);

                if (!isJp2Box && !isJp2Codestream) {
                    throw new FileValidationException("Invalid JPEG 2000 signature. File does not match JP2 container format.");
                }
                break;

            case "zip":
                // Standard ZIP header: PK\x03\x04 (50 4B 03 04) or empty archive PK\x05\x06 (50 4B 05 06)
                boolean isZip = (header[0] == 0x50 && header[1] == 0x4B &&
                        ((header[2] == 0x03 && header[3] == 0x04) || (header[2] == 0x05 && header[3] == 0x06)));
                if (!isZip) {
                    throw new FileValidationException("Invalid ZIP signature. File is not a valid ZIP archive.");
                }
                break;

            default:
                throw new FileValidationException("Unsupported file extension: " + extension);
        }
    }

    /**
     * Reads first N bytes of the file for binary signature analysis
     */
    private byte[] readHeaderBytes(MultipartFile file, int numBytes) {
        try (InputStream is = file.getInputStream()) {
            byte[] buffer = new byte[numBytes];
            int bytesRead = is.read(buffer);
            if (bytesRead <= 0) {
                return new byte[0];
            }
            return (bytesRead == numBytes) ? buffer : Arrays.copyOf(buffer, bytesRead);
        } catch (IOException e) {
            throw new FileValidationException("Failed to read file signature: " + e.getMessage(), e);
        }
    }

    /**
     * Secure ZIP validation defending against:
     * - Zip Slip attacks (canonical path escape)
     * - Path traversal (.., leading slashes, drive letters)
     * - Malicious / executable archive entries (.exe, .sh, .bat, etc.)
     * - Zip bombs (excessive uncompressed size, extreme compression ratio)
     * - Invalid / corrupt archives
     * - Archives without geospatial payloads
     */
    private void validateZipArchive(MultipartFile file) {
        Path dummyRoot = Paths.get("target_extraction_root").toAbsolutePath().normalize();
        long totalUncompressedBytes = 0;
        int entryCount = 0;
        boolean containsGeospatialFile = false;

        byte[] buffer = new byte[8192];

        try (ZipInputStream zis = new ZipInputStream(new BufferedInputStream(file.getInputStream()))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                entryCount++;
                if (entryCount > MAX_ZIP_ENTRIES) {
                    throw new FileValidationException(
                            String.format("ZIP archive contains too many entries (exceeds limit of %d entries).", MAX_ZIP_ENTRIES)
                    );
                }

                String entryName = entry.getName();
                if (entryName == null || entryName.trim().isEmpty()) {
                    throw new FileValidationException("ZIP archive contains an invalid entry with an empty name.");
                }

                // Path Traversal Check
                if (entryName.contains("..") || entryName.startsWith("/") || entryName.startsWith("\\") || entryName.matches("^[a-zA-Z]:.*")) {
                    throw new FileValidationException("Path traversal attempt detected in archive entry: " + entryName);
                }

                // Zip Slip Check: Canonical path verification
                Path destinationPath = dummyRoot.resolve(entryName).normalize();
                if (!destinationPath.startsWith(dummyRoot)) {
                    throw new FileValidationException("Zip Slip attack detected in archive entry: " + entryName);
                }

                // Ignore directories for payload inspection
                if (entry.isDirectory()) {
                    zis.closeEntry();
                    continue;
                }

                // Disallow dangerous / executable file types inside the zip
                String entryExt = getFileExtension(entryName).toLowerCase();
                if (DANGEROUS_EXTENSIONS.contains(entryExt)) {
                    throw new FileValidationException(
                            String.format("ZIP archive contains prohibited dangerous file: '%s'.", entryName)
                    );
                }

                if (GEOSPATIAL_PAYLOAD_EXTENSIONS.contains(entryExt)) {
                    containsGeospatialFile = true;
                }

                // Read bytes to inspect real uncompressed size and protect against Zip Bombs
                long entryUncompressedBytes = 0;
                int bytesRead;
                while ((bytesRead = zis.read(buffer)) != -1) {
                    entryUncompressedBytes += bytesRead;
                    totalUncompressedBytes += bytesRead;

                    if (totalUncompressedBytes > MAX_UNCOMPRESSED_ZIP_SIZE_BYTES) {
                        throw new FileValidationException(
                                "ZIP uncompressed content exceeds safe limit (500MB). Possible Zip Bomb."
                        );
                    }
                }

                // Check compression ratio if compressed size is known
                long compressedSize = entry.getCompressedSize();
                if (compressedSize > 0 && entryUncompressedBytes > 1024 * 1024) {
                    double ratio = (double) entryUncompressedBytes / compressedSize;
                    if (ratio > MAX_ZIP_COMPRESSION_RATIO) {
                        throw new FileValidationException(
                                String.format("Suspicious compression ratio (%.1f:1) for entry '%s'. Possible Zip Bomb.", ratio, entryName)
                        );
                    }
                }

                zis.closeEntry();
            }

            if (entryCount == 0) {
                throw new FileValidationException("The uploaded ZIP archive is empty.");
            }

            if (!containsGeospatialFile) {
                throw new FileValidationException(
                        "The uploaded ZIP archive does not contain any valid geospatial raster files (.tif, .tiff, .jp2)."
                );
            }

        } catch (IOException e) {
            throw new FileValidationException("Corrupt or unreadable ZIP archive: " + e.getMessage(), e);
        }
    }
}
