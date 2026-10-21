
package water_management.billing;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BillingSettingsRepository
        extends JpaRepository<BillingSettings, Long> {
}
