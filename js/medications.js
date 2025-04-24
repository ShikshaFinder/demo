class Medications {
  constructor() {
    this.medications =
      app.utils.getFromStorage(CONFIG.STORAGE_KEYS.MEDICATIONS) || [];
    this.notificationCheckInterval = 60000; // Check every minute
    this.init();
  }

  init() {
    this.initMedicationForm();
    this.updateMedicationList();
    this.startNotificationCheck();
  }

  initMedicationForm() {
    const medicationForm = document.getElementById("medicationForm");

    medicationForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const medName = document.getElementById("medName").value;
      const dosage = document.getElementById("dosage").value;
      const frequency = document.getElementById("frequency").value;
      const time = document.getElementById("medTime").value;

      const validation = app.utils.validateForm(
        { medName, dosage, frequency, time },
        {
          medName: { required: true },
          dosage: { required: true },
          frequency: { required: true },
          time: { required: true },
        }
      );

      if (!validation.isValid) {
        app.utils.showNotification(
          Object.values(validation.errors)[0],
          "error"
        );
        return;
      }

      const medication = {
        id: Date.now(),
        name: medName,
        dosage,
        frequency,
        time,
        status: "upcoming",
        lastTaken: null,
        missedDoses: 0,
        created: new Date().toISOString(),
      };

      this.medications.push(medication);
      app.utils.saveToStorage(
        CONFIG.STORAGE_KEYS.MEDICATIONS,
        this.medications
      );

      this.updateMedicationList();
      medicationForm.reset();
      app.utils.showNotification("Medication added successfully!", "success");
    });
  }

  updateMedicationList() {
    const medicationList = document.getElementById("medicationList");

    if (this.medications.length === 0) {
      medicationList.innerHTML =
        '<p class="text-muted">No medications added yet.</p>';
      return;
    }

    const sortedMedications = this.medications.sort((a, b) => {
      const timeA = new Date(`2000/01/01 ${a.time}`).getTime();
      const timeB = new Date(`2000/01/01 ${b.time}`).getTime();
      return timeA - timeB;
    });

    medicationList.innerHTML = sortedMedications
      .map(
        (med) => `
            <div class="card mb-3 medication-card ${med.status}">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <h5 class="card-title">${med.name}</h5>
                        <span class="badge bg-${this.getStatusBadgeColor(
                          med.status
                        )}">${med.status}</span>
                    </div>
                    <p class="card-text">
                        <small class="text-muted">
                            Dosage: ${med.dosage}<br>
                            Time: ${this.format12HourTime(med.time)}<br>
                            Frequency: ${med.frequency}
                        </small>
                    </p>
                    ${
                      med.lastTaken
                        ? `
                        <p class="card-text">
                            <small class="text-muted">Last taken: ${app.utils.formatDate(
                              new Date(med.lastTaken)
                            )}</small>
                        </p>
                    `
                        : ""
                    }
                    ${
                      med.missedDoses > 0
                        ? `
                        <p class="card-text text-danger">
                            <small>Missed doses: ${med.missedDoses}</small>
                        </p>
                    `
                        : ""
                    }
                    <div class="btn-group">
                        <button class="btn btn-success btn-sm" onclick="medicationsModule.markAsTaken(${
                          med.id
                        })">
                            Mark as Taken
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="medicationsModule.deleteMedication(${
                          med.id
                        })">
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        `
      )
      .join("");
  }

  markAsTaken(medicationId) {
    const medication = this.medications.find((med) => med.id === medicationId);
    if (medication) {
      medication.status = "taken";
      medication.lastTaken = new Date().toISOString();
      app.utils.saveToStorage(
        CONFIG.STORAGE_KEYS.MEDICATIONS,
        this.medications
      );
      this.updateMedicationList();
      app.utils.showNotification(
        `${medication.name} marked as taken!`,
        "success"
      );
    }
  }

  deleteMedication(medicationId) {
    if (confirm("Are you sure you want to delete this medication?")) {
      this.medications = this.medications.filter(
        (med) => med.id !== medicationId
      );
      app.utils.saveToStorage(
        CONFIG.STORAGE_KEYS.MEDICATIONS,
        this.medications
      );
      this.updateMedicationList();
      app.utils.showNotification("Medication deleted successfully!", "success");
    }
  }

  startNotificationCheck() {
    this.checkMedications();
    setInterval(() => this.checkMedications(), this.notificationCheckInterval);
  }

  checkMedications() {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    this.medications.forEach((med) => {
      const [hours, minutes] = med.time.split(":");
      const medicationTime = parseInt(hours) * 60 + parseInt(minutes);

      // Check if it's time for the medication
      if (currentTime === medicationTime) {
        if (med.status !== "taken") {
          app.notifications.sendNotification("Medication Reminder", {
            body: `Time to take ${med.name} - ${med.dosage}`,
            icon: "/icon.png",
          });
        }
      }

      // Check for missed doses
      if (currentTime > medicationTime && med.status !== "taken") {
        med.status = "missed";
        med.missedDoses++;
        app.utils.saveToStorage(
          CONFIG.STORAGE_KEYS.MEDICATIONS,
          this.medications
        );
        this.updateMedicationList();
      }

      // Reset status for the next day
      if (currentTime === 0) {
        med.status = "upcoming";
        app.utils.saveToStorage(
          CONFIG.STORAGE_KEYS.MEDICATIONS,
          this.medications
        );
        this.updateMedicationList();
      }
    });
  }

  format12HourTime(time24) {
    const [hours, minutes] = time24.split(":");
    const period = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes} ${period}`;
  }

  getStatusBadgeColor(status) {
    const colors = {
      upcoming: "primary",
      taken: "success",
      missed: "danger",
    };
    return colors[status] || "secondary";
  }
}

// Initialize Medications
window.medicationsModule = new Medications();
