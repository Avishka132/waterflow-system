
package water_management.connection;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WaterConnectionRepository
        extends JpaRepository<WaterConnection, Long> {

    boolean existsByConnectionNumber(String connectionNumber);

    List<WaterConnection> findByCustomer_Id(Long customerId);
}
