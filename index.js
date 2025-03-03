const express = require('express');
const multer = require('multer');
const recipeModel = require('./database/recipeModel');
const categoryModel = require('./database/categoryModel');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1h' }));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(random() * 1E9);
    cb(null, file.fieldname + '-' + unique + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({ storage: storage });

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
    // let data = await recipeModel.createRecipe(req.body.recipeData);
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
    return res.json({url: `/view_recipe.html?id=${data}`});
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
