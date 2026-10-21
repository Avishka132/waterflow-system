
package water_management.meterreading;


import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MeterReadingRepository
        extends JpaRepository<MeterReading, Long> {

    List<MeterReading> findByWaterConnection_Id(Long connectionId);
}
