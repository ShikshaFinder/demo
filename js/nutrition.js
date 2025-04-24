class Nutrition {
  constructor() {
    this.meals = app.utils.getFromStorage(CONFIG.STORAGE_KEYS.NUTRITION) || [];
    this.waterIntake = app.utils.getFromStorage(
      CONFIG.STORAGE_KEYS.WATER_INTAKE
    ) || {
      date: new Date().toISOString().split("T")[0],
      amount: 0,
    };
    this.init();
  }

  init() {
    this.initMealForm();
    this.initWaterTracking();
    this.updateWaterProgress();
    this.checkNewDay();
  }

  initMealForm() {
    const mealForm = document.getElementById("mealForm");

    mealForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const mealType = document.getElementById("mealType").value;
      const description = document.getElementById("mealDescription").value;
      const calories = parseInt(document.getElementById("calories").value);

      const validation = app.utils.validateForm(
        { mealType, description, calories },
        {
          mealType: { required: true },
          description: { required: true },
          calories: { required: true, min: 0, max: 5000 },
        }
      );

      if (!validation.isValid) {
        app.utils.showNotification(
          Object.values(validation.errors)[0],
          "error"
        );
        return;
      }

      const meal = {
        id: Date.now(),
        type: mealType,
        description,
        calories,
        timestamp: new Date().toISOString(),
      };

      this.meals.push(meal);
      app.utils.saveToStorage(CONFIG.STORAGE_KEYS.NUTRITION, this.meals);

      this.updateMealList();
      mealForm.reset();
      app.utils.showNotification("Meal logged successfully!", "success");
    });

    this.updateMealList();
  }

  updateMealList() {
    const today = new Date().toISOString().split("T")[0];
    const todayMeals = this.meals.filter(
      (meal) => meal.timestamp.split("T")[0] === today
    );

    const totalCalories = todayMeals.reduce(
      (sum, meal) => sum + meal.calories,
      0
    );
    const mealsByType = this.groupMealsByType(todayMeals);

    const mealList = document.createElement("div");
    mealList.className = "meal-summary mt-4";
    mealList.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h5>Today's Nutrition Summary</h5>
                </div>
                <div class="card-body">
                    <div class="total-calories mb-3">
                        <h6>Total Calories: ${totalCalories}</h6>
                        <div class="progress">
                            <div class="progress-bar" role="progressbar" 
                                style="width: ${Math.min(
                                  (totalCalories / 2500) * 100,
                                  100
                                )}%"
                                aria-valuenow="${totalCalories}" aria-valuemin="0" aria-valuemax="2500">
                                ${totalCalories} / 2500 kcal
                            </div>
                        </div>
                    </div>
                    ${Object.entries(mealsByType)
                      .map(
                        ([type, meals]) => `
                        <div class="meal-type mb-3">
                            <h6>${
                              type.charAt(0).toUpperCase() + type.slice(1)
                            }</h6>
                            ${meals
                              .map(
                                (meal) => `
                                <div class="meal-item d-flex justify-content-between align-items-center">
                                    <div>
                                        <p class="mb-0">${meal.description}</p>
                                        <small class="text-muted">
                                            ${app.utils.formatTime(
                                              new Date(meal.timestamp)
                                            )}
                                        </small>
                                    </div>
                                    <div class="d-flex align-items-center">
                                        <span class="badge bg-primary me-2">${
                                          meal.calories
                                        } kcal</span>
                                        <button class="btn btn-sm btn-danger" 
                                            onclick="nutritionModule.deleteMeal(${
                                              meal.id
                                            })">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            `
                              )
                              .join("")}
                        </div>
                    `
                      )
                      .join("")}
                </div>
            </div>
        `;

    const mealFormCard = document.querySelector("#mealForm").closest(".card");
    mealFormCard.parentNode.insertBefore(mealList, mealFormCard.nextSibling);
  }

  groupMealsByType(meals) {
    return meals.reduce((groups, meal) => {
      if (!groups[meal.type]) {
        groups[meal.type] = [];
      }
      groups[meal.type].push(meal);
      return groups;
    }, {});
  }

  deleteMeal(mealId) {
    if (confirm("Are you sure you want to delete this meal?")) {
      this.meals = this.meals.filter((meal) => meal.id !== mealId);
      app.utils.saveToStorage(CONFIG.STORAGE_KEYS.NUTRITION, this.meals);
      this.updateMealList();
      app.utils.showNotification("Meal deleted successfully!", "success");
    }
  }

  initWaterTracking() {
    const addWaterButtons = document.querySelectorAll('[onclick^="addWater"]');
    addWaterButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        const amount = parseInt(button.textContent.match(/\d+/)[0]);
        this.addWater(amount);
      });
    });
  }

  addWater(amount) {
    this.waterIntake.amount += amount;
    app.utils.saveToStorage(CONFIG.STORAGE_KEYS.WATER_INTAKE, this.waterIntake);
    this.updateWaterProgress();
    app.utils.showNotification(`Added ${amount}ml of water!`, "success");
  }

  updateWaterProgress() {
    const progressBar = document.getElementById("waterProgress");
    const waterTotal = document.getElementById("waterTotal");
    const percentage = (this.waterIntake.amount / CONFIG.WATER_GOAL) * 100;

    progressBar.style.width = `${Math.min(percentage, 100)}%`;
    progressBar.setAttribute("aria-valuenow", this.waterIntake.amount);

    waterTotal.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <span>Today's Water Intake:</span>
                <span>${this.waterIntake.amount}ml / ${CONFIG.WATER_GOAL}ml</span>
            </div>
        `;

    if (this.waterIntake.amount >= CONFIG.WATER_GOAL) {
      app.utils.showNotification(
        "Congratulations! You've reached your daily water intake goal!",
        "success"
      );
    }
  }

  checkNewDay() {
    const today = new Date().toISOString().split("T")[0];
    if (this.waterIntake.date !== today) {
      this.waterIntake = {
        date: today,
        amount: 0,
      };
      app.utils.saveToStorage(
        CONFIG.STORAGE_KEYS.WATER_INTAKE,
        this.waterIntake
      );
      this.updateWaterProgress();
    }

    // Check again at midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const timeUntilMidnight = tomorrow - now;

    setTimeout(() => {
      this.checkNewDay();
    }, timeUntilMidnight);
  }
}

// Initialize Nutrition
window.nutritionModule = new Nutrition();
