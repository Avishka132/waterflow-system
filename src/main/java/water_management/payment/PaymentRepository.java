package water_management.payment;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByBillIdIn(List<Long> billIds);
    boolean existsByBillId(Long billId);
}
