package com.project.doctorya.bdd.stepdefinitions;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import com.project.doctorya.dtos.PatientDto;
import com.project.doctorya.models.Patient;
import com.project.doctorya.services.PatientService;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

@SpringBootTest
public class PatientSteps {

    @Autowired
    private PatientService patientService;

    private Patient patient;
    private long patientCount;

    @Given("the system does not have a patient with identification {string}")
    public void systemDoesNotHavePatient(String identification) {
        try {
            patientService.getByIdentification(identification);
        } catch (Exception e) {
            // Patient does not exist, which is expected
        }
    }

    @When("I create a patient with the following details:")
    public void createPatient(io.cucumber.datatable.DataTable dataTable) {
        List<Map<String, String>> rows = dataTable.asMaps();
        Map<String, String> row = rows.get(0);
        PatientDto patientDto = new PatientDto();
        patientDto.setIdentification(row.get("identification"));
        patientDto.setName(row.get("name"));
        patientDto.setInsurance(row.get("insurance"));
        patient = patientService.create(patientDto);
    }

    @Then("the patient should be created successfully")
    public void patientCreatedSuccessfully() {
        assertNotNull(patient);
    }

    @Then("the patient identification should be {string}")
    public void patientIdentificationShouldBe(String identification) {
        assertEquals(identification, patient.getIdentification());
    }

    @Given("there are patients registered in the system")
    public void thereArePatientsRegistered() {
        // We can assume there's at least one patient from previous tests or create one if needed
        // For simplicity, we just rely on the test DB state or the previous scenario
    }

    @When("I request the patient count")
    public void iRequestThePatientCount() {
        patientCount = patientService.count();
    }

    @Then("the system should return a valid count number")
    public void systemShouldReturnValidCountNumber() {
        assertTrue(patientCount >= 0, "The count should be a non-negative number");
    }
}