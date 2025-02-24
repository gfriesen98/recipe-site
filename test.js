const recipeModel = require('./database/recipeModel');
(async () => {
  try {
    const body = {
      name: "Delicious Chocolate Cake",
      description: "A rich and decadent chocolate cake recipe.",
      instructions: [
        { type: "ordered", content: "Preheat oven to 350°F (175°C)." },
        {
          type: "ordered",
          content: "Grease and flour a 9-inch round cake pan.",
        },
      ],
      image_url: "https://example.com/chocolate-cake.jpg",
      ingredients: [
        { name: "Flour", amount: 2, unit: "cups" },
        { name: "Sugar", amount: 1.5, unit: "cups" },
        { name: "Cocoa Powder", amount: 0.75, unit: "cups" },
      ],
      categoryIds: [1, 3],
    };

    const data = await recipeModel.createRecipe(body);
    console.log('created id: ' + data);

    const data1 = await recipeModel.getRecipe(data);
    console.log('recipe id ' + data, data1);

    const data2 = await recipeModel.getAllRecipes();
    console.log('get all recipes:', data2);

    process.exit();
  } catch (error) {
    console.error(error);
  }
})();
