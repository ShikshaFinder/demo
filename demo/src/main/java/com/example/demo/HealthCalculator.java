package com.example.demo;

import java.util.Scanner;

public class HealthCalculator {
    
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        
        System.out.println("Welcome to Health Calculator!");
        System.out.println("----------------------------");
        
        while (true) {
            System.out.println("\nChoose an option:");
            System.out.println("1. Calculate BMI");
            System.out.println("2. Exit");
            System.out.print("Enter your choice (1-2): ");
            
            int choice = scanner.nextInt();
            
            if (choice == 2) {
                System.out.println("Thank you for using Health Calculator!");
                break;
            }
            
            if (choice == 1) {
                System.out.print("Enter your weight in kilograms: ");
                double weight = scanner.nextDouble();
                
                System.out.print("Enter your height in meters: ");
                double height = scanner.nextDouble();
                
                double bmi = calculateBMI(weight, height);
                String category = getBMICategory(bmi);
                
                System.out.println("\nYour BMI: " + String.format("%.2f", bmi));
                System.out.println("Category: " + category);
                System.out.println("\nBMI Categories:");
                System.out.println("Underweight: < 18.5");
                System.out.println("Normal weight: 18.5 - 24.9");
                System.out.println("Overweight: 25 - 29.9");
                System.out.println("Obesity: ≥ 30");
            } else {
                System.out.println("Invalid choice. Please try again.");
            }
        }
        
        scanner.close();
    }
    
    public static double calculateBMI(double weight, double height) {
        return weight / (height * height);
    }
    
    public static String getBMICategory(double bmi) {
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