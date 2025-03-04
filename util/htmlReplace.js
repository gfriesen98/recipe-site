const fs = require('fs/promises');

/**
 * Replace tokens in an html file with a desired value
 * 
 * @async
 * @param {string} filepath - Path to input file
 * @param {Object<string>} tokens - Tokens in an object format as `{foo: "bar"}` where entry `foo` represents the token name in the html file, where the token is wrapped with {}. Example: `<p>{foo}</p>`
 * @param {string} token.value - 
 * @returns {Promise<string|Error>} - Resolves with modified html string, rejects with Error 
 */
async function htmlReplace(filepath, tokens) {
    let html = "";

    try {
        html = await fs.readFile(filepath, "utf-8");
    } catch (error) {
        console.error(`Error reading file: `, error);
        throw error;
    }

    try {
        for (const [token, value] of Object.entries(tokens)) {
            const tokenPattern = new RegExp(`{${token}}`, 'g');
            html = html.replace(tokenPattern, value);
        }
    } catch (error) {
        console.error(error);
        throw error;
    }

    return html;
}

module.exports = {
    htmlReplace
};