const fs = require("fs");
const childProcess = require("child_process");

const files = [
    "./src/index.html",
    "./src/script.js",
    "./src/style.scss",
];

build();

for(const file of files) {
    let canBuild = true;
    fs.watch(file, () => {
        if(!canBuild) return;
        console.log(file.replace("./", "") + " changed");
        build();
        canBuild = false;
        setTimeout(() => canBuild = true, 100);
    });
}

function build() {
    try {
        const stdout = childProcess.execSync("node scripts/build.cjs");
        console.log(stdout.toString().replaceAll("\n", ""));
    } catch(e) {
        console.error(e);
    }
}