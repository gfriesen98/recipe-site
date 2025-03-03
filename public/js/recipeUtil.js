/**
 * Scales recipe ingredients based on a target amount of a specific ingredient.
 * 
 * @param {Array} recipe - Array of ingredient objects: [{name, amount, unit}]
 * @param {string} targetIngredient - The name of the ingredient to scale by
 * @param {number} targetAmount - The desired amount of the target ingredient
 * @param {string} targetUnit - The unit of measurement for the target amount
 * @returns {Array} - The scaled recipe in the same format
 */
function scaleRecipe(recipe, targetIngredient, targetAmount, targetUnit) {
    // Define unit conversion factors (relative to a base unit in each category)
    const unitConversions = {
      // Volume conversions (base: ml)
      volume: {
        ml: 1,
        l: 1000,
        tsp: 4.93,
        tbsp: 14.79,
        cup: 236.59,
        floz: 29.57,
        pint: 473.18,
        quart: 946.35,
        gallon: 3785.41
      },
      // Weight conversions (base: g)
      weight: {
        g: 1,
        kg: 1000,
        oz: 28.35,
        lb: 453.59
      },
      // Count (no conversion needed)
      count: {
        count: 1,
        piece: 1,
        slice: 1
      }
    };
  
    // Categorize units by type
    const unitCategories = {
      volume: ['ml', 'l', 'tsp', 'tbsp', 'cup', 'floz', 'pint', 'quart', 'gallon'],
      weight: ['g', 'kg', 'oz', 'lb'],
      count: ['count', 'piece', 'slice']
    };
  
    // Function to determine the category of a unit
    function getUnitCategory(unit) {
      for (const category in unitCategories) {
        if (unitCategories[category].includes(unit.toLowerCase())) {
          return category;
        }
      }
      return null;
    }
  
    // Function to format the scaled amount nicely
    function formatAmount(amount) {
      // Round to 2 decimal places
      const rounded = Math.round(amount * 100) / 100;
      
      // If it's a whole number, return it as an integer
      if (rounded === Math.floor(rounded)) {
        return Math.floor(rounded);
      }
      
      // If it's close to a common fraction, return it as a fraction
      const fractions = {
        0.25: 0.25, // 1/4
        0.33: 0.33, // 1/3
        0.5: 0.5,   // 1/2
        0.67: 0.67, // 2/3
        0.75: 0.75  // 3/4
      };
      
      for (const [decimal, fraction] of Object.entries(fractions)) {
        if (Math.abs(rounded - parseFloat(decimal)) < 0.05) {
          return parseFloat(fraction);
        }
      }
      
      // Otherwise return the decimal
      return rounded;
    }
  
    // Find the target ingredient in the recipe
    const targetIngredientObj = recipe.find(item => 
      item.name.toLowerCase() === targetIngredient.toLowerCase()
    );
  
    // Check if the target ingredient exists in the recipe
    if (!targetIngredientObj) {
      throw new Error(`Target ingredient "${targetIngredient}" not found in recipe`);
    }
  
    // Get the category of the target ingredient's unit
    const targetCategory = getUnitCategory(targetIngredientObj.unit);
    const providedTargetCategory = getUnitCategory(targetUnit);
  
    // Check if the units are compatible
    if (targetCategory !== providedTargetCategory) {
      throw new Error(`Cannot convert between ${targetCategory} and ${providedTargetCategory}`);
    }
  
    // Calculate the scaling factor
    const originalAmountInBaseUnit = targetIngredientObj.amount * 
      unitConversions[targetCategory][targetIngredientObj.unit.toLowerCase()];
    const targetAmountInBaseUnit = targetAmount * 
      unitConversions[targetCategory][targetUnit.toLowerCase()];
    const scalingFactor = targetAmountInBaseUnit / originalAmountInBaseUnit;
  
    // Scale each ingredient
    return recipe.map(ingredient => {
      // Create a new object to avoid modifying the original
      const scaledIngredient = { ...ingredient };
      
      // Scale the amount
      scaledIngredient.amount = formatAmount(ingredient.amount * scalingFactor);
      
      return scaledIngredient;
    });
  }
  
//   Example usage:
  const myRecipe = [
    { name: "beef", amount: 480, unit: "g" },
    { name: "soySauce", amount: 2, unit: "tsp" },
    { name: "darkSoySauce", amount: 1.25, unit: "tsp" },
    { name: "oysterSauce", amount: 0.75, unit: "tsp" },
    { name: "sugar", amount: 0.75, unit: "tsp" },
    { name: "bakingSoda", amount: 1.5, unit: "tsp" },
    { name: "cornStarch", amount: 4.25, unit: "tsp" }
  ];
  
  // Scale the recipe to use 170g of beef
  const scaledRecipe = scaleRecipe(myRecipe, "beef", 170, "g");
  console.log(scaledRecipe);
  