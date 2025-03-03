const pool = require('./db');

async function getCategories() {
    try {
        const [categoryRows] = await pool.query('SELECT * FROM categories');
        if (categoryRows.length == 0) return null;
        return categoryRows;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

module.exports = {
    getCategories
}