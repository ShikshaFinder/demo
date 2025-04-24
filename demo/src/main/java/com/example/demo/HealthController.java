package com.example.demo;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class HealthController {

    @GetMapping("/")
    public String showCalculator(Model model) {
        return "calculator";
    }

    @PostMapping("/calculate")
    public String calculateBMI(
            @RequestParam double weight,
            @RequestParam double height,
            Model model) {
        
        double bmi = calculateBMI(weight, height);
        String category = getBMICategory(bmi);
        
        model.addAttribute("bmi", String.format("%.2f", bmi));
        model.addAttribute("category", category);
        model.addAttribute("weight", weight);
        model.addAttribute("height", height);
        
        return "calculator";
    }

    private double calculateBMI(double weight, double height) {
        return weight / (height * height);
    }

    private String getBMICategory(double bmi) {
        if (bmi < 18.5) {
            return "Underweight";
        } else if (bmi < 25) {
            return "Normal weight";
        } else if (bmi < 30) {
            return "Overweight";
        } else {
            return "Obesity";
        }
    }
} 