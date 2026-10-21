package water_management.payment;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import water_management.billing.Bill;
import water_management.billing.BillRepository;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "http://localhost:5173")
public class PaymentController {
    private final PaymentRepository paymentRepository;
    private final BillRepository billRepository;

    public PaymentController(PaymentRepository paymentRepository, BillRepository billRepository) {
        this.paymentRepository = paymentRepository;
        this.billRepository = billRepository;
    }

    @GetMapping
    public List<Payment> getPayments() { return paymentRepository.findAll(); }

    @PostMapping
    public ResponseEntity<?> createPayment(@RequestBody PaymentRequest request) {
        if (request.billId == null || request.paymentMethod == null || request.paymentMethod.isBlank()) {
            return ResponseEntity.badRequest().body("Bill ID and payment method are required.");
        }
        Bill bill = billRepository.findById(request.billId).orElse(null);
        if (bill == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Bill not found.");
        if ("PAID".equalsIgnoreCase(bill.getStatus()) || paymentRepository.existsByBillId(bill.getId())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("A payment is already recorded for this bill.");
        }
        Payment payment = new Payment();
        payment.setBillId(bill.getId());
        payment.setBillNumber(bill.getBillNumber());
        payment.setAmount(bill.getAmount());
        payment.setPaymentMethod(request.paymentMethod.trim().toUpperCase());
        payment.setReference(request.reference == null || request.reference.isBlank() ? null : request.reference.trim());
        Payment saved = paymentRepository.save(payment);
        bill.setStatus("PAID");
        billRepository.save(bill);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    public static class PaymentRequest {
        public Long billId;
        public String paymentMethod;
        public String reference;
    }
}
