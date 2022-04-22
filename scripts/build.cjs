const fs = require("fs");
const esbuild = require("esbuild");
const sass = require("sass");
const htmlMinifier = require("html-minifier");

const isProduction = process.argv.includes("-prod");

console.time("build");
const script = fs.readFileSync("./script.js");
const jsResult = esbuild.transformSync(script.toString(), { minify: isProduction, format: "iife" });

const style = fs.readFileSync("./style.scss");
const cssResult = sass.compileString(style.toString());
const cssMinResult = esbuild.transformSync(cssResult.css, { minify: isProduction, loader: "css" });

const html = fs.readFileSync("./index.html");
const finalHTML = html.toString()
    .replace("%style%", "<style>" + cssMinResult.code + "</style>")
    .replace("%script%", "<script>" + jsResult.code + "</script>");
const minHTML = !isProduction ? finalHTML : htmlMinifier.minify(finalHTML, {
    removeAttributeQuotes: true,
    collapseWhitespace: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeTagWhitespace: true,
});
console.timeEnd("build");

if(!fs.existsSync("./dist")) {
    fs.mkdirSync("./dist");
}
fs.writeFileSync("./dist/index.html", minHTML);
