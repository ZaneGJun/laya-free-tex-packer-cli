#!/usr/bin/env node

const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const argv = require('optimist').argv;
const chalk = require('chalk');
const texturePacker = require('free-tex-packer-core');
const mkdirp = require('mkdirp');

const appInfo = require('./package.json');

function isExists(path) {
    return fs.existsSync(path);
}

function fixPath(path) {
    return path.trim().split('\\').join('/');
}

function getNameFromPath(path) {
    return path.trim().split('/').pop();
}

function getExt(path) {
    return path.trim().split('.').pop().toLowerCase();
}

function copyFolderOrFile(src, dest) {
    fse.copy(src, dest, err => {
        if (err){
            console.log(chalk.redBright(err));
        }

        console.log(chalk.greenBright("copy: " + src + " to: " + dest + " success!"));
    });
}

function isFolder(path) {
    if(isExists(path)) {
        return fs.statSync(path).isDirectory();
    }
    else {
        path = fixPath(path);
        let name = getNameFromPath(path);
        let parts = name.split('.');
        return parts.length === 1;
    }
}

function getFolderFilesList(dir, base = '', list = []) {
    let files = fs.readdirSync(dir);
    for(let file of files) {
        let p = path.resolve(dir, file);
        if(isFolder(p) && p.toUpperCase().indexOf('__MACOSX') < 0) {
            list = getFolderFilesList(p, base + file + '/', list);
        }
        else {
            list.push({
                name: (base ? base : '') + file,
                path: p
            });
        }
    }

    return list;
}

function getFolderAllFoldersList(dir, list = []) {
    let files = fs.readdirSync(dir);
    for(let file of files) {
        let p = path.resolve(dir, file);
        if(isFolder(p) && p.toUpperCase().indexOf('__MACOSX') < 0) {
            list.push(p);
            getFolderAllFoldersList(p, list);
        }
    }
}

function getFolderLocalFilesList(dir, list = [], excludeList) {
    let files = fs.readdirSync(dir);
    for(let file of files) {
        let p = path.resolve(dir, file);
        if(isFolder(p) && p.toUpperCase().indexOf('__MACOSX') < 0) {

        }else {
            if(excludeList.indexOf(p) != -1){
                console.log(chalk.yellowBright("exclude file:" + p));
                continue;
            }

            list.push({
                name: file,
                path: p,
            });
        }
    }

    return list;
}

function getFolderLocalExcludeFilesList(dir, list = [], excludeList) {
    let files = fs.readdirSync(dir);
    for(let file of files) {
        let p = path.resolve(dir, file);
        if(isFolder(p) && p.toUpperCase().indexOf('__MACOSX') < 0) {

        }else {
            let fileExt = getExt(p);
            if(fileExt != 'png' && fileExt != 'jpg'){
                list.push({
                    name: file,
                    path: p,
                });
            }else{
                if(excludeList.indexOf(p) != -1){
                    list.push({
                        name: file,
                        path: p,
                    });
                }
            }
        }
    }

    return list;
}

function loadImages(images, files) {
    for(let image of images) {
        try {
            let ext = getExt(image.name);
            if(ext != 'png' && ext != 'jpg'){
                continue;
            }

            files.push({path: image.name, dir: image.path, contents: fs.readFileSync(image.path)});
        }
        catch(e) {
        }
    }
}

console.log(chalk.yellowBright("Free Texture Packer CLI v" + appInfo.version));

let projectPath = argv.project;
if(!projectPath) {
    console.log(chalk.redBright('Choose project, using --project argument'));
    process.exit();
}

