
package water_management.customer;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerRepository extends JpaRepository<customer, Long> {
    boolean existsByPhone(String phone);
}
