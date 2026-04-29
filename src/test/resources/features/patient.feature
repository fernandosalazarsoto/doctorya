# BDD (Behavior-Driven Development)

Feature: Patient Management
  As a clinic administrator
  I want to manage patient information
  So that I can keep patient records up to date

  # Este archivo es el Libro de Recetas (BDD). Lo puede leer hasta el gerente del hospital.
  Scenario: Create a new patient
    # Preparacion del entorno (GIVEN/DADO)
    Given the system does not have a patient with identification "1053847610"
    
    # Interaccion principal (WHEN/CUANDO) - Simulamos rellenar un formulario
    When I create a patient with the following details:
      | identification | name      | insurance      |
      | 1053847610     | Test Name | Test Insurance |
      
    # Validacion magica del negocio (THEN/ENTONCES). Estas frases ejecutan codigo Java real (Assertions)
    Then the patient should be created successfully
    And the patient identification should be "1053847610"

  Scenario: Get the total count of patients
    Given there are patients registered in the system
    When I request the patient count
    Then the system should return a valid count number