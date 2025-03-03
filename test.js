const recipeModel = require('./database/recipeModel');
(async () => {
  const starttime = Date.now();
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
    const endCreate = new Date().getTime();

    const dataas = await recipeModel.createRecipe(body);
    console.log('created id: ' + dataas);
    const endCreate2 = new Date().getTime();

    // const data1 = await recipeModel.getRecipe(data);
    // console.log('recipe id ' + data, data1);
    // const endGet = new Date().getTime();

    const data2 = await recipeModel.getAllRecipes();
    console.log('get all recipes:', data2);
    const endGetAll = new Date().getTime();
    const data2AS = await recipeModel.getAllRecipes();
    console.log('get all recipes:', data2AS);
    const endGetAll2 = new Date().getTime();
    const endScript = new Date().getTime()

    console.log('Create time: ' + (endCreate - starttime )/1000 + "s");
    console.log('Create time 2: ' + (endCreate2 - starttime )/1000 + "s");        
    // console.log('Get time: ' + (endGet - starttime)/1000) + "s";
    console.log('GetAll time: ' + (endGetAll - starttime)/1000 + "s");
    console.log('GetAll time 2: ' + (endGetAll2 - starttime)/1000 + "s");
    console.log('Total time: ' + (endScript - starttime)/1000 + 's');

    process.exit();
  } catch (error) {
    console.error(error);
  }
})();
