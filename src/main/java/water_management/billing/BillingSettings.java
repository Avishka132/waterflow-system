
package water_management.billing;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "billing_settings")
public class BillingSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Double residentialRate = 23.0;

    @Column(nullable = false)
    private Double businessRate = 25.0;

    @Column(nullable = false)
    private Double concessionRate = 15.0;

    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public BillingSettings() {
    }

    public Long getId() {
        return id;
    }

    public Double getResidentialRate() {
        return residentialRate;
    }

    public void setResidentialRate(Double residentialRate) {
        this.residentialRate = residentialRate;
    }

    public Double getBusinessRate() {
        return businessRate;
    }

    public void setBusinessRate(Double businessRate) {
        this.businessRate = businessRate;
    }

    public Double getConcessionRate() {
        return concessionRate;
    }

    public void setConcessionRate(Double concessionRate) {
        this.concessionRate = concessionRate;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    @PrePersist
    @PreUpdate
    public void updateTimestamp() {
        this.updatedAt = LocalDateTime.now();
    }
}
