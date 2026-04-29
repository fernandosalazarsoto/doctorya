package com.project.doctorya.controllers;

import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.project.doctorya.dtos.PatientDto;
import com.project.doctorya.models.Patient;
import com.project.doctorya.services.PatientService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@Tag(name = "Patients", description = "Patient related operations")
@Validated
@RestController
@RequestMapping("/patient")
public class PatientController {
    @Autowired
    private PatientService patientService;

    @Operation(summary = "Get all patients currently")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Get all patients successfully"),
        @ApiResponse(responseCode = "500", description = "Internal server error", content = @Content)
    })
    @GetMapping
    public ResponseEntity<List<Patient>> getAll() {
        List<Patient> patients = patientService.getAll();
        return ResponseEntity.ok(patients);
    }

    @Operation(summary = "Get an patient existing by uuid")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Get an patient successfully"),
        @ApiResponse(responseCode = "404", description = "Patient not found", content = @Content),
        @ApiResponse(responseCode = "500", description = "Internal server error", content = @Content)
    })
    @GetMapping("/{id}")
    public ResponseEntity<Patient> getById(@Parameter(description = "uuid for filter patient") @PathVariable UUID id) {
        Patient patient = patientService.getById(id);
        return ResponseEntity.ok(patient);
    }

    @Operation(summary = "Get an patient existing by identification")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Get an patient successfully"),
        @ApiResponse(responseCode = "404", description = "Patient not found", content = @Content),
        @ApiResponse(responseCode = "500", description = "Internal server error", content = @Content)
    })
    @GetMapping("/identification/{identification}")
    public ResponseEntity<Patient> getByIdentification(@Parameter(description = "Identification for filter patient") @PathVariable String identification) {
        Patient patient = patientService.getByIdentification(identification);
        return ResponseEntity.ok(patient);
    }

    @Operation(summary = "Create a new patient associated with a identification, name and an insurance")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Patient created successfully"),
        @ApiResponse(responseCode = "409", description = "Patient already exists", content = @Content),
        @ApiResponse(responseCode = "500", description = "Internal server error", content = @Content)
    })
    @PostMapping
    public ResponseEntity<Patient> create(@RequestBody @Valid PatientDto patientDto) {
        Patient response = patientService.create(patientDto);
        return ResponseEntity.ok(response);
    }
    @Operation(summary = "Update data about a patient by uuid")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Patient updated successfully"),
        @ApiResponse(responseCode = "404", description = "Patient not found", content = @Content),
        @ApiResponse(responseCode = "500", description = "Internal server error", content = @Content)
    })
    @PutMapping("/{id}")
    public ResponseEntity<Patient> update(@Parameter(description = "uuid for filter patient") @PathVariable UUID id, @RequestBody @Valid PatientDto patientDto) {
        Patient response = patientService.update(patientDto, id);
        return ResponseEntity.ok(response);
    }
    @Operation(summary = "Delete an patient by uuid")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Patient deleted successfully"),
        @ApiResponse(responseCode = "404", description = "Patient not found", content = @Content),
        @ApiResponse(responseCode = "500", description = "Internal server error", content = @Content)
    })
    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        patientService.delete(id);
    }
    @Operation(summary = "Get the total number of registered patients")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved patient count")
    })
    @GetMapping("/count")
    public ResponseEntity<Long> count() {
        long count = patientService.count();
        return ResponseEntity.ok(count);
    }

}
