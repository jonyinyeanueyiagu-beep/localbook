package com.localbook.service;

import com.localbook.model.Category;
import com.localbook.repository.CategoryRepository;
import com.localbook.repository.BusinessRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CategoryService {
    
    @Autowired
    private CategoryRepository categoryRepository;
    
    @Autowired
    private BusinessRepository businessRepository;
    
    public List<Category> getAllCategories() {
        System.out.println("=== GET ALL CATEGORIES ===");
        
        List<Category> categories = categoryRepository.findAll();
        System.out.println("Found " + categories.size() + " categories");
        
        // ✅ Set businessCount for each category
        categories.forEach(category -> {
            Long count = businessRepository.countByCategory(category.getName());
            category.setBusinessCount(count);
        });
        
        return categories;
    }
    
    public Category getCategoryById(Long id) {
        System.out.println("=== GET CATEGORY BY ID: " + id + " ===");
        Category category = categoryRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
        
        // ✅ Set businessCount
        Long count = businessRepository.countByCategory(category.getName());
        category.setBusinessCount(count);
        
        return category;
    }
    
    @Transactional
    public Category createCategory(Category category) {
        System.out.println("=== CREATE CATEGORY ===");
        System.out.println("Name: " + category.getName());
        System.out.println("Icon: " + category.getIcon());
        
        if (categoryRepository.existsByName(category.getName())) {
            throw new RuntimeException("Category with name '" + category.getName() + "' already exists");
        }
        
        Category saved = categoryRepository.save(category);
        saved.setBusinessCount(0L); // New category has 0 businesses
        System.out.println("✅ Category created with ID: " + saved.getId());
        
        return saved;
    }
    
    @Transactional
    public Category updateCategory(Long id, Category categoryDetails) {
        System.out.println("=== UPDATE CATEGORY: " + id + " ===");
        
        Category category = categoryRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
        
        if (!category.getName().equals(categoryDetails.getName())) {
            if (categoryRepository.existsByName(categoryDetails.getName())) {
                throw new RuntimeException("Category with name '" + categoryDetails.getName() + "' already exists");
            }
        }
        
        category.setName(categoryDetails.getName());
        category.setIcon(categoryDetails.getIcon());
        category.setDescription(categoryDetails.getDescription());
        category.setColor(categoryDetails.getColor());
        
        Category updated = categoryRepository.save(category);
        
        // ✅ Set businessCount
        Long count = businessRepository.countByCategory(updated.getName());
        updated.setBusinessCount(count);
        
        System.out.println("✅ Category updated");
        
        return updated;
    }
    
    @Transactional
    public void deleteCategory(Long id) {
        System.out.println("=== DELETE CATEGORY: " + id + " ===");
        
        Category category = categoryRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
        
        Long businessCount = businessRepository.countByCategory(category.getName());
        
        if (businessCount > 0) {
            throw new RuntimeException("Cannot delete category with " + businessCount + " associated businesses");
        }
        
        categoryRepository.deleteById(id);
        System.out.println("✅ Category deleted");
    }
}