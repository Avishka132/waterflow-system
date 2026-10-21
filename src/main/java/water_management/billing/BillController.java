
package water_management.billing;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import water_management.connection.WaterConnection;
import water_management.connection.WaterConnectionRepository;
import water_management.meterreading.MeterReading;
import water_management.meterreading.MeterReadingRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/bills")
@CrossOrigin(origins = "http://localhost:5173")
public class BillController {

    private final BillRepository billRepository;
    private final MeterReadingRepository meterReadingRepository;
    private final BillingSettingsRepository billingSettingsRepository;
public BillController(
        BillRepository billRepository,
        MeterReadingRepository meterReadingRepository,
        WaterConnectionRepository connectionRepository,
        BillingSettingsRepository billingSettingsRepository) {

    this.billRepository = billRepository;
    this.meterReadingRepository = meterReadingRepository;
    this.billingSettingsRepository = billingSettingsRepository;
}

    // Get all bills
    @GetMapping
    public List<Bill> getAllBills() {
        return billRepository.findAll();
    }

    // Get bill by ID
    @GetMapping("/{id}")
    public ResponseEntity<Bill> getBillById(@PathVariable Long id) {
        return billRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Generate a bill using a meter reading
    @PostMapping("/generate")
    public ResponseEntity<?> generateBill(
            @RequestBody BillRequest request) {

        if (request.getMeterReadingId() == null
                || request.getBillingMonth() == null
                || request.getBillingMonth().isBlank()
                || request.getDueDate() == null) {
            return ResponseEntity.badRequest()
                    .body("Meter reading ID, billing month and due date are required.");
        }

        Optional<MeterReading> readingOptional =
                meterReadingRepository.findById(request.getMeterReadingId());

        if (readingOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Meter reading not found.");
        }

        MeterReading reading = readingOptional.get();
        WaterConnection connection = reading.getWaterConnection();

        if (connection == null) {
            return ResponseEntity.badRequest()
                    .body("Water connection not found for this reading.");
        }

        Long connectionId = connection.getId();

        // Prevent duplicate bills for the same connection and month
        boolean duplicate = billRepository
                .findByConnectionId(connectionId)
                .stream()
                .anyMatch(bill -> request.getBillingMonth()
                        .equals(bill.getBillingMonth()));

        if (duplicate) {
            return ResponseEntity.badRequest()
                    .body("A bill already exists for this connection and month.");
        }

        Double rate = getRate(connection.getConnectionType());

        if (rate == null) {
            return ResponseEntity.badRequest()
                    .body("Unknown connection type. Use Residential, Business or Concession.");
        }

        Bill bill = new Bill();

        bill.setBillNumber(
                "BILL-" + connectionId + "-" + request.getBillingMonth());

        bill.setConnectionId(connectionId);

        if (connection.getCustomer() != null) {
            bill.setCustomerName(
                    connection.getCustomer().getFullName());
        } else {
            bill.setCustomerName("Unknown");
        }

        bill.setConnectionType(connection.getConnectionType());
        bill.setBillingMonth(request.getBillingMonth());
        bill.setPreviousReading(reading.getPreviousReading());
        bill.setCurrentReading(reading.getCurrentReading());
        bill.setUnitsUsed(reading.getUnitsConsumed());
        bill.setRatePerUnit(rate);

        double amount = reading.getUnitsConsumed() * rate;
        bill.setAmount(Math.round(amount * 100.0) / 100.0);

        bill.setBillDate(LocalDate.now());
        bill.setDueDate(request.getDueDate());
        bill.setStatus("UNPAID");

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(billRepository.save(bill));
    }

    // Rates per unit (LKR)

private Double getRate(String connectionType) {
    if (connectionType == null) {
        return null;
    }

    List<BillingSettings> settingsList =
            billingSettingsRepository.findAll();

    BillingSettings settings;

    if (settingsList.isEmpty()) {
        settings = billingSettingsRepository.save(
                new BillingSettings()
        );
    } else {
        settings = settingsList.get(0);
    }

    if (connectionType.equalsIgnoreCase("Residential")) {
        return settings.getResidentialRate();
    }

    if (connectionType.equalsIgnoreCase("Business")) {
        return settings.getBusinessRate();
    }

    if (connectionType.equalsIgnoreCase("Concession")
            || connectionType.equalsIgnoreCase("Consession")) {
        return settings.getConcessionRate();
    }

    return null;
}


    // Update bill payment status
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateBillStatus(
            @PathVariable Long id,
            @RequestBody StatusRequest request) {

        Optional<Bill> billOptional = billRepository.findById(id);

        if (billOptional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        if (request.getStatus() == null
                || !(request.getStatus().equalsIgnoreCase("PAID")
                || request.getStatus().equalsIgnoreCase("UNPAID"))) {
            return ResponseEntity.badRequest()
                    .body("Status must be PAID or UNPAID.");
        }

        Bill bill = billOptional.get();
        bill.setStatus(request.getStatus().toUpperCase());

        return ResponseEntity.ok(billRepository.save(bill));
    }

    // Request body for generating a bill
    public static class BillRequest {
        private Long meterReadingId;
        private String billingMonth;
        private LocalDate dueDate;

        public Long getMeterReadingId() {
            return meterReadingId;
        }

        public void setMeterReadingId(Long meterReadingId) {
            this.meterReadingId = meterReadingId;
        }

        public String getBillingMonth() {
            return billingMonth;
        }

        public void setBillingMonth(String billingMonth) {
            this.billingMonth = billingMonth;
        }

        public LocalDate getDueDate() {
            return dueDate;
        }

        public void setDueDate(LocalDate dueDate) {
            this.dueDate = dueDate;
        }
    }

    // Request body for updating payment status
    public static class StatusRequest {
        private String status;

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }
    }
}
