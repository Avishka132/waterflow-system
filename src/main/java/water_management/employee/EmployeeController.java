package water_management.employee;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@RestController
@RequestMapping("/api/employees")
@CrossOrigin(origins = "http://localhost:5173")
public class EmployeeController {
    private final EmployeeRepository repository;

    public EmployeeController(EmployeeRepository repository) { this.repository = repository; }

    @GetMapping
    public List<Employee> getAllEmployees() { return repository.findAll(); }

    @GetMapping("/{id}")
    public Employee getEmployee(@PathVariable Long id) {
        return repository.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Employee createEmployee(@RequestBody Employee employee) {
        validate(employee);
        if (repository.existsByEmployeeCode(employee.getEmployeeCode().trim())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Employee ID already exists");
        }
        employee.setEmployeeCode(employee.getEmployeeCode().trim());
        if (employee.getStatus() == null || employee.getStatus().isBlank()) employee.setStatus("Active");
        return repository.save(employee);
    }

    @PutMapping("/{id}")
    public Employee updateEmployee(@PathVariable Long id, @RequestBody Employee updated) {
        Employee employee = getEmployee(id);
        validate(updated);
        String code = updated.getEmployeeCode().trim();
        if (!employee.getEmployeeCode().equals(code) && repository.existsByEmployeeCode(code)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Employee ID already exists");
        }
        employee.setFullName(updated.getFullName().trim());
        employee.setEmployeeCode(code);
        employee.setPhone(updated.getPhone().trim());
        employee.setEmail(updated.getEmail());
        employee.setRole(updated.getRole().trim());
        employee.setDepartment(updated.getDepartment());
        employee.setAddress(updated.getAddress());
        employee.setStatus(updated.getStatus() == null || updated.getStatus().isBlank() ? "Active" : updated.getStatus());
        employee.setJoinedDate(updated.getJoinedDate());
        return repository.save(employee);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteEmployee(@PathVariable Long id) {
        Employee employee = getEmployee(id);
        repository.delete(employee);
    }

    private void validate(Employee employee) {
        if (employee.getFullName() == null || employee.getFullName().isBlank()
                || employee.getEmployeeCode() == null || employee.getEmployeeCode().isBlank()
                || employee.getPhone() == null || employee.getPhone().isBlank()
                || employee.getRole() == null || employee.getRole().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Full name, employee ID, phone and role are required");
        }
    }
}
