package team.nexaura.geovision_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import team.nexaura.geovision_backend.entity.Imagery;
import team.nexaura.geovision_backend.entity.ImageryStatus;

import java.util.List;

@Repository
public interface ImageryRepository extends JpaRepository<Imagery, Long> {

    List<Imagery> findAllByOrderByUploadTimeDesc();

    List<Imagery> findByUploadedByOrderByUploadTimeDesc(String uploadedBy);

    List<Imagery> findByStatusOrderByUploadTimeDesc(ImageryStatus status);
}
