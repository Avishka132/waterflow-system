package water_management.customer;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import water_management.billing.Bill;
import water_management.billing.BillRepository;
import water_management.connection.WaterConnection;
import water_management.connection.WaterConnectionRepository;
import water_management.payment.Payment;
import water_management.payment.PaymentRepository;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/customer-reports")
@CrossOrigin(origins = "http://localhost:5173")
public class CustomerReportController {
    private final CustomerRepository customerRepository;
    private final WaterConnectionRepository connectionRepository;
    private final BillRepository billRepository;
    private final PaymentRepository paymentRepository;

    public CustomerReportController(CustomerRepository customerRepository,
            WaterConnectionRepository connectionRepository,
            BillRepository billRepository, PaymentRepository paymentRepository) {
        this.customerRepository = customerRepository;
        this.connectionRepository = connectionRepository;
        this.billRepository = billRepository;
        this.paymentRepository = paymentRepository;
    }

    @GetMapping("/{customerId}")
    public Map<String, Object> getCustomerReport(@PathVariable Long customerId) {
        customer customerRecord = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));
        List<WaterConnection> connections = connectionRepository.findByCustomer_Id(customerId);
        List<Long> connectionIds = connections.stream().map(WaterConnection::getId).toList();
        List<Bill> bills = connectionIds.isEmpty() ? List.of() : connectionIds.stream()
                .flatMap(id -> billRepository.findByConnectionId(id).stream()).distinct()
                .sorted(Comparator.comparing(Bill::getBillDate, Comparator.nullsLast(Comparator.reverseOrder()))).toList();
        List<Long> billIds = bills.stream().map(Bill::getId).toList();
        List<Payment> payments = billIds.isEmpty() ? List.of() : paymentRepository.findByBillIdIn(billIds);
        double totalBilled = bills.stream().mapToDouble(b -> b.getAmount() == null ? 0 : b.getAmount()).sum();
        double totalPaid = payments.stream().mapToDouble(p -> p.getAmount() == null ? 0 : p.getAmount()).sum();
        // Also account for legacy bills already marked PAID before payment records were stored.
        double legacyPaid = bills.stream().filter(b -> "PAID".equalsIgnoreCase(b.getStatus()))
                .filter(b -> payments.stream().noneMatch(p -> p.getBillId().equals(b.getId())))
                .mapToDouble(b -> b.getAmount() == null ? 0 : b.getAmount()).sum();
        Map<String, Object> report = new LinkedHashMap<>();
        report.put("customer", customerRecord);
        report.put("connections", connections);
        report.put("bills", bills);
        report.put("payments", payments);
        report.put("totalBilled", totalBilled);
        report.put("totalPaid", totalPaid + legacyPaid);
        report.put("outstanding", Math.max(0, totalBilled - totalPaid - legacyPaid));
        report.put("legacyPaidBillsWithoutPaymentDetails", bills.stream()
                .filter(b -> "PAID".equalsIgnoreCase(b.getStatus()))
                .filter(b -> payments.stream().noneMatch(p -> p.getBillId().equals(b.getId())))
                .map(Bill::getBillNumber).toList());
        return report;
    }
}
