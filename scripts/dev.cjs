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
        console.log(file + " changed");
        build();
        canBuild = false;
        setTimeout(() => canBuild = true, 100);
    });
}

function build() {
    const stdout = childProcess.execSync("node scripts/build.cjs");
    console.log(stdout.toString());
}