
package water_management.meterreading;

import jakarta.persistence.*;
import java.time.LocalDate;
import water_management.connection.WaterConnection;

@Entity
@Table(name = "meter_readings")
public class MeterReading {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "connection_id", nullable = false)
    private WaterConnection waterConnection;

    @Column(name = "previous_reading", nullable = false)
    private Double previousReading;

    @Column(name = "current_reading", nullable = false)
    private Double currentReading;

    @Column(name = "units_consumed", nullable = false)
    private Double unitsConsumed;

    @Column(name = "reading_date", nullable = false)
    private LocalDate readingDate;

    public MeterReading() {
    }

    public Long getId() {
        return id;
    }

    public WaterConnection getWaterConnection() {
        return waterConnection;
    }

    public void setWaterConnection(WaterConnection waterConnection) {
        this.waterConnection = waterConnection;
    }

    public Double getPreviousReading() {
        return previousReading;
    }

    public void setPreviousReading(Double previousReading) {
        this.previousReading = previousReading;
    }

    public Double getCurrentReading() {
        return currentReading;
    }

    public void setCurrentReading(Double currentReading) {
        this.currentReading = currentReading;
    }

    public Double getUnitsConsumed() {
        return unitsConsumed;
    }

    public void setUnitsConsumed(Double unitsConsumed) {
        this.unitsConsumed = unitsConsumed;
    }

    public LocalDate getReadingDate() {
        return readingDate;
    }

    public void setReadingDate(LocalDate readingDate) {
        this.readingDate = readingDate;
    }
}
