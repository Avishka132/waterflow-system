
package water_management.customer;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
@CrossOrigin(origins = "http://localhost:5173")
public class CustomerController {

    private final CustomerRepository customerRepository;

    public CustomerController(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    @GetMapping
    public List<customer> getAllCustomers() {
        return customerRepository.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public customer createCustomer(@RequestBody customer newCustomer) {

        validateCustomer(newCustomer);

        String phone = newCustomer.getPhone().trim();

        if (customerRepository.existsByPhone(phone)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Phone number already exists");
        }

        newCustomer.setFullName(newCustomer.getFullName().trim());
        newCustomer.setPhone(phone);

        return customerRepository.save(newCustomer);
    }

    @GetMapping("/{id}")
    public customer getCustomerById(@PathVariable Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Customer not found"));
    }

    @PutMapping("/{id}")
    public customer updateCustomer(
            @PathVariable Long id,
            @RequestBody customer updatedCustomer) {

        customer existingCustomer = customerRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Customer not found"));

        validateCustomer(updatedCustomer);

        String phone = updatedCustomer.getPhone().trim();

        if (customerRepository.existsByPhone(phone)
                && !existingCustomer.getPhone().equals(phone)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Phone number already exists");
        }

        existingCustomer.setFullName(
                updatedCustomer.getFullName().trim());
        existingCustomer.setPhone(phone);
        existingCustomer.setAddress(updatedCustomer.getAddress());

        // Additional Customer Registration fields
        existingCustomer.setZone(updatedCustomer.getZone());
        existingCustomer.setMembershipId(
                updatedCustomer.getMembershipId());
        existingCustomer.setCategory(updatedCustomer.getCategory());
        existingCustomer.setCustomerTitle(
                updatedCustomer.getCustomerTitle());
        existingCustomer.setNicNumber(updatedCustomer.getNicNumber());
        existingCustomer.setMeterSerialNumber(
                updatedCustomer.getMeterSerialNumber());
        existingCustomer.setAccountNumber(
                updatedCustomer.getAccountNumber());

        return customerRepository.save(existingCustomer);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCustomer(@PathVariable Long id) {
        customer existingCustomer = customerRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Customer not found"));

        customerRepository.delete(existingCustomer);
    }

    private void validateCustomer(customer customer) {
        if (customer.getFullName() == null
                || customer.getFullName().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Full name is required");
        }

        if (customer.getPhone() == null
                || customer.getPhone().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Phone is required");
        }
    }
}
