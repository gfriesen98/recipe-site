const pool = require("./db");

/**
 * Retrieves a recipe including its associated ingredients
 *
 * @async
 * @function getRecipe
 * @param {number} recipeId - The id of the recipe to retrieve
 * @returns {Promise<object|null>} A promise that resolves with the recipe object if found
 * @throws {Error}
 */
async function getRecipe(recipeId) {
  try {
    const [recipeRows] = await pool.query(
      `SELECT * FROM recipes WHERE id = ?`,
      [recipeId]
    );

    if (recipeRows.length === 0) return null;

    const recipe = recipeRows[0];

    const [ingredientRows] = await pool.query(
      "SELECT * FROM ingredients WHERE recipe_id = ?",
      [recipeId]
    );

    recipe.ingredients = ingredientRows;

    const [categoryRows] = await pool.query(
      "SELECT category_id FROM recipe_categories WHERE recipe_id = ?",
      [recipeId]
    );

    recipe.categoryIds = categoryRows.map((row) => row.category_id);
    return recipe;
  } catch (error) {
    console.error("Error getting recipe:", error);
    throw error;
  } finally {
  }
}

/**
 * Retrieves all recipes from the database including associated ingredients and category_ids
 *
 * @async
 * @function getAllRecipes
 * @returns {Promies<Array<object>>} A promise that resolves with an array of recipe objects or empty array
 * @throws {Error}
 */
async function getAllRecipes() {
  const connection = await pool.getConnection();

  try {
    const [recipeRows] = await connection.query("SELECT * FROM recipes");
    const recipes = [];

    if (recipeRows.length === 0) return recipes;

    for (const recipe of recipeRows) {
      const [ingredientRows, categoryRows] = await Promise.all([
        connection.query("SELECT * FROM ingredients WHERE recipe_id = ?", [
          recipe.id,
        ]),
        connection.query(
          "SELECT category_id FROM recipe_categories WHERE recipe_id = ?",
          [recipe.id]
        ),
      ]);

      recipe.ingredients = ingredientRows[0];
      recipe.categoryIds = categoryRows[0].map((row) => row.category_id);

      recipes.push(recipe);
    }

    return recipes;
  } catch (error) {
    console.error("Error getting all recipes:", error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Retrieves only the recipe and categories (if exist) without the ingredients
 *
 * @async
 * @function getOnlyRecipe
 * @param {number} recipeId - The recipe id
 * @returns {Promise<object|null>} A promise that resolves with the recipe object or null
 * @throws {Error}
 */
async function getOnlyRecipe(recipeId) {
  try {
    const [recipeRows] = await pool.query(
      "SELECT * FROM recipes WHERE id = ?",
      [recipeId]
    );

    if (recipeRows.length === 0) return null;

    const recipe = recipeRows[0];

    const [categoryRows] = await pool.query(
      "SELECT category_id FROM recipe_categories WHERE recipe_id = ?",
      [recipeId]
    );

    recipe.categoryIds = categoryRows.map((row) => row.category_id);
    return recipe;
  } catch (error) {
    console.error("Error getting recipe:", error);
    throw error;
  }
}

/**
 * Retrieves all recipes from the database with category_ids if exists
 *
 * @async
 * @function getAllRecipes
 * @returns {Promies<Array<object>>} A promise that resolves with an array of recipe objects or empty array
 * @throws {Error}
 */
async function getAllOnlyRecipes() {
  try {
    const [recipeRows] = await pool.query("SELECT * FROM recipes");
    const recipes = [];

    if (recipes.length === 0) return recipes;

    for (const recipe of recipeRows) {
      const [categoryRows] = await pool.query(
        "SELECT category_id FROM recipe_categories WHERE recipe_id = ?",
        [recipe.id]
      );

      recipe.categoryIds = categoryRows.map((row) => row.category_id);

      recipes.push(recipe);
    }

    return recipes;
  } catch (error) {
    console.error("Error getting all recipes:", error);
    throw error;
  }
}

/**
 * Creates a new recipe with its associated ingredients categories in the database
 *
 * @async
 * @function createRecipe
 * @param {object} recipeData - An object containing recipe data
 * @param {string} recipeData.name - Name of the recipe
 * @param {string} recipeData.description - Description of the recipe
 * @param {Array<object>} recipeData.instructions - An array of instruction objects, each with a `type` and `content` property
 * @param {string} [recipeData.image_url] - An optional URL to an image of the recipe
 * @param {Array<object>} recipeData.ingredients - An array of ingredient objects, each with a `name`, `amount` and `unit` property
 * @param {Array<number>} [recipeData.categoryIds] - (Optional) Category tag
 * @returns {Promise<number>} A promise that resolves with the ID of the newly created recipe
 * @throws {Error} If there is an error creating the recipe in the database
 */
async function createRecipe(recipeData) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      name,
      description,
      instructions,
      image_url,
      ingredients,
      categoryIds,
    } = recipeData;

    const [recipeResult] = await connection.query(
      `INSERT INTO recipes (name, description, instructions, image_url) VALUES (?, ?, ?, ?)`,
      [name, description, JSON.stringify(instructions), image_url]
    );
    console.log("created recipe");
    const recipeId = recipeResult.insertId;

    for (const ingredient of ingredients) {
      const { name: ingredientName, amount, unit } = ingredient;
      await connection.query(
        `INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (?, ?, ?, ?)`,
        [recipeId, ingredientName, amount, unit]
      );
    }
    console.log("created ingredients");

    if (categoryIds && categoryIds.length > 0) {
      for (const categoryId of categoryIds) {
        await connection.query(
          `INSERT INTO recipe_categories (recipe_id, category_id) VALUES (?, ?)`,
          [recipeId, categoryId]
        );
      }
    }
    console.log("created categories");
    await connection.commit();
    return recipeId;
  } catch (error) {
    await connection.rollback();
    console.error("Error creating recipe:", error);
  } finally {
    connection.release();
  }
}

