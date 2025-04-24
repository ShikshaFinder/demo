class Profile {
  constructor() {
    this.profile = app.utils.getFromStorage(CONFIG.STORAGE_KEYS.PROFILE) || {
      personalInfo: {
        fullName: "",
        age: "",
        gender: "",
        contact: "",
      },
      medicalHistory: {
        allergies: "",
        conditions: "",
      },
    };
    this.init();
  }

  init() {
    this.initProfileForm();
    this.initMedicalHistoryForm();
    this.loadProfileData();
  }

  initProfileForm() {
    const profileForm = document.getElementById("profileForm");

    profileForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const fullName = document.getElementById("fullName").value;
      const age = document.getElementById("age").value;
      const gender = document.getElementById("gender").value;
      const contact = document.getElementById("contact").value;

      const validation = app.utils.validateForm(
        { fullName, age, gender, contact },
        {
          fullName: { required: true },
          age: { required: true, min: 0, max: 150 },
          gender: { required: true },
          contact: {
            required: true,
            pattern: /^[\d\s\-\+\(\)]+$/,
          },
        }
      );

      if (!validation.isValid) {
        app.utils.showNotification(
          Object.values(validation.errors)[0],
          "error"
        );
        return;
      }

      this.profile.personalInfo = {
        fullName,
        age,
        gender,
        contact,
      };

      this.saveProfile();
      app.utils.showNotification("Profile updated successfully!", "success");
    });
  }

  initMedicalHistoryForm() {
    const medicalHistoryForm = document.getElementById("medicalHistoryForm");

    medicalHistoryForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const allergies = document.getElementById("allergies").value;
      const conditions = document.getElementById("conditions").value;

      this.profile.medicalHistory = {
        allergies,
        conditions,
      };

      this.saveProfile();
      app.utils.showNotification(
        "Medical history updated successfully!",
        "success"
      );
    });
  }

  loadProfileData() {
    // Load Personal Information
    const { fullName, age, gender, contact } = this.profile.personalInfo;
    document.getElementById("fullName").value = fullName;
    document.getElementById("age").value = age;
    document.getElementById("gender").value = gender;
    document.getElementById("contact").value = contact;

    // Load Medical History
    const { allergies, conditions } = this.profile.medicalHistory;
    document.getElementById("allergies").value = allergies;
    document.getElementById("conditions").value = conditions;

    // Update profile summary if it exists
    this.updateProfileSummary();
  }

  saveProfile() {
    app.utils.saveToStorage(CONFIG.STORAGE_KEYS.PROFILE, this.profile);
    this.updateProfileSummary();
  }

  updateProfileSummary() {
    const { personalInfo, medicalHistory } = this.profile;

    const summaryCard = document.createElement("div");
    summaryCard.className = "profile-summary mt-4";
    summaryCard.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h5>Profile Summary</h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <h6>Personal Information</h6>
                            <dl class="row">
                                <dt class="col-sm-4">Name</dt>
                                <dd class="col-sm-8">${
                                  personalInfo.fullName || "Not set"
                                }</dd>
                                
                                <dt class="col-sm-4">Age</dt>
                                <dd class="col-sm-8">${
                                  personalInfo.age || "Not set"
                                }</dd>
                                
                                <dt class="col-sm-4">Gender</dt>
                                <dd class="col-sm-8">${
                                  personalInfo.gender || "Not set"
                                }</dd>
                                
                                <dt class="col-sm-4">Contact</dt>
                                <dd class="col-sm-8">${
                                  personalInfo.contact || "Not set"
                                }</dd>
                            </dl>
                        </div>
                        <div class="col-md-6">
                            <h6>Medical History</h6>
                            <dl class="row">
                                <dt class="col-sm-4">Allergies</dt>
                                <dd class="col-sm-8">${
                                  medicalHistory.allergies || "None reported"
                                }</dd>
                                
                                <dt class="col-sm-4">Conditions</dt>
                                <dd class="col-sm-8">${
                                  medicalHistory.conditions || "None reported"
                                }</dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
        `;

    const profileSection = document.getElementById("profile");
    const existingSummary = profileSection.querySelector(".profile-summary");

    if (existingSummary) {
      existingSummary.replaceWith(summaryCard);
    } else {
      profileSection.appendChild(summaryCard);
    }
  }

  exportProfile() {
    const profileData = JSON.stringify(this.profile, null, 2);
    const blob = new Blob([profileData], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "health_profile.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  importProfile(file) {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const importedProfile = JSON.parse(e.target.result);

        // Validate imported data structure
        if (importedProfile.personalInfo && importedProfile.medicalHistory) {
          this.profile = importedProfile;
          this.saveProfile();
          this.loadProfileData();
          app.utils.showNotification(
            "Profile imported successfully!",
            "success"
          );
        } else {
          throw new Error("Invalid profile data structure");
        }
      } catch (error) {
        app.utils.showNotification(
          "Error importing profile: Invalid file format",
          "error"
        );
      }
    };

    reader.onerror = () => {
      app.utils.showNotification("Error reading file", "error");
    };

    reader.readAsText(file);
  }
}

// Initialize Profile
window.profileModule = new Profile();
