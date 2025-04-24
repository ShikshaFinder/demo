class Dashboard {
  constructor() {
    this.bmiHistory =
      app.utils.getFromStorage(CONFIG.STORAGE_KEYS.BMI_HISTORY) || [];
    this.bmiChart = null;
    this.init();
  }

  init() {
    this.initBMIForm();
    this.initBMIChart();
    this.updateBMIHistory();
  }

  initBMIForm() {
    const bmiForm = document.getElementById("bmiForm");
    const bmiResult = document.getElementById("bmiResult");

    bmiForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const weight = parseFloat(document.getElementById("weight").value);
      const height = parseFloat(document.getElementById("height").value) / 100; // Convert cm to m

      const validation = app.utils.validateForm(
        { weight, height: height * 100 },
        {
          weight: { required: true, min: 20, max: 500 },
          height: { required: true, min: 50, max: 300 },
        }
      );

      if (!validation.isValid) {
        app.utils.showNotification(
          Object.values(validation.errors)[0],
          "error"
        );
        return;
      }

      const bmi = this.calculateBMI(weight, height);
      const category = this.getBMICategory(bmi);
      const date = new Date();

      this.bmiHistory.push({
        date: date.toISOString(),
        bmi,
        weight,
        height,
        category,
      });

      app.utils.saveToStorage(CONFIG.STORAGE_KEYS.BMI_HISTORY, this.bmiHistory);

      bmiResult.innerHTML = `
                <div class="alert alert-info">
                    <h5>Your BMI Results:</h5>
                    <p>BMI: ${bmi.toFixed(1)}</p>
                    <p>Category: ${category}</p>
                    <p>Date: ${app.utils.formatDate(date)}</p>
                </div>
            `;

      this.updateBMIChart();
      bmiForm.reset();
      app.utils.showNotification("BMI calculated successfully!", "success");
    });
  }

  calculateBMI(weight, height) {
    return weight / (height * height);
  }

  getBMICategory(bmi) {
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal weight";
    if (bmi < 30) return "Overweight";
    return "Obese";
  }

  initBMIChart() {
    const ctx = document.getElementById("bmiChart").getContext("2d");

    this.bmiChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "BMI History",
            data: [],
            borderColor: "#0d6efd",
            backgroundColor: "rgba(13, 110, 253, 0.1)",
            borderWidth: 2,
            fill: true,
            tension: 0.4,
          },
        ],
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
                const bmiRecord = this.bmiHistory[context.dataIndex];
                return [
                  `BMI: ${context.raw.toFixed(1)}`,
                  `Weight: ${bmiRecord.weight}kg`,
                  `Height: ${(bmiRecord.height * 100).toFixed(1)}cm`,
                  `Category: ${bmiRecord.category}`,
                ];
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
            beginAtZero: false,
            title: {
              display: true,
              text: "BMI",
            },
          },
        },
      },
    });
  }

  updateBMIChart() {
    const chartData = this.bmiHistory.map((record) => ({
      x: new Date(record.date),
      y: record.bmi,
    }));

    this.bmiChart.data.datasets[0].data = chartData;
    this.bmiChart.update();
  }

  updateBMIHistory() {
    if (this.bmiHistory.length > 0) {
      const latestBMI = this.bmiHistory[this.bmiHistory.length - 1];
      document.getElementById("bmiResult").innerHTML = `
                <div class="alert alert-info">
                    <h5>Latest BMI Results:</h5>
                    <p>BMI: ${latestBMI.bmi.toFixed(1)}</p>
                    <p>Category: ${latestBMI.category}</p>
                    <p>Date: ${app.utils.formatDate(
                      new Date(latestBMI.date)
                    )}</p>
                </div>
            `;
    }
  }
}

// Initialize Dashboard
window.dashboardModule = new Dashboard();
