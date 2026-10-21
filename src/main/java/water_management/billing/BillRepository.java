
package water_management.billing;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BillRepository extends JpaRepository<Bill, Long> {

    boolean existsByBillNumber(String billNumber);

    List<Bill> findByConnectionId(Long connectionId);

    List<Bill> findByStatus(String status);

    List<Bill> findByBillingMonth(String billingMonth);
}
