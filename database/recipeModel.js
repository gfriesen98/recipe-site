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
    const [recipeRows] = await pool.execute(
      `SELECT * FROM recipes WHERE id = ?`,
      [recipeId]
    );

    if (recipeRows.length === 0)
      return null;

    const recipe = recipeRows[0];

    const [ingredientRows] = await pool.execute(
      'SELECT * FROM ingredients WHERE recipe_id = ?',
      [recipeId]
    );

    recipe.ingredients = ingredientRows;

    const [categoryRows] = await pool.execute(
      'SELECT category_id FROM recipe_categories WHERE recipe_id = ?',
      [recipeId]
    );

    recipe.categoryIds = categoryRows.map(row => row.category_id);
    return recipe;
  } catch (error) {
    console.error('Error getting recipe:', error);
    throw error;
  }
}

// async function getAllRecipes() {
//   try {
//     const [recipeRows] = await pool.execute('SELECT * FROM recipes');
//     const recipes = [];
//     console.log(recipeRows)
//     if (recipes.length === 0) return recipes;

//     for (const recipe of recipeRows) {
//       const [ingredientRows] = await pool.execute(
//         'SELECT * FROM ingredients WHERE recipe_id = ?',
//         [recipe.id]
//       );
//       console.log(ingredientRows);
//       recipe.ingredients = ingredientRows;

//       const [categoryRows] = await pool.execute(
//         'SELECT category_id FROM recipe_categories WHERE recipe_id = ?',
//         [recipe.id]
//       );
//       console.log(categoryRows);
//       recipe.categoryIds = categoryRows.map(row => row.category_id);

//       recipes.push(recipe);
//     }

//     return recipes;
//   } catch (error) {
//     console.error('Error getting all recipes:', error);
//     throw error;
//   }
// }

/**
 * Retrieves all recipes from the database including associated ingredients and category_ids
 * 
 * @async
 * @function getAllRecipes
 * @returns {Promies<Array<object>>} A promise that resolves with an array of recipe objects or empty array
 * @throws {Error}
 */
async function getAllRecipes() {
  try {
      const [rows] = await pool.execute(
          `SELECT
              r.id AS recipe_id,
              r.name AS recipe_name,
              r.description,
              r.instructions,
              r.image_url,
              i.id AS ingredient_id,
              i.name AS ingredient_name,
              i.amount,
              i.unit,
              rc.category_id
          FROM recipes r
          LEFT JOIN ingredients i ON r.id = i.recipe_id
          LEFT JOIN recipe_categories rc ON r.id = rc.recipe_id`
      );

      const recipesMap = new Map();

      for (const row of rows) {
          let recipe = recipesMap.get(row.recipe_id);

          if (!recipe) {
              recipe = {
                  id: row.recipe_id,
                  name: row.recipe_name,
                  description: row.description,
                  instructions: row.instructions,
                  image_url: row.image_url,
                  ingredients: [],
                  categoryIds: []
              };
              recipesMap.set(row.recipe_id, recipe);
          }

          if (row.ingredient_id) {
              recipe.ingredients.push({
                  id: row.ingredient_id,
                  name: row.ingredient_name,
                  amount: row.amount,
                  unit: row.unit
              });
          }

          if (row.category_id) {
              if (!recipe.categoryIds.includes(row.category_id)) {
                  recipe.categoryIds.push(row.category_id);
              }
          }
      }

      return Array.from(recipesMap.values());
  } catch (error) {
      console.error('Error getting all recipes:', error);
      throw error;
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
    const [recipeRows] = await pool.execute(
      'SELECT * FROM recipes WHERE id = ?',
      [recipeId]
    );

    if (recipeRows.length === 0) return null;

    const recipe = recipeRows[0];

    const [categoryRows] = await pool.execute(
      'SELECT category_id FROM recipe_categories WHERE recipe_id = ?',
      [recipeId]
    );

    recipe.categoryIds = categoryRows.map(row => row.category_id);
    return recipe;
  } catch (error) {
    console.error('Error getting recipe:', error);
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
    const [recipeRows] = await pool.execute('SELECT * FROM recipes');
    const recipes = [];
    
    if (recipes.length === 0) return recipes;

    for (const recipe of recipeRows) {
      const [categoryRows] = await pool.execute(
        'SELECT category_id FROM recipe_categories WHERE recipe_id = ?',
        [recipe.id]
      );

      recipe.categoryIds = categoryRows.map(row => row.category_id);

      recipes.push(recipe);
    }

    return recipes;
  } catch (error) {
    console.error('Error getting all recipes:', error);
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

    const [recipeResult] = await connection.execute(
      `INSERT INTO recipes (name, description, instructions, image_url) VALUES (?, ?, ?, ?)`,
      [name, description, JSON.stringify(instructions), image_url]
    );
    console.log("created recipe");
    const recipeId = recipeResult.insertId;

    for (const ingredient of ingredients) {
      const { name: ingredientName, amount, unit } = ingredient;
      await connection.execute(
        `INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (?, ?, ?, ?)`,
        [recipeId, ingredientName, amount, unit]
      );
    }
    console.log("created ingredients");

    if (categoryIds && categoryIds.length > 0) {
      for (const categoryId of categoryIds) {
        await connection.execute(
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
      categoryIds
    } = recipeData;

    const [recipeResult] = await connection.execute(
      'UPDATE recipes SET name = ?, description = ?, instructions = ?, image_url = ? WHERE id = ?',
      [name, description, JSON.stringify(instructions), image_url, recipeId]
    );

    // delete existing ingredients
    await connection.execute(
      'DELETE FROM ingredients WHERE recipe_id = ?',
      [recipeId]
    );

    // add new ingredients
    for (const ingredient of ingredients) {
      const {name: ingredientName, amount, unit} = ingredient;
      await connection.execute(
        'INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (?, ?, ?, ?)',
        [recipeId, ingredientName, amount, unit]
      );
    }

    // delete existing recipe categories
    if (categoryIds && categoryIds.length > 0) {
      await connection.execute(
        'DELETE FROM recipe_categories WHERE recipe_id = ?',
        [recipeId]
      );

      for (const categoryId of categoryIds) {
        await connection.execute(
          'INSERT INTO recipe_categories (recipe_id, category_id) VALUES (?, ?)',
          [recipeId, categoryId]
        );
      }
    }

    await connection.commit();
    return recipeResult.affectedRows;
  } catch (error) {
    await connection.rollback();
    console.error('Error updating recipe:', error);
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

    const [recipeResult] = await connection.execute(
      'DELETE FROM recipes WHERE id = ?',
      [recipeId]
    );

    await connection.commit();
    return recipeResult.affectedRows;
  } catch (error) {
    console.error('Error deleting recipe:', error);
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  getRecipe,
  getAllRecipes,
  getAllRecipes2,
  getOnlyRecipe,
  getAllOnlyRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe
};
