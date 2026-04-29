package com.project.doctorya.tdd;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.project.doctorya.dtos.PatientDto;
import com.project.doctorya.models.Patient;
import com.project.doctorya.services.PatientService;

//TDD (Test-Driven Development)

@SpringBootTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@org.springframework.test.annotation.DirtiesContext(classMode = org.springframework.test.annotation.DirtiesContext.ClassMode.AFTER_CLASS)
public class PatientTest {
    @Autowired
    PatientService patientService;

    @Test
    @Order(1)
    void testCreatePatient() throws Exception {
        PatientDto patientDto = new PatientDto();
        patientDto.setIdentification("1053847610");
        patientDto.setName("Test Name");
        patientDto.setInsurance("Test Insurance");
        Patient patient = patientService.create(patientDto);
        assertNotNull(patient);
        assertEquals(patient.getIdentification(), patientDto.getIdentification());
        assertEquals(patient.getName(), patientDto.getName());
        assertEquals(patient.getInsurance(), patientDto.getInsurance());
    }

    @Test
    @Order(2)
    void testGetByIdentification() throws Exception {
        Patient patient = patientService.getByIdentification("1053847610");
        assertEquals(patient.getIdentification(), patient.getIdentification());
    }

    @Test
    @Order(3)
    void testGetById() throws Exception {
        Patient patient = patientService.getByIdentification("1053847610");
        Patient patient2 = patientService.getById(patient.getId());
        assertEquals(patient.getIdentification(), patient2.getIdentification());
        assertEquals(patient.getId(), patient2.getId());
    }

    @Test // Esta etiqueta le dice a Spring que ejecute esto como una prueba TDD
    @Order(4) // Orden de paso (1. creo, 2. consulto, 3. consulto ID, 4. actualizo)
    void testUpdatePatient() throws Exception {

        // 1. OBTENER: Buscamos un paciente que ya estaba creado de antes (Preparación)
        Patient patient = patientService.getByIdentification("1053847610");

        // 2. PREPARAR CAJA DE DATOS: DTO con información nueva (nuevo nombre)
        PatientDto patientDto = new PatientDto();
        patientDto.setName("Test Name"); // Simulamos cambiar el nombre

        // 3. ACTUAR (Act): Mandamos al servicio nativo de Java a que actualice al
        // paciente
        Patient patientUpdate = patientService.update(patientDto, patient.getId());

        // 4. ASEGURAR (Assertions): Aquí es donde ocurre la VERDADERA PRUEBA.
        // Si el resultado no coincide con la expectativa, la prueba estallará en rojo.
        assertNotNull(patientUpdate); // ¿El servicio devolvió un objeto válido o falló?
        assertEquals(patientDto.getName(), patientUpdate.getName()); // ¿Realmente se aplicó el cambio en el nombre?
    }

    @Test
    @Order(5)
    void testCountPatients() throws Exception {
        long count = patientService.count();
        assertTrue(count > 0, "The count should be greater than 0 since we created a patient previously");
    }

    /*
     * @Test
     * 
     * @Order(5)
     * void testDeletePatient() throws Exception{
     * Patient patient = patientService.getByIdentification("1053847610");
     * patientService.delete(patient.getId());
     * 
     * }
     */
}
