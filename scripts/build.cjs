const fs = require("fs");
const esbuild = require("esbuild");
const sass = require("sass");
const htmlMinifier = require("html-minifier");

if(!fs.existsSync("./docs")) {
    fs.mkdirSync("./docs");
}

const isProduction = process.argv.includes("-prod");

console.time("build");
const script = fs.readFileSync("./src/script.js");
const jsResult = esbuild.transformSync(script.toString(), { minify: isProduction, format: "iife" });
fs.writeFileSync("./docs/script.js", jsResult.code);

const style = fs.readFileSync("./src/style.scss");
const cssResult = sass.compileString(style.toString());
const cssMinResult = esbuild.transformSync(cssResult.css, { minify: isProduction, loader: "css" });

const html = fs.readFileSync("./src/index.html");
const finalHTML = html.toString()
    .replace("%style%", "<style>" + cssMinResult.code + "</style>")
    .replace("%script%", `<script async src="script.js"></script>`);
const minHTML = !isProduction ? finalHTML : htmlMinifier.minify(finalHTML, {
    removeAttributeQuotes: true,
    collapseWhitespace: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeTagWhitespace: true,
});
console.timeEnd("build");

fs.writeFileSync("./docs/index.html", minHTML);
