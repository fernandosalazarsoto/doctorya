package com.project.doctorya.services;

import java.lang.reflect.Type;
import java.util.List;
import java.util.UUID;

import org.modelmapper.ModelMapper;
import org.modelmapper.TypeToken;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.project.doctorya.dtos.PatientDto;
import com.project.doctorya.entities.PatientEntity;
import com.project.doctorya.exceptions.EntityNotExistsException;
import com.project.doctorya.models.Patient;
import com.project.doctorya.repositories.IPatientRepository;
import com.project.doctorya.shared.Constants;

@SuppressWarnings("all")
@Service
public class PatientService {

    @Autowired
    private IPatientRepository patientRepository;

    @Autowired
    private ModelMapper mapper;

    public Patient create(PatientDto patientDto) {
        PatientEntity patientEntity = mapper.map(patientDto, PatientEntity.class);
        PatientEntity response = patientRepository.save(patientEntity);
        return mapper.map(response, Patient.class);
    }

    public Patient update(PatientDto patientDto, UUID id) {
        PatientEntity patientExist = patientRepository.findById(id)
                .orElseThrow(() -> new EntityNotExistsException(Constants.patientNotFound));

        mapper.map(patientDto, patientExist);
        PatientEntity response = patientRepository.save(patientExist);
        return mapper.map(response, Patient.class);
    }

    public List<Patient> getAll() {
        List<PatientEntity> patients = patientRepository.findAll();
        Type listType = new TypeToken<List<Patient>>() {}.getType();
        return mapper.map(patients, listType);
    }

    public long count() {
        return patientRepository.count();
    }

    public Patient getById(UUID id) {
        PatientEntity patientExist = patientRepository.findById(id)
                .orElseThrow(() -> new EntityNotExistsException(Constants.patientNotFound));

        return mapper.map(patientExist, Patient.class);
    }

    public Patient getByIdentification(String identification) {
        PatientEntity patientExist = patientRepository.findByIdentification(identification)
                .orElseThrow(() -> new EntityNotExistsException(Constants.patientNotFound));

        return mapper.map(patientExist, Patient.class);
    }

    public void delete(UUID id) {
        PatientEntity patientExist = patientRepository.findById(id)
                .orElseThrow(() -> new EntityNotExistsException(Constants.patientNotFound));

        patientRepository.delete(patientExist);
    }
}
