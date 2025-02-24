# Recipes site

a small site to help keep my recipes together with some added functionality to help scale recipe ingredients

# How to use

**only test.js works right now**

1. install and configure a maria/mysql database
2. install nodejs/npm
3. install nodemon `npm i -i nodemon`
4. clone this repo
5. run `cd recipe-site && cp .env.example .env`
6. edit the `.env` file with your database information
7. run the server with `nodemon` while in the project directory
- note: this project uses the latest version of nodejs which as .env support without the package `dotenv`. please reference `nodemon.json` for running the server