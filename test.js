const recipeModel = require('./database/recipeModel');
(async () => {
  try {

    const data2 = await recipeModel.getAllRecipes();
    console.log(data2);

    process.exit();
  } catch (error) {
    console.error(error);
  }
})();
