
package water_management.connection;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import water_management.customer.CustomerRepository;
import water_management.customer.customer;

import java.util.List;

@RestController
@RequestMapping("/api/connections")
@CrossOrigin(origins = "http://localhost:5173")
public class WaterConnectionController {

    private final WaterConnectionRepository connectionRepository;
    private final CustomerRepository customerRepository;

    public WaterConnectionController(
            WaterConnectionRepository connectionRepository,
            CustomerRepository customerRepository) {
        this.connectionRepository = connectionRepository;
        this.customerRepository = customerRepository;
    }

    @GetMapping
    public List<WaterConnection> getAllConnections() {
        return connectionRepository.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public WaterConnection createConnection(
            @RequestBody ConnectionRequest request) {

        if (request.connectionNumber == null
                || request.connectionNumber.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Connection number is required");
        }

        if (request.connectionType == null
                || request.connectionType.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Connection type is required");
        }

        if (request.installationDate == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Installation date is required");
        }

        if (request.customerId == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Customer is required");
        }

        if (connectionRepository.existsByConnectionNumber(
                request.connectionNumber.trim())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Connection number already exists");
        }

        customer selectedCustomer = customerRepository.findById(
                request.customerId
        ).orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Customer not found"));

        WaterConnection connection = new WaterConnection();
        connection.setConnectionNumber(request.connectionNumber.trim());
        connection.setCustomer(selectedCustomer);
        connection.setConnectionType(request.connectionType.trim());
        connection.setInstallationDate(request.installationDate);
        connection.setStatus("ACTIVE");

        return connectionRepository.save(connection);
    }

    @GetMapping("/{id}")
    public WaterConnection getConnection(@PathVariable Long id) {
        return connectionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Connection not found"));
    }

    @PutMapping("/{id}")
    public WaterConnection updateConnection(
            @PathVariable Long id,
            @RequestBody ConnectionRequest request) {

        WaterConnection connection = connectionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Connection not found"));

        if (request.connectionNumber == null
                || request.connectionNumber.isBlank()
                || request.connectionType == null
                || request.connectionType.isBlank()
                || request.installationDate == null
                || request.customerId == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "All required connection fields must be provided");
        }

        String newNumber = request.connectionNumber.trim();

        if (!newNumber.equals(connection.getConnectionNumber())
                && connectionRepository.existsByConnectionNumber(newNumber)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Connection number already exists");
        }

        customer selectedCustomer = customerRepository.findById(
                request.customerId
        ).orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Customer not found"));

        connection.setConnectionNumber(newNumber);
        connection.setCustomer(selectedCustomer);
        connection.setConnectionType(request.connectionType.trim());
        connection.setInstallationDate(request.installationDate);

        if (request.status != null
                && (request.status.equals("ACTIVE")
                || request.status.equals("INACTIVE"))) {
            connection.setStatus(request.status);
        }

        return connectionRepository.save(connection);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteConnection(@PathVariable Long id) {
        WaterConnection connection = connectionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Connection not found"));

        connectionRepository.delete(connection);
    }

    public static class ConnectionRequest {
        public Long customerId;
        public String connectionNumber;
        public String connectionType;
        public java.time.LocalDate installationDate;
        public String status;
    }
}