fs.readFile(projectPath, (err, content) => {
    if(err) {
        console.error(err.toString());
        return;
    }

    content = content.toString();
    let project = null;
    try {
        project = JSON.parse(content);
    }
    catch(e) {
        console.log(chalk.redBright('Unsupported project format ' + projectPath));
        process.exit();
    }

    //get inputPath
    let outputPath = argv.output;

    if(!outputPath) {
        //outputPath = project.savePath;
        outputPath = project.outputDir;
    }

    if(!outputPath) {
        outputPath = path.dirname(projectPath);
    }

    //get inputPath
    let inputPath = project.inputDir;

    if(!inputPath) {
        inputPath = path.dirname(projectPath);
    }

    console.log('inputPath:' + inputPath);
    console.log('outputDir:' + outputPath);

    //get all folders
    let allFolders = [];
    getFolderAllFoldersList(inputPath, allFolders);
    console.log("-----allFolders-----");
    console.log(allFolders);
    console.log("-----allFolders-----");

    // let options = project.packOptions;
    // //Map exporters to core format
    // if(options.exporter === 'JSON (hash)') options.exporter = 'JsonHash';
    // if(options.exporter === 'JSON (array)') options.exporter = 'JsonArray';
    // if(options.exporter === 'XML') options.exporter = 'XML';
    // if(options.exporter === 'css (modern)') options.exporter = 'Css';
    // if(options.exporter === 'css (old)') options.exporter = 'OldCss';
    // if(options.exporter === 'pixi.js') options.exporter = 'Pixi';
    // if(options.exporter === 'Phaser (hash)') options.exporter = 'PhaserHash';
    // if(options.exporter === 'Phaser (array)') options.exporter = 'PhaserArray';
    // if(options.exporter === 'Phaser 3') options.exporter = 'Phaser3';
    // if(options.exporter === 'Spine') options.exporter = 'Spine';
    // if(options.exporter === 'cocos2d') options.exporter = 'Cocos2d';
    // if(options.exporter === 'UnrealEngine') options.exporter = 'Unreal';
    // if(options.exporter === 'Starling') options.exporter = 'Starling';
    // if(options.exporter === 'Laya') options.exporter = 'LayaBox';
    // if(options.exporter === 'custom') {
    //     console.log(chalk.redBright('CLI does not support a custom exporter'));
    //     process.exit();
    // }
    // options.appInfo = appInfo;

    //get the pack option
    let options = {};
    //set Laya exporter
    options.exporter = "LayaBox";

    //atlas
    options.width = project.atlas.width;
    options.height = project.atlas.height;
    options.powerOfTwo = project.atlas.POT;
    options.textureFormat = project.atlas.textureFormat.toLowerCase();

    //sprite
    //options.fixedSize = project.sprite.size;
    options.padding = project.sprite.padding;
    options.extrude = project.sprite.extrude;
    options.allowRotation = project.sprite.rotation;
    options.maxSize = Number(project.sprite.size);
    options.maxSpriteWidth = Number(project.sprite.width);
    options.maxSpriteHeight = Number(project.sprite.height);

    //options.detectIdentical = true;
    options.allowTrim = true;
    options.trimMode = "trim";
    //options.removeFileExtension = "false";
    //options.prependFolderName = true;
    //options.base64Export = false;
    //options.tinify = false;
    //options.tinifyKey = "";

    options.packer = "MaxRectsPacker";
    options.packerMethod = "Smart";

    options.inputPath = inputPath;
    options.outputPath = outputPath;

    options.includeList = project.includeList;
    options.excludeList = project.excludeList;
    options.extrudeList = project.extrudeList;

    options.scaleDir = project.scaleDir;

    //修正excludeList，需要将父文件夹底下所有子文件夹包含进来
    let childsFoldersList = [];
    for(let folder of options.excludeList){
        if(isFolder(folder)){
            getFolderAllFoldersList(folder, childsFoldersList);
        }
    }
    options.excludeList = options.excludeList.concat(childsFoldersList);

    console.log("-----excludeList-----");
    console.log(options.excludeList);
    console.log("-----excludeList-----");

    //pack all single folder 
    for(let folder of allFolders){

        if(options.excludeList.indexOf(folder) != -1){
            console.log(chalk.yellowBright("exclude folder:" + folder));
            //不需要打包的目录直接复制
            let out = path.resolve(outputPath, folder.replace(inputPath + "\\", ""));
            let outDir = path.dirname(out);
            if(!isExists(outDir)) {
                fs.mkdirSync(outDir, { recursive: true });
            }
            copyFolderOrFile(folder, out);
            continue;
        }

        let files = [];
        if(isExists(folder)) {
            let list = getFolderLocalFilesList(folder, [], options.excludeList);
            loadImages(list, files);
            //不打包的图片直接复制
            let excludeList = getFolderLocalExcludeFilesList(folder, [], options.excludeList);

            for(let file of excludeList){
                let out = path.resolve(outputPath, file.path.replace(inputPath + "\\", ""));
                let outDir = path.dirname(out);
                if(!isExists(outDir)) {
                    fs.mkdirSync(outDir, { recursive: true });
                }
                copyFolderOrFile(file.path, out);
            }
        }

        //change the option texturename
        options.textureName = getNameFromPath(folder);

        //the folder scale
        options.scale = 1;
        if(options.scaleDir[options.textureName] && options.scaleDir[options.textureName] != 1){
            options.scale = options.scaleDir[options.textureName];
        }

        //TODO-get the folder filter

        console.log(chalk.white('Start packing ') + chalk.magentaBright(projectPath));

        texturePacker(files, options, (files) => {
            for(let file of files) {
                let out = path.resolve(outputPath, file.name.replace(inputPath + "\\", ""));
                console.log(chalk.white('Writing ') + chalk.greenBright(out));
                let outDir = path.dirname(out);
                if(!isExists(outDir)) {
                    fs.mkdirSync(outDir, { recursive: true });
                }
                fs.writeFileSync(out, file.buffer);
            }

            console.log(chalk.yellowBright("Done"));
        });
    }
});

