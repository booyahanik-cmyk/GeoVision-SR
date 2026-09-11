package team.nexaura.geovision_backend.dto.internal;

public record GdalMetadataDto(
        Integer width,
        Integer height,
        Integer bands,
        String crs,
        String epsg,
        String bbox
) {}
