
package water_management.meterreading;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import water_management.connection.WaterConnection;
import water_management.connection.WaterConnectionRepository;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/meter-readings")
@CrossOrigin(origins = "http://localhost:5173")
public class MeterReadingController {

    private final MeterReadingRepository readingRepository;
    private final WaterConnectionRepository connectionRepository;

    public MeterReadingController(
            MeterReadingRepository readingRepository,
            WaterConnectionRepository connectionRepository) {
        this.readingRepository = readingRepository;
        this.connectionRepository = connectionRepository;
    }

    @GetMapping
    public List<MeterReading> getAllReadings() {
        return readingRepository.findAll();
    }

    @GetMapping("/{id}")
    public MeterReading getReadingById(@PathVariable Long id) {
        return readingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Meter reading not found"));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MeterReading createReading(@RequestBody ReadingRequest request) {

        if (request.getConnectionId() == null
                || request.getPreviousReading() == null
                || request.getCurrentReading() == null
                || request.getReadingDate() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "All fields are required");
        }

        if (request.getPreviousReading() < 0
                || request.getCurrentReading() < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Readings cannot be negative");
        }

        if (request.getCurrentReading() < request.getPreviousReading()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Current reading cannot be less than previous reading");
        }

        WaterConnection connection = connectionRepository
                .findById(request.getConnectionId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Water connection not found"));

        MeterReading reading = new MeterReading();
        reading.setWaterConnection(connection);
        reading.setPreviousReading(request.getPreviousReading());
        reading.setCurrentReading(request.getCurrentReading());
        reading.setUnitsConsumed(
                request.getCurrentReading() - request.getPreviousReading());
        reading.setReadingDate(request.getReadingDate());

        return readingRepository.save(reading);
    }

    @PutMapping("/{id}")
    public MeterReading updateReading(
            @PathVariable Long id,
            @RequestBody ReadingRequest request) {

        MeterReading reading = readingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Meter reading not found"));

        if (request.getPreviousReading() == null
                || request.getCurrentReading() == null
                || request.getReadingDate() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Reading fields are required");
        }

        if (request.getPreviousReading() < 0
                || request.getCurrentReading() < request.getPreviousReading()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Invalid reading values");
        }

        reading.setPreviousReading(request.getPreviousReading());
        reading.setCurrentReading(request.getCurrentReading());
        reading.setUnitsConsumed(
                request.getCurrentReading() - request.getPreviousReading());
        reading.setReadingDate(request.getReadingDate());

        if (request.getConnectionId() != null) {
            WaterConnection connection = connectionRepository
                    .findById(request.getConnectionId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "Water connection not found"));
            reading.setWaterConnection(connection);
        }

        return readingRepository.save(reading);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteReading(@PathVariable Long id) {
        if (!readingRepository.existsById(id)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Meter reading not found");
        }
        readingRepository.deleteById(id);
    }

    public static class ReadingRequest {

        private Long connectionId;
        private Double previousReading;
        private Double currentReading;
        private LocalDate readingDate;

        public Long getConnectionId() {
            return connectionId;
        }

        public void setConnectionId(Long connectionId) {
            this.connectionId = connectionId;
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

        public LocalDate getReadingDate() {
            return readingDate;
        }

        public void setReadingDate(LocalDate readingDate) {
            this.readingDate = readingDate;
        }
    }
}
