class Symptoms {
  constructor() {
    this.symptoms =
      app.utils.getFromStorage(CONFIG.STORAGE_KEYS.SYMPTOMS) || [];
    this.symptomChart = null;
    this.init();
  }

  init() {
    this.initSymptomForm();
    this.initEmojiScale();
    this.initSymptomChart();
    this.updateSymptomHistory();
  }

  initSymptomForm() {
    const symptomForm = document.getElementById("symptomForm");

    symptomForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const symptomType = document.getElementById("symptomType").value;
      const severity = document.getElementById("severity").value;

      const validation = app.utils.validateForm(
        { symptomType, severity },
        {
          symptomType: { required: true },
          severity: { required: true, min: 1, max: 5 },
        }
      );

      if (!validation.isValid) {
        app.utils.showNotification(
          Object.values(validation.errors)[0],
          "error"
        );
        return;
      }

      const symptom = {
        id: Date.now(),
        type: symptomType,
        severity: parseInt(severity),
        timestamp: new Date().toISOString(),
      };

      this.symptoms.push(symptom);
      app.utils.saveToStorage(CONFIG.STORAGE_KEYS.SYMPTOMS, this.symptoms);

      this.updateSymptomHistory();
      this.updateSymptomChart();
      symptomForm.reset();
      this.resetEmojiScale();
      app.utils.showNotification("Symptom logged successfully!", "success");
    });
  }

  initEmojiScale() {
    const emojis = document.querySelectorAll(".emoji");
    const severityInput = document.getElementById("severity");

    emojis.forEach((emoji) => {
      emoji.addEventListener("click", () => {
        const value = emoji.getAttribute("data-value");
        severityInput.value = value;

        emojis.forEach((e) => e.classList.remove("selected"));
        emoji.classList.add("selected");
      });
    });
  }

  resetEmojiScale() {
    const emojis = document.querySelectorAll(".emoji");
    const severityInput = document.getElementById("severity");

    emojis.forEach((emoji) => emoji.classList.remove("selected"));
    severityInput.value = "";
  }

  initSymptomChart() {
    const ctx = document.getElementById("symptomChart").getContext("2d");

    this.symptomChart = new Chart(ctx, {
      type: "line",
      data: {
        datasets: [],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return `Severity: ${context.raw.y}`;
              },
            },
          },
        },
        scales: {
          x: {
            type: "time",
            time: {
              unit: "day",
              displayFormats: {
                day: "MMM d",
              },
            },
            title: {
              display: true,
              text: "Date",
            },
          },
          y: {
            min: 1,
            max: 5,
            title: {
              display: true,
              text: "Severity",
            },
            ticks: {
              stepSize: 1,
            },
          },
        },
      },
    });

    this.updateSymptomChart();
  }

  updateSymptomChart() {
    const symptomTypes = [...new Set(this.symptoms.map((s) => s.type))];
    const colors = {
      headache: "#ff6384",
      fever: "#36a2eb",
      fatigue: "#ffce56",
    };

    const datasets = symptomTypes.map((type) => {
      const typeSymptoms = this.symptoms
        .filter((s) => s.type === type)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      return {
        label: type.charAt(0).toUpperCase() + type.slice(1),
        data: typeSymptoms.map((s) => ({
          x: new Date(s.timestamp),
          y: s.severity,
        })),
        borderColor: colors[type] || "#777",
        backgroundColor: colors[type] ? `${colors[type]}33` : "#77777733",
        fill: true,
        tension: 0.4,
      };
    });

    this.symptomChart.data.datasets = datasets;
    this.symptomChart.update();
  }

  updateSymptomHistory() {
    const today = new Date().toISOString().split("T")[0];
    const last7Days = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const recentSymptoms = this.symptoms
      .filter((s) => {
        const date = s.timestamp.split("T")[0];
        return date >= last7Days && date <= today;
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const todaySymptoms = recentSymptoms.filter(
      (s) => s.timestamp.split("T")[0] === today
    );

    const summaryCard = document.createElement("div");
    summaryCard.className = "symptom-summary mt-4";
    summaryCard.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5>Today's Symptoms</h5>
                        </div>
                        <div class="card-body">
                            ${this.renderSymptomList(todaySymptoms)}
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5>7-Day History</h5>
                        </div>
                        <div class="card-body">
                            ${this.renderSymptomList(recentSymptoms)}
                        </div>
                    </div>
                </div>
            </div>
        `;

    const symptomForm = document.getElementById("symptomForm");
    const existingSummary = document.querySelector(".symptom-summary");

    if (existingSummary) {
      existingSummary.replaceWith(summaryCard);
    } else {
      symptomForm.closest(".card").after(summaryCard);
    }
  }

  renderSymptomList(symptoms) {
    if (symptoms.length === 0) {
      return '<p class="text-muted">No symptoms recorded.</p>';
    }

    return `
            <div class="list-group">
                ${symptoms
                  .map(
                    (symptom) => `
                    <div class="list-group-item">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="mb-0">${
                                  symptom.type.charAt(0).toUpperCase() +
                                  symptom.type.slice(1)
                                }</h6>
                                <small class="text-muted">
                                    ${app.utils.formatDate(
                                      new Date(symptom.timestamp)
                                    )}
                                    ${app.utils.formatTime(
                                      new Date(symptom.timestamp)
                                    )}
                                </small>
                            </div>
                            <div class="d-flex align-items-center">
                                <span class="me-3">${this.getSeverityEmoji(
                                  symptom.severity
                                )}</span>
                                <button class="btn btn-sm btn-danger" 
                                    onclick="symptomsModule.deleteSymptom(${
                                      symptom.id
                                    })">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `
                  )
                  .join("")}
            </div>
        `;
  }

  getSeverityEmoji(severity) {
    const emojis = ["😊", "🙂", "😐", "😟", "😣"];
    return emojis[severity - 1];
  }

  deleteSymptom(symptomId) {
    if (confirm("Are you sure you want to delete this symptom record?")) {
      this.symptoms = this.symptoms.filter((s) => s.id !== symptomId);
      app.utils.saveToStorage(CONFIG.STORAGE_KEYS.SYMPTOMS, this.symptoms);
      this.updateSymptomHistory();
      this.updateSymptomChart();
      app.utils.showNotification(
        "Symptom record deleted successfully!",
        "success"
      );
    }
  }
}

// Initialize Symptoms
window.symptomsModule = new Symptoms();
