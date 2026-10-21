
package water_management.billing;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/billing-settings")
@CrossOrigin(origins = "http://localhost:5173")
public class BillingSettingsController {

    private final BillingSettingsRepository repository;

    public BillingSettingsController(
            BillingSettingsRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public BillingSettings getSettings() {
        List<BillingSettings> settingsList = repository.findAll();

        if (!settingsList.isEmpty()) {
            return settingsList.get(0);
        }

        // Create default settings if none exist
        return repository.save(new BillingSettings());
    }

    @PutMapping
    public BillingSettings updateSettings(
            @RequestBody BillingSettings request) {

        if (request.getResidentialRate() == null
                || request.getBusinessRate() == null
                || request.getConcessionRate() == null
                || !isValidRate(request.getResidentialRate())
                || !isValidRate(request.getBusinessRate())
                || !isValidRate(request.getConcessionRate())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "All billing rates must be valid non-negative numbers."
            );
        }

        List<BillingSettings> settingsList = repository.findAll();

        BillingSettings settings;

        if (settingsList.isEmpty()) {
            settings = new BillingSettings();
        } else {
            settings = settingsList.get(0);
        }

        settings.setResidentialRate(request.getResidentialRate());
        settings.setBusinessRate(request.getBusinessRate());
        settings.setConcessionRate(request.getConcessionRate());

        return repository.save(settings);
    }

    private boolean isValidRate(Double rate) {
        return Double.isFinite(rate) && rate >= 0;
    }
}