/**
 * Updates an existing recipe with its associated ingredients and categories in the database.
 *
 * @async
 * @function updateRecipe
 * @param {number} recipeId - The ID of the recipe to update.
 * @param {object} recipeData - An object containing the updated recipe data.
 * @param {string} recipeData.name - The name of the recipe.
 * @param {string} recipeData.description - A brief description of the recipe.
 * @param {Array<object>} recipeData.instructions - An array of instruction objects, each with a `type` and `content` property..
 * @param {string} [recipeData.image_url] - An optional URL to an image of the recipe.
 * @param {Array<object>} recipeData.ingredients - An array of ingredient objects, each with a `name`, `amount`, and `unit` property.
 * @param {Array<number>} [recipeData.categoryIds] - An optional array of category IDs to associate with the recipe.
 * @returns {Promise<number>} A promise that resolves with the number of rows affected in the recipes table.
 * @throws {Error} If there is an error updating the recipe in the database.
 */
async function updateRecipe(recipeId, recipeData) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      name,
      description,
      instructions,
      image_url,
      ingredients,
      categoryIds,
    } = recipeData;

    const [recipeResult] = await connection.query(
      "UPDATE recipes SET name = ?, description = ?, instructions = ?, image_url = ? WHERE id = ?",
      [name, description, JSON.stringify(instructions), image_url, recipeId]
    );

    // delete existing ingredients
    await connection.query("DELETE FROM ingredients WHERE recipe_id = ?", [
      recipeId,
    ]);

    // add new ingredients
    for (const ingredient of ingredients) {
      const { name: ingredientName, amount, unit } = ingredient;
      await connection.query(
        "INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (?, ?, ?, ?)",
        [recipeId, ingredientName, amount, unit]
      );
    }

    // delete existing recipe categories
    if (categoryIds && categoryIds.length > 0) {
      await connection.query(
        "DELETE FROM recipe_categories WHERE recipe_id = ?",
        [recipeId]
      );

      for (const categoryId of categoryIds) {
        await connection.query(
          "INSERT INTO recipe_categories (recipe_id, category_id) VALUES (?, ?)",
          [recipeId, categoryId]
        );
      }
    }

    await connection.commit();
    return recipeResult.affectedRows;
  } catch (error) {
    await connection.rollback();
    console.error("Error updating recipe:", error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Deletes a recipe from the database, including its associated ingredients and categories.
 *
 * @async
 * @function deleteRecipe
 * @param {number} recipeId - The ID of the recipe to delete.
 * @returns {Promise<number>} A promise that resolves with the number of rows affected in the recipes table.
 * @throws {Error} If there is an error deleting the recipe from the database.
 */
async function deleteRecipe(recipeId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [recipeResult] = await connection.query(
      "DELETE FROM recipes WHERE id = ?",
      [recipeId]
    );

    await connection.commit();
    return recipeResult.affectedRows;
  } catch (error) {
    console.error("Error deleting recipe:", error);
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  getRecipe,
  getAllRecipes,
  getOnlyRecipe,
  getAllOnlyRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe,
};
