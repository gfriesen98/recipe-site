create database if not exists recipes;
use recipes;

CREATE TABLE if not exists recipes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,  -- Optional: A brief description of the recipe
    instructions TEXT,  -- Detailed instructions for preparing the recipe
    image_url VARCHAR(255), -- URL to an image of the recipe (optional)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Timestamp of when the recipe was created
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- Timestamp of when the recipe was last updated
);

CREATE TABLE if not exists ingredients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipe_id INT NOT NULL,  -- Foreign key referencing the recipes table
    name VARCHAR(255) NOT NULL, -- Name of the ingredient
    amount DECIMAL(10, 2),   -- Amount of the ingredient (e.g., 2.5)
    unit VARCHAR(50),       -- Unit of measurement (e.g., cups, grams)
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

CREATE TABLE if not exists categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE -- Name of the category (e.g., "Dessert")
);

CREATE TABLE if not exists recipe_categories (
    recipe_id INT NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY (recipe_id, category_id), -- Composite primary key
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);