const express = require('express');
const multer = require('multer');
const recipeModel = require('./database/recipeModel');
const categoryModel = require('./database/categoryModel');
const { htmlReplace } = require('./util/htmlReplace');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1h' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { maxAge: '1h' }));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + unique + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({ storage: storage });

/**
 * Pages
 */

app.get('/', async (req, res) => {
  try {
    const allRecipes = await recipeModel.getAllRecipes();
    const elements = [];
    for (let recipe of allRecipes) {
      elements.push(
        `<li class="recipe-item">
          <a href="/recipe/${recipe.id}">${recipe.name}</a>
        </li>`
      );
    }

    const html = await htmlReplace('./public/html/index.html', {recipes: elements.join("\n")});
    return res.send(html);
  } catch (error) {
    console.error(error);
    return res.status(500).send("<h1>Le error has occurred</h1><p>"+error.message+"</p>");
  }
});

app.get('/recipe/new', async (req, res) => {
  try {
    const data = await categoryModel.getCategories();
    const html = await htmlReplace('./public/html/add_recipe.html', {categories: JSON.stringify(data)});
    return res.send(html);
  } catch (error) {
    console.error(error);
    return res.status(500).send("<h1>Le error has occurred</h1><p>"+error.message+"</p>");
  }
});

app.get('/recipe/:id', async (req, res) => {
  try {
    const recipeId = req.params.id;
    const recipe = await recipeModel.getRecipe(recipeId);
    
    let recipeImage = "";
    if (recipe.image_url) {
      recipeImage = `<img id="recipeImage" src="${recipe.image_url}" alt="${recipe.name} image" style="max-width: 100%; height: auto;"/>`;
    }

    const ingredientElements = [];
    for (let ingredient of recipe.ingredients) {
      ingredientElements.push(`
        <li class="ingredient-item">
          <span class="ingredient-text">${ingredient.name} - ${ingredient.amount}${ingredient.unit}</span>
        </li>  
      `);
    }

    const instructionsElements = [];
    for (let instructions of JSON.parse(recipe.instructions)) {
      instructionsElements.push(`
        <li>${instructions.content}</li>  
      `);
    }

    const html = await htmlReplace('./public/html/view_recipe.html', {
      recipeName: recipe.name,
      recipeDescription: recipe.description,
      recipeImage: recipeImage,
      ingredients: ingredientElements.join("\n"),
      instructions: instructionsElements.join("\n")
    });
    return res.send(html);
  } catch (error) {
    
  }
});

app.get('/api/recipes', async (req, res) => {
  try {
    const data = await recipeModel.getAllRecipes();
    return res.json(data);
  } catch (error) {
    console.error(error);
    return res.json({ error: error.message });
  }
});

app.get('/api/recipe-categories', async (req, res) => {
  try {
    const data = await categoryModel.getCategories();
    return res.json({categories: data});
  } catch (error) {
    console.error(error);
    return res.json({categories: []})
  }
})

app.get('/api/recipes/:id', async (req, res) => {
  try {
    let data = await recipeModel.getRecipe(req.params.id);
    data.instructions = JSON.parse(data.instructions);
    return res.json(data);
  } catch (error) {
    console.error(error);
    return res.json({ error: error.message}); 
  }
});

app.post('/api/recipes/new', upload.single('recipeImage'), async (req, res) => {
  try {
    const recipeImage = req.file;
    let imagepath = null;
    if (recipeImage) imagepath = `/uploads/${recipeImage.filename}`;

    const recipeData = {
      name: req.body.recipeTitle,
      description: req.body.recipeDescription,
      ingredients: JSON.parse(req.body.ingredients),
      instructions: JSON.parse(req.body.instructions),
      categoryIds: JSON.parse(req.body.categories),
      image_url: imagepath
    };

    const data = await recipeModel.createRecipe(recipeData);
    return res.redirect(`/recipe/${data}`);
  } catch (error) {
    console.error(error);
    return res.status(500).json({error: error.message});
  }
});

// Error handling middleware (must be defined last)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
