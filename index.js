
var Canvas = require('canvas');
const sharp = require('sharp');

const fetch = require('node-fetch');

const { createWorker } = require('tesseract.js');
var OCRAD = require('./ocrad.js');


const fs = require('fs');
const path = require("path");

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

startPrompting();

async function startPrompting() {
    function prompt(question) {
        return new Promise(resolve => {
            readline.question(question, answer => {
                resolve(answer);
            });
        });
    }

    let autoAnalyze = (await prompt('Do you want the puzzle to be analyzed automatically? (y/n) (else no option to visualize or locate): ')).toLowerCase();
    while (autoAnalyze !== "n" && autoAnalyze !== "y") {
        autoAnalyze = (await prompt('Do you want the puzzle to be analyzed automatically? (y/n): ')).toLowerCase();;
    }

    if (autoAnalyze.toLowerCase() === "y") {
        let imagePath = await prompt('Name the relative path to the grid puzzle image (to the projects folder): ');

        let seperateLettersFromGridObj = await seperateLettersFromGrid(imagePath, "./letterSeperator", "./communicator", 1 / 15, 1 / 24, 130, 0.0228, "none", null,)//,3300); // second (number param) 1/6 before // instead 35 was 50 , ....  4*8 maybe into percent of image ... (width and height)
        let rowsLength = seperateLettersFromGridObj.rowsLength;
        let xCrops = seperateLettersFromGridObj.xCrops;
        let yCrops = seperateLettersFromGridObj.yCrops;

        let strArr = await getLettersFromImages("./letterSeperator/tempFinals"); // images with one letter only

        let markWords = (await prompt('Do you want to mark words in the grid now? (y/n), type n (now or after y) when you want to continue: ')).toLowerCase();
        while (markWords !== "n" && markWords !== "y") {
            markWords = (await prompt('Do you want to mark words in the grid now? (y/n), type n (now or after y) when you want to continue: ')).toLowerCase();
        }
        if (markWords === "y") {
            await markering();
        }

        let searchWords = (await prompt('Do you want to search for words in the grid now? (y/n): ')).toLowerCase();
        while (searchWords !== "n" && searchWords !== "y") {
            searchWords = (await prompt('Do you want to search for words in the grid now? (y/n): ')).toLowerCase();
        }
        if (searchWords === "y") {
            await getWordsFromGrid(strArr, rowsLength, true, 3); // min words automatically set to 3
        }

        if (searchWords !== "n") {
            let markWordsFinal = (await prompt("Do you want to mark words in the grid now? (y/n) (finish now or after 'y' by entering 'n'): ")).toLowerCase();
            while (markWordsFinal !== "n" && markWordsFinal !== "y") {
                markWordsFinal = (await prompt("Do you want to mark words in the grid now? (y/n) (finish now or after 'y' by entering 'n'): ")).toLowerCase();
            }
            if (markWordsFinal === "y") {
                await markering();
            }
        }

        async function markering() {
            let words = (await prompt('Name the words you want to mark in the grid seperated by a comma (,): ')).toLowerCase();
            while (words !== "n") {
                words = words.replace(/\s/g, "");
                words = words.split(",");
                await markWordsInGrid(strArr, rowsLength, words, xCrops, yCrops);
                words = await prompt('Name the words you want to mark in the grid seperated by a comma (,): ');
            }
        }
    } else {
        let userStr = (await prompt('Type your grid here (like abcd,efgh -> , for a new row; letters must be directly next to each other (in a row)): ')).toLowerCase().replace(/\s/g, "");
        let rows = userStr.split(",");
        let rowsLength = rows[0].length;
        let strArr = [];
        for (let i = 0; i < rows.length; ++i) {
            let row = rows[i];
            for (let j = 0; j < row.length; ++j) {
                strArr.push(row.charAt(j));
            }
        }

        let quickCheck = (await prompt("Do you just want to check wheter or not a word is in the grid? (y/n) (finish now or after 'y' by entering 'n'): ")).toLowerCase();
        while (quickCheck !== "n" && quickCheck !== "y") {
            quickCheck = (await prompt("Do you just want to check wheter or not a word is in the grid? (y/n) (finish now or after 'y' by entering 'n'): ")).toLowerCase();
        }

        if (quickCheck === "y") {
            let searchedWord = (await prompt("Type searched word: ")).toLowerCase();
            let grid = splitArray(strArr, rowsLength);
            let allPossibilities = getAllPossibilities(grid, true).map(obj => obj.word).map(str => str.toLowerCase());

            while (searchedWord !== "n") {
                if (allPossibilities.includes(searchedWord)) {
                    console.log("word is included");
                } else {
                    console.log("word is not included");
                }
                searchedWord = (await prompt("Type searched word: ")).toLowerCase();
            }
        }

        let dictionaryCheck = (await prompt("Auto analyzing for possible words? (y/n): ")).toLowerCase();
        while (dictionaryCheck !== "n" && dictionaryCheck !== "y") {
            dictionaryCheck = (await prompt("Auto analyzing for possible words? (y/n): ")).toLowerCase();
        }
        if (dictionaryCheck === "y") {
            getWordsFromGrid(strArr, rowsLength, true, 3); // min words automatically set to 3
        }
    }
}




async function getWordsFromGrid(strArr, rows, diagonals, minWordLength) {

    let germanWords = [];
    let englishWords = [];

    function loadGerman() {
        if (germanWords.length > 0) {
            // Wenn die deutsche Wortliste bereits im Cache ist, gib sie direkt zurück
            return Promise.resolve(germanWords);
        } else {
            // Andernfalls lade die Textdatei und speichere sie im Cache
            //const url = "https://raw.githubusercontent.com/enz/german-wordlist/master/words";
            //const url = baseUrl + "/wordlists/german/german.txt";
            //return fetch(url)
            //  .then(response => response.text())
            //.then(text => {
            let text = fs.readFileSync("./languageResources/wordlists/german/german.txt", 'utf-8')
            germanWords = text.split(/\r?\n/);
            return germanWords.map((str) => str.toLowerCase());
            //        });
        }
    }

    function loadEnglish() {
        if (englishWords.length > 0) {
            // Wenn die englische Wortliste bereits im Cache ist, gib sie direkt zurück
            return Promise.resolve(englishWords);
        } else {
            // Andernfalls lade die JSON-Datei und speichere sie im Cache
            //const url = "https://raw.githubusercontent.com/dwyl/english-words/master/words_dictionary.json";
            //const url = baseUrl + "/wordlists/english/english.json";
            /*return fetch(url)
                .then(response => response.json())
                .then(json => {*/
            let text = fs.readFileSync("./languageResources/wordlists/english/english.json", 'utf-8')
            let json = JSON.parse(text);
            englishWords = Object.keys(json);
            return englishWords.map((str) => str.toLowerCase());
            //  });
        }
    }

    // Beispielverwendung
    const langs = await Promise.all([loadGerman(), loadEnglish()]);
    germanWords = langs[0];
    englishWords = langs[1];


    // MAIN
    console.group("start - information");
    console.log(`number of german words in wordlist: ${germanWords.length}`);
    console.log(`number of english words in wordlist: ${englishWords.length}`);

    let engTest = "apple";
    let deTest = "apfel";
    console.log("is word " + engTest + " english?: " + isEnglish(engTest));
    console.log("is word " + deTest + " german?: " + isGerman(deTest));

    // NOW TO GRID TESTING

    /*
    let grid =
        [
            ['a', 'f', 'i', 'd', 'e'],
            ['r', 'l', 'l', 'i', 'j'],
            ['l', 'a', 'l', 's', 'o'],
            ['p', 'q', 'c', 's', 'h'],
            ['u', 'v', 'w', 'x', 'y']
        ];
    */


    grid = splitArray(strArr, rows);
    console.log(grid);


    let allPossibilities = getAllPossibilities(grid, diagonals).map(obj => obj.word);


    console.log("all possibilities: " + allPossibilities.length + " items");
    console.groupEnd();
    console.group("finding words");
    let foundWords = [];
    //console.log(allPossibilities);
    for (let i = 0; i < allPossibilities.length; ++i) {
        let item = allPossibilities[i];
        let english = isEnglish(item);
        let german = isGerman(item);
        if ((english || german) && item.length >= minWordLength) {
            if (english && german) {
                console.log("found eng and ger: " + item);
            } else if (german) {
                console.log("found ger: " + item);
            } else {
                console.log("found eng: " + item);
            }
            foundWords.push(item);
        }
    }
    console.log("completed word search");
    console.groupEnd();

    console.group("end - information");
    // sort found words by length
    foundWords = foundWords.sort(function (a, b) { return b.length - a.length });
    // sort found words by commonality
    let sort = sortArrByCommonality(foundWords);
    console.log("final array sort by commonality with the help of a shorter dictionary (some common words might still be missed in ranking by commonality): ");
    console.dir(sort, { 'maxArrayLength': 999 });
    console.groupEnd()
    return sort; // !


    // MAIN END










































    function isGerman(word) {
        return germanWords.includes(word.toLowerCase());
    }

    function isEnglish(word) {
        return englishWords.includes(word.toLowerCase());
    }













































    function sortArrByCommonality(arr) {
        let res = [];
        function isWordInFiles(arrPaths, word) {
            word = word.toLowerCase();
            for (let i = 0; i < arrPaths.length; ++i) {
                const data = fs.readFileSync(arrPaths[i], 'utf-8');
                const json = JSON.parse(data);
                let keys = Object.keys(json);
                keys = keys.map((str) => str.toLowerCase());
                if (keys.includes(word)) {
                    return true;
                } else { // deeper search: e.g. when searching for car: is there a key combination with xx car or -car] or [car-, but simply not car as dictionary word itself (standing alone)
                    for (let i = 0; i < keys.length; ++i) {
                        let key = keys[i];
                        if (key.includes(word)) {
                            if (key.split(" ").includes(word) || key.split("-").includes(word)) {
                                return true;
                            }
                        }
                    }
                }
            }
            return false;
        }

        // Example usage
        const filePaths = ['./languageResources/dictionaries/EnglishToGerman.json', './languageResources/dictionaries/GermanToEnglish.json'];
        let common = [];
        let uncommon = [];
        for (let i = 0; i < arr.length; ++i) {
            if (isWordInFiles(filePaths, arr[i])) {
                // word is common
                common.push(arr[i]);
            } else {
                uncommon.push(arr[i]);
            }
        }
        // set res to both common and uncommon, but common will be at the top
        res = common.concat(uncommon);
        return res;
    }
    function inputToGrid(input) {
        let rows = input.split(",");
        let grid = [];
        for (let row of rows) {
            let chars = row.split("");
            grid.push(chars);
        }
        return grid;
    }


    function reverseString(str) {
        // Step 1. Use the split() method to return a new array
        var splitString = str.split(""); // var splitString = "hello".split("");
        // ["h", "e", "l", "l", "o"]

        // Step 2. Use the reverse() method to reverse the new created array
        var reverseArray = splitString.reverse(); // var reverseArray = ["h", "e", "l", "l", "o"].reverse();
        // ["o", "l", "l", "e", "h"]

        // Step 3. Use the join() method to join all elements of the array into a string
        var joinArray = reverseArray.join(""); // var joinArray = ["o", "l", "l", "e", "h"].join("");
        // "olleh"

        //Step 4. Return the reversed string
        return joinArray; // "olleh"
    }



}
function splitArray(array, rowLength) {
    const result = [];
    for (let i = 0; i < array.length; i += rowLength) {
        const row = array.slice(i, i + rowLength);
        result.push(row);
    }
    return result;
}

function getAllPossibilities(grid, diagonals) { // very shitty, especially how cells are handled (!!)
    function reverseEachListItem(arr) {
        const newArray = arr.map(obj => {
            const reversedWord = obj.word.split('').reverse().join('');
            return { word: reversedWord, cells: obj.cells };
        });
        return newArray;
    }

    function forwardWords() {
        let words = [];
        let cells = [];
        // horizontale Wörter
        for (let i = 0; i < grid.length; i++) {
            let word = '';
            for (let j = 0; j < grid[i].length; j++) { // j is the beginning cell (column wise)
                // jedes mögliche Wort am aktuellen Ort ermitteln
                for (let k = j; k < grid[i].length; k++) {
                    word += grid[i][k];
                    cells.push([k, i]); // [row, column]
                    words.push({ word: word, cells: cells.slice(0, word.length) });
                }
                word = '';
                cells = [];
            }
        }

        // vertikale Wörter
        for (let i = 0; i < grid[0].length; i++) {
            let word = '';
            for (let j = 0; j < grid.length; j++) {
                // jedes mögliche Wort am aktuellen Ort ermitteln
                for (let k = j; k < grid.length; k++) {
                    word += grid[k][i];
                    cells.push([i, k]); // [row, column]
                    words.push({ word: word, cells: cells.slice(0, word.length) });
                }
                word = '';
                cells = [];
            }
        }


        // diagonale Wörter von links oben nach rechts unten
        if (diagonals) {
            for (let i = 0; i < grid.length; i++) {

                for (let j = 0; j < grid[i].length; j++) {
                    for (let k = 0; i + k < grid.length && j + k < grid[i].length; k++) {
                        let word = '';
                        for (let l = 0; l <= k; l++) {
                            word += grid[i + l][j + l];
                            cells.push([j + l, i + l]); // [row, column]
                        }
                        words.push({ word: word, cells: cells });
                        cells = [];
                    }
                }
            }

            // diagonale Wörter von rechts oben nach links unten
            for (let i = 0; i < grid.length; i++) {
                for (let j = grid[i].length - 1; j >= 0; j--) {
                    for (let k = 0; i + k < grid.length && j - k >= 0; k++) {
                        let word = '';
                        for (let l = 0; l <= k; l++) {
                            word += grid[i + l][j - l];
                            cells.push([j - l, i + l]); // [row, column]
                        }
                        words.push({ word: word, cells: cells });
                        cells = [];
                    }
                }
            }
        }

        return words;
    }

    let wordsForward = forwardWords();
    let wordsBackward = reverseEachListItem(wordsForward);
    let res = wordsForward.concat(wordsBackward);

    return res;
}





async function markWordsInGrid(strArr, rows, keyWords, xCrops, yCrops) {
    console.group("word-marker");
    let grid = splitArray(strArr, rows);
    let possibilities = getAllPossibilities(grid, true);
    let cellsCollection = [];


    let lastColorI = -1;
    let lastColor;;
    for (let i = 0; i < keyWords.length; ++i) {
        let indexArr = possibilities.filter(obj => obj.word.toLowerCase() === keyWords[i].toLowerCase()).map(obj => possibilities.indexOf(obj));

        for (let j = 0; j < indexArr.length; ++j) {
            index = indexArr[j];
            if (index !== -1) {
                let obj = {};
                obj.cells = possibilities[index].cells;
                //console.log(obj.cells)
                function generateColor() {
                    let color = {};
                    let r, g, b;

                    do {
                        r = Math.floor(Math.random() * 256);
                        g = Math.floor(Math.random() * 256);
                        b = Math.floor(Math.random() * 256);
                    } while (Math.abs(r - g) < 30 || Math.abs(r - b) < 30 || Math.abs(g - b) < 30); // for contrast to white background

                    color.r = r;
                    color.g = g;
                    color.b = b;

                    return color;
                }


                if (i === lastColorI) {
                    obj.color = lastColor;
                } else {
                    obj.color = generateColor();
                    lastColor = obj.color;
                }
                lastColorI = i;
                console.log("found word: " + keyWords[i] + " in grid, marking it with color: " + JSON.stringify(obj.color));
                cellsCollection.push(obj);
            } else {
                console.log("could not find word: " + keyWords[i] + " in grid");
            }
        }

    }
    console.log("now marking cells");
    if (cellsCollection.length > 0) { // ()
        await markCellsWithXandYCrops("./communicator/visualizedCropping.png", "./communicator/wordVisualizations.png", xCrops, yCrops, cellsCollection); // maybe as param safe location !!!
    }
    console.groupEnd();
}
async function markCellsWithXandYCrops(inputPath, outputPath, xCrops, yCrops, cells) {
    console.group("cell-marker");
    await new Promise(resolve => {
        let resXCrops = [];
        for (let i = 0; i < xCrops.ends.length; ++i) {
            resXCrops.push({ left: i !== 0 ? Math.ceil(xCrops.ends[i - 1]) : Math.ceil(xCrops.leftBegin), width: i !== 0 ? (i !== xCrops.ends.length - 1 ? Math.ceil(xCrops.ends[i] - xCrops.ends[i - 1]) : Math.ceil(xCrops.rightEnd - xCrops.ends[i - 1])) : Math.ceil(xCrops.ends[0] - xCrops.leftBegin) });
        }
        let resYCrops = [];
        for (let i = 0; i < yCrops.ends.length; ++i) {
            resYCrops.push({ top: i !== 0 ? Math.ceil(yCrops.ends[i - 1]) : Math.ceil(yCrops.topBegin), height: i !== 0 ? (i !== yCrops.ends.length - 1 ? Math.ceil(yCrops.ends[i] - yCrops.ends[i - 1]) : Math.ceil(yCrops.bottomEnd - yCrops.ends[i - 1])) : Math.ceil(yCrops.ends[0] - yCrops.topBegin) })
        }
        markCells(inputPath, outputPath, cells);
        function markCells(inputPath, outputPath, cells) {
            let coords = [];
            for (let i = 0; i < cells.length; ++i) {
                for (let j = 0; j < cells[i].cells.length; ++j) {
                    let row = cells[i].cells[j][0];
                    let col = cells[i].cells[j][1];
                    let left = resXCrops[row].left;
                    let top = resYCrops[col].top;
                    let width = resXCrops[row].width;
                    let height = resYCrops[col].height;
                    coords.push({ left: left, top: top, width: width, height: height, color: cells[i].color });
                }
            }
            markAt(inputPath, outputPath, coords);
        }
        //markAt(inputPath, outputPath, coordinates, 'red');
        async function markAt(inputPath, outputPath, coordinates) {
            let resArr = [];
            for (let i = 0; i < coordinates.length; i++) {
                let left = coordinates[i].left;
                let top = coordinates[i].top;
                let width = coordinates[i].width;
                let height = coordinates[i].height;

                const tintedArea = await sharp(inputPath)
                    .extract({ left, top, width, height })
                    .tint(coordinates[i].color)
                    .toBuffer();
                resArr.push({ input: tintedArea, left: left, top: top });
            }
            sharp(inputPath)
                .composite(resArr)
                .toFile(outputPath, (err, info) => {
                    if (err) throw err;
                    console.log("successfully marked cells")
                    console.groupEnd();
                    resolve();
                });
        }
    });
}

async function seperateLettersFromGrid(grid, outputDir, communicatorDir, XFilledRequired, YFilledRequired, minBackgroundDiff, streakMaxDiff, filter, xUpscale) {
    let backgroundColor;
    let imgPath = grid;


    // RETURNS
    let rowsLength;
    let xCrops;
    let yCrops;


    let columns;
    // create output dir and needed folders
    createFoldersIfNeeded(outputDir + "/tempVerticals"); // works because recursive
    createFoldersIfNeeded(outputDir + "/tempFinals");
    function createFoldersIfNeeded(dir) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    console.group("image analysing");
    if (filter !== "none" && filter !== null && filter) {
        console.log("using ridge detection filter");
        await useFilter(imgPath, outputDir + "/filteredImage.png", filter); // png
        console.log("filtering done, starting splitting");
        imgPath = outputDir + "/filteredImage.png";
    }

    // some image preprocessing
    if (xUpscale) {
        await new Promise((resolve, reject) => {
            sharp(imgPath)
                .grayscale()
                .removeAlpha()
                .resize({ width: xUpscale, fit: 'contain' })
                //.sharpen(6.8, 2.69, 0)
                //.sharpen(sigma=0.5, x1=1, y2=10, y3=20, m1=0, m2=3)
                .toFile(outputDir + "/preprocessed.png", async (err, info) => {
                    if (err) throw err;
                    console.log("some image preprocessing done");
                    imgPath = outputDir + "/preprocessed.png";
                    resolve();
                });
        });
    } else {
        await new Promise((resolve, reject) => {
            sharp(imgPath)
                .grayscale()
                .removeAlpha()
                //.resize({ width: xUpscale, fit: 'contain' })
                //.sharpen(6.8, 2.69, 0)
                .toFile(outputDir + "/preprocessed.png", async (err, info) => {
                    if (err) throw err;
                    console.log("some image preprocessing done");
                    imgPath = outputDir + "/preprocessed.png";
                    resolve();
                });
        });
    }


    await new Promise((resolve, reject) => {
        sharp(imgPath)
            //.modulate({ brightness: 1.2, saturation: 1.2, hue: 0 })
            .grayscale()
            .removeAlpha()

            .raw()
            .toBuffer(async (err, buffer, info) => {
                if (err) throw err;

                // `buffer` enthält das rohe Pixelarray
                const pixels = [];

                for (let i = 0; i < info.height; i++) { // read each pixel while already greyscaling it
                    const row = [];
                    for (let j = 0; j < info.width; j++) {
                        const offset = (i * info.width + j) * info.channels;
                        let r = buffer[offset];
                        let g = buffer[offset + 1];
                        let b = buffer[offset + 2];
                        let gray = (r + g + b) / 3;
                        r = gray;
                        g = gray;
                        b = gray;
                        row.push({ r, g, b });
                    }
                    pixels.push(row);
                }


                console.log(info);
                // using pixel arroy now

                // SET UP BASICS
                backgroundColor = getBackgroundColorFromTwoColors(pixels);
                console.log("recognized background color (rgb): " + backgroundColor);
                // Example usage
                const backgroundMoreTo = isColorCloserToWhiteOrBlack(backgroundColor); // "closer to black"
                if (backgroundMoreTo === "black") {
                    console.log("background is closer to black, will need to invert image");
                    await new Promise((resolve, reject) => {
                        sharp(imgPath)
                            .negate({ alpha: false })
                            .toFile(outputDir + "/inverted.png", function (err) {
                                if (err) throw err;
                                console.log("inverted");
                                imgPath = outputDir + "/inverted.png";
                                resolve();
                            })
                    });
                }
                // GET X CROPS AND SAFE
                xCrops = getXCrops(backgroundColor, pixels);
                // deleting temp folder before
                let directory = outputDir + "/tempVerticals/";
                fs.readdir(directory, (err, files) => {
                    if (err) throw err;

                    for (const file of files) {
                        fs.unlink(path.join(directory, file), (err) => {
                            if (err) throw err;
                        })
                    }

                    directory = outputDir + "/tempFinals/";
                    fs.readdir(directory, (err, files) => {
                        if (err) throw err;

                        for (const file of files) {
                            fs.unlink(path.join(directory, file), (err) => {
                                if (err) throw err;
                            })
                        }
                        deletedTempDirectory();
                    });
                })
                if (xCrops.ends.length === 0) {
                    console.log("seems like there were no sections found");
                    console.groupEnd();
                    resolve("no sections found");
                }


                async function deletedTempDirectory() {
                    let verticalPaths = [];


                    async function drawLines(outputDir, xPositions, yPositions, filePath, color = [255, 255, 0]) {
                        try {

                            const image = sharp(filePath);
                            const metadata = await image.metadata();
                            const channels = 3;
                            const imageData = await image.raw().toBuffer({ resolveWithObject: true });
                            let lineWidth = metadata.height / 250;
                            const [r, g, b] = color;





                            // draw vertical lines
                            for (let i = 0; i < xPositions.length; ++i) {
                                const xPos = xPositions[i];
                                for (let y = 0; y < metadata.height; y++) {
                                    for (let j = 0; j < lineWidth; j++) {
                                        try {
                                            let x = xPos - (Math.ceil(lineWidth / 2)) + j;
                                            const index = (y * metadata.width + x) * channels;
                                            imageData.data[index] = r; // set red channel to r
                                            imageData.data[index + 1] = g; // set green channel to g
                                            imageData.data[index + 2] = b; // set blue channel to b
                                        } catch (e) {

                                        }
                                    }
                                }
                            }

                            // draw horizontal lines
                            for (let i = 0; i < yPositions.length; ++i) {
                                const yPos = yPositions[i];
                                for (let x = 0; x < metadata.width; x++) {
                                    for (let j = 0; j < Math.ceil(lineWidth); j++) {
                                        try {
                                            let y = yPos - (Math.ceil(lineWidth / 2)) + j;
                                            const index = (y * metadata.width + x) * channels;
                                            imageData.data[index] = r; // set red channel to r
                                            imageData.data[index + 1] = g; // set green channel to g
                                            imageData.data[index + 2] = b; // set blue channel to b
                                        } catch (e) {

                                        }

                                    }
                                }
                            }
                            createFoldersIfNeeded(outputDir);
                            // write image
                            await sharp(imageData.data, {
                                raw: {
                                    width: metadata.width,
                                    height: metadata.height,
                                    channels: channels
                                }
                            }).toFile(outputDir + './visualizedCropping.png');

                            console.log('Vertical lines drawn successfully! - cropping visualized and saved in communicator folder');
                        } catch (err) {
                            console.error(err);
                        }



                    }

                    for (let i = 0; i < xCrops.ends.length; ++i) {
                        await new Promise((resolve, reject) => {
                            sharp(imgPath)
                                .extract({ left: i !== 0 ? Math.ceil(xCrops.ends[i - 1]) : Math.ceil(xCrops.leftBegin), top: 0, width: i !== 0 ? (i !== xCrops.ends.length - 1 ? Math.ceil(xCrops.ends[i] - xCrops.ends[i - 1]) : Math.ceil(xCrops.rightEnd - xCrops.ends[i - 1])) : Math.ceil(xCrops.ends[0] - xCrops.leftBegin), height: info.height })
                                .toFile(outputDir + '/tempVerticals/' + i + '.png', async (err, info) => {
                                    verticalPaths.push(outputDir + '/tempVerticals/' + i + '.png');
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        console.log("added " + i + '.png as vertical image part');
                                        if (i === xCrops.ends.length - 1) {
                                            console.log("finished vertical cropping, now cropping all letters off of already cropped vertical parts");
                                            // main finish in finish() function
                                            await finish();
                                            console.groupEnd();

                                            resolve();
                                        } else {
                                            resolve();
                                        }
                                        //console.log(info);
                                    }
                                });
                        });
                    }
                    resolve();

                    async function finish() {
                        // GET Y CROPS AND SAFE
                        yCrops = getYCrops(backgroundColor, pixels);
                        await finishWithXCrops(verticalPaths, yCrops);


                        const filePath = imgPath;
                        let finalX = [];
                        for (let i = 0; i < xCrops.ends.length; ++i) { // finalX = xCrops.ends didn't work properly on push !!
                            finalX.push(xCrops.ends[i]);
                        }
                        //finalX = xCrops.ends;

                        finalX[finalX.length - 1] = xCrops.rightEnd;
                        finalX.push(xCrops.leftBegin);

                        let finalY = yCrops.ends;
                        finalY[finalY.length - 1] = yCrops.bottomEnd;
                        finalY.push(yCrops.topBegin);
                        await drawLines(communicatorDir, finalX.map(Math.ceil), finalY.map(Math.ceil), filePath, [50, 205, 50]);
                    }
                }
            });
    });
    return { rowsLength, xCrops, yCrops };
    function isColorCloserToWhiteOrBlack(rgbColor) {
        const red = rgbColor[0];
        const green = rgbColor[1];
        const blue = rgbColor[2];

        const grayscale = 0.2989 * red + 0.5870 * green + 0.1140 * blue;

        const brightness = (red + green + blue) / 3;

        return brightness > 128 ? 'white' : 'black';
    }







    async function finishWithXCrops(paths, yCrops) {
        let allPathsLength = paths.length;
        for (let i = 0; i < paths.length; ++i) {
            let myPath = paths[i];
            await new Promise((resolve, reject) => {
                sharp(myPath)
                    .modulate({ brightness: 1.2, saturation: 1.2, hue: 0 })
                    .grayscale()
                    .raw()
                    .toBuffer(async (err, buffer, info) => {
                        if (err) throw err;

                        // `buffer` enthält das rohe Pixelarray
                        const pixels = [];

                        for (let i = 0; i < info.height; i++) {
                            const row = [];
                            for (let j = 0; j < info.width; j++) {
                                const offset = (i * info.width + j) * info.channels;
                                const r = buffer[offset];
                                const g = buffer[offset + 1];
                                const b = buffer[offset + 2];
                                row.push({ r, g, b });
                            }
                            pixels.push(row);
                        }

                        //  console.log("cropping now vertical section of: " + myPath);

                        // using pixel arroy now
                        let splitPath = myPath.split("/");
                        let myPartNum = Number(splitPath[splitPath.length - 1].split(".")[0]);


                        for (let i = 0; i < yCrops.ends.length; ++i) {
                            let toFile = outputDir + '/tempFinals/' + ((i) * allPathsLength + (myPartNum + 1)) + '.png'; // calculate number in query ...
                            await new Promise((resolve, reject) => {
                                sharp(myPath)
                                    .extract({ left: 0, top: i !== 0 ? Math.ceil(yCrops.ends[i - 1]) : Math.ceil(yCrops.topBegin), width: info.width, height: i !== 0 ? (i !== yCrops.ends.length - 1 ? Math.ceil(yCrops.ends[i] - yCrops.ends[i - 1]) : Math.ceil(yCrops.bottomEnd - yCrops.ends[i - 1])) : Math.ceil(yCrops.ends[0] - yCrops.topBegin) })
                                    .toFile(toFile, (err, info) => {
                                        if (err) {
                                            console.log(err);
                                        } else {
                                            //  console.log("added as final image part: " + toFile);
                                        }
                                        resolve();
                                    });
                            });
                        }
                        resolve();
                    });
            });
        }
    }









    function countMostOftenOccurrences(arr) {
        var counts = {};

        for (var i = 0; i < arr.length; i++) {
            var num = arr[i];
            for (let j = -1; j < 2; ++j) {
                counts[num + j] = counts[num + j] ? counts[num + j] + 1 : 1 // count key --> streaksNum, value --> how often does the streak occur (with a tolerance of 1)
            }
            //counts[num] = counts[num] ? counts[num] + 1 : 1;
        }

        //console.log(counts)
        //console.log(peaksFromObj(counts));
        let peaks = peaksFromObj(counts);
        function peaksFromObj(obj) {
            const keys = Object.keys(obj);
            let sameKeys = keys[0];
            for (let i = 0; i < keys.length; ++i) {
                if (keys[i] !== sameKeys) {
                    sameKeys = true;
                    break;
                } else if (i === keys.length - 1) {
                    sameKeys = false;
                }
            }
            const peaks = keys.filter((key, index) => {
                if (keys.length === 2 || sameKeys) {
                    return true;
                }
                if (index === 0 || index === keys.length - 1) {
                    return false;
                }

                const prevKey = keys[index - 1];
                const nextKey = keys[index + 1];
                const prevVal = obj[prevKey];
                const currVal = obj[key];
                const nextVal = obj[nextKey];

                if (prevVal === currVal && currVal === nextVal) {
                    return false; // exclude plateau
                }

                if (currVal > prevVal && currVal > nextVal) {
                    return true; // peak found
                }

                // check if there's a plateau
                if (prevVal === currVal && currVal > nextVal) {
                    let i = index + 1;
                    while (i < keys.length && obj[keys[i]] === currVal) {
                        i++;
                    }
                    if (i < keys.length && obj[keys[i]] < currVal) {
                        return true; // plateau followed by a drop
                    }
                }

                return false;
            });
            return peaks.map(Number);
        }

        /*let biggestCount = 0;
        let resNum = 0;
        for (var num in counts) {
            if (counts[num] > biggestCount) {
                biggestCount = counts[num];
                resNum = num;
            }
            result.push([Number(num), counts[num]]);
        }*/

        let resKey = Math.max(...peaks); // key standing for the most often occurring streak with a tolerance of 1, not the count, but the streak-length itself (biggest one)
        let accordingCount = counts[resKey]; // not really needed as return value yet
        return [resKey, accordingCount]; //
    }



    function getYCrops(colorBackground, pixels) {
        let streak = 0;
        let currentStreakBegin = 0;
        let streaks = [];
        for (let y = 0; y < pixels.length; y++) {
            let count = 0;
            for (let x = 0; x < pixels[0].length; x++) {
                //console.log(getDistance([pixels[y][x].r, pixels[y][x].g, pixels[y][x].b], colorBackground));
                if (getDistance([pixels[y][x].r, pixels[y][x].g, pixels[y][x].b], colorBackground) >= minBackgroundDiff) {
                    // color is not background color
                    count++;
                }
            }
            //console.log("count: " + count + " / " + pixels.length)
            if (count > pixels[0].length * XFilledRequired) {
                //console.log("found pillar");
                streak++;
            } else if (streak > 0) {
                streaks.push([streak, y + 1, currentStreakBegin]);
                //console.log("got streak of " + streak + "");
                //console.log("streak x end: " + (x + 1));
                streak = 0;
            } else if (streak === 0) {
                // begin of streak
                currentStreakBegin = y + 1;
            }

            //colors.push([pixels[y][x].r, pixels[y][x].g, pixels[y][x].b]);
        }

        console.log("found y - streaks: ");
        console.log(streaks);
        let mostOften = countMostOftenOccurrences(firstItemsOfArr(streaks));
        console.log("picked the following as supposed streak-thickness for the letters with exact occurance - number: ");
        console.log(mostOften);
        let firstStreakSpacing;
        let lastStreakSpacing;
        let streakYEnds = getResultingStreakYEnds();
        columns = streakYEnds.length;
        let resStart = streaks[0][2] - firstStreakSpacing;
        let resEnd = streaks[streaks.length - 1][1] + lastStreakSpacing;

        // if resStart || resEnd lies in image || valid, else change to max / min values possible
        if (resStart < 0 || !resStart) {
            resStart = 0;
        }
        if (resEnd > pixels.length - 1 || !resEnd) {
            resEnd = pixels.length - 1;
        }
        return { "ends": streakYEnds, "topBegin": resStart, "bottomEnd": resEnd };

        function getResultingStreakYEnds() {
            let res = [];
            let finalStreaks = [];
            for (let i = 0; i < streaks.length; i++) {
                if (Math.abs(streaks[i][0] - mostOften[0]) <= pixels.length * streakMaxDiff) {
                    finalStreaks.push(streaks[i]);
                }
            }
            console.log("found " + finalStreaks.length + " streaks after similarity streak check");
            for (let i = 0; i < finalStreaks.length; ++i) {
                if (i !== finalStreaks.length - 1) {
                    let spacing = (finalStreaks[i + 1][2] - finalStreaks[i][1]) / 2;
                    if (i === 0) {
                        firstStreakSpacing = spacing;
                    } else if (i === finalStreaks.length - 2) { // (--> if finalStreaks.length == 2 --> not called --> therefore and for safety !-call)
                        lastStreakSpacing = spacing;
                    }
                    res.push(finalStreaks[i][1] + spacing); // + (end to start) / 2
                } else {
                    res.push(finalStreaks[i][1]);
                }
            }
            return res;
        }



        function firstItemsOfArr(arr) {
            let res = [];
            for (let i = 0; i < arr.length; i++) {
                res.push(arr[i][0]);
            }
            return res;
        }
    }


    function getXCrops(colorBackground, pixels) {
        let streak = 0;
        let currentStreakBegin = 0;
        let streaks = [];
        for (let x = 0; x < pixels[0].length; x++) {
            let count = 0;
            for (let y = 0; y < pixels.length; y++) {
                //console.log(getDistance([pixels[y][x].r, pixels[y][x].g, pixels[y][x].b], colorBackground));
                if (getDistance([pixels[y][x].r, pixels[y][x].g, pixels[y][x].b], colorBackground) >= minBackgroundDiff) {
                    // color is not background color
                    count++;
                }
            }
            //console.log(count);
            //console.log("count: " + count + " / " + pixels.length)
            //console.log(pixels.length * YFilledRequired)
            if (count > pixels.length * YFilledRequired) {
                streak++;
            } else if (streak > 0) {
                //console.log("found column end");
                streaks.push([streak, x + 1, currentStreakBegin]);
                //console.log("got streak of " + streak + "");
                //console.log("streak x end: " + (x + 1));
                streak = 0;
            } else if (streak === 0) {
                // begin of streak
                currentStreakBegin = x + 1;
            }

            //colors.push([pixels[y][x].r, pixels[y][x].g, pixels[y][x].b]);
        }
        console.log("found x - streaks: ");
        console.log(streaks);

        let mostOften = countMostOftenOccurrences(firstItemsOfArr(streaks));
        console.log("picked the following as supposed streak-thickness for the letters with exact occurance - number: ");
        console.log(mostOften);
        let firstStreakSpacing;
        let lastStreakSpacing;
        let streakXEnds = getResultingStreakXEnds();
        rowsLength = streakXEnds.length;
        let resStart = streaks[0][2] - firstStreakSpacing;
        let resEnd = streaks[streaks.length - 1][1] + lastStreakSpacing;

        // if resStart || resEnd lies in image persist, else change
        if (resStart < 0 || !resStart) {
            resStart = 0;
        }
        if (resEnd > pixels[0].length - 1 || !resEnd) {
            resEnd = pixels[0].length - 1;
        }
        return { "ends": streakXEnds, "leftBegin": resStart, "rightEnd": resEnd };
        function getResultingStreakXEnds() {
            let res = [];
            let finalStreaks = [];
            for (let i = 0; i < streaks.length; i++) {
                if (Math.abs(streaks[i][0] - mostOften[0]) <= pixels[0].length * streakMaxDiff) {
                    finalStreaks.push(streaks[i]);
                }
            }
            console.log("found " + finalStreaks.length + " streaks after similarity streak check");
            for (let i = 0; i < finalStreaks.length; ++i) {
                if (i !== finalStreaks.length - 1) {
                    let spacing = (finalStreaks[i + 1][2] - finalStreaks[i][1]) / 2;
                    if (i === 0) {
                        firstStreakSpacing = spacing;
                    } else if (i === finalStreaks.length - 2) {
                        lastStreakSpacing = spacing;
                    }
                    res.push(finalStreaks[i][1] + spacing); // + (end to start) / 2
                } else {
                    res.push(finalStreaks[i][1]);
                }
            }
            return res;
        }



        function firstItemsOfArr(arr) {
            let res = [];
            for (let i = 0; i < arr.length; i++) {
                res.push(arr[i][0]);
            }
            return res;
        }
    }





    function getBackgroundColorFromTwoColors(pixels) {
        let colors = [];
        let rSum = 0;
        let gSum = 0;
        let bSum = 0;
        for (let y = 0; y < pixels.length; y++) {
            for (let x = 0; x < 3; x++) {
                rSum += pixels[y][x].r;
                gSum += pixels[y][x].g;
                bSum += pixels[y][x].b;
                colors.push([pixels[y][x].r, pixels[y][x].g, pixels[y][x].b]);
            }
        }
        rSum /= colors.length;
        gSum /= colors.length;
        bSum /= colors.length;

        function getMostFrequentColor(color1, color2, colors) { // ()
            const color1Count = colors.filter(c => getDistance(c, color1) < 50).length; // Anzahl der Farben im Array, die nahe an color1 liegen
            const color2Count = colors.filter(c => getDistance(c, color2) < 50).length; // Anzahl der Farben im Array, die nahe an color2 liegen

            if (color1Count > color2Count) {
                return color1;
            } else if (color2Count > color1Count) {
                return color2;
            } else {
                return null; // Es gibt keine eindeutige häufigste Farbe
            }
        }

        //return getMostFrequentColor(color1, color2, colors);
        return [rSum, gSum, bSum];
    }
    // Funktion, die die Distanz zwischen zwei Farben berechnet
    function getDistance(color1, color2) {
        const rDiff = color1[0] - color2[0];
        const gDiff = color1[1] - color2[1];
        const bDiff = color1[2] - color2[2];
        return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
    }
































    //createRidgedVersion("./puzzles/wordsearch6.PNG","./ridgedOutput.png");
    async function useFilter(path, outputPath, filter) {
        await new Promise((resolve, reject) => {
            sharp(path)
                .raw()
                .toBuffer((err, buffer, info) => {
                    if (err) throw err;
                    let pixels = getPixelArrayXY(buffer, info); // convert to XY - array [x][y]
                    if (filter === "ridge3x3") {
                        pixels = convolutionMatrix(info, [0, -1, 0, -1, 4, -1, 0, -1, 0], 100, 1, 1, false, false, pixels); // use convolution matrix on it (ridge detecten 3x3), color addent 100, ...
                    } else if (filter === "ridge3x3_5") {
                        pixels = convolutionMatrix(info, [0, -1, 0, -1, 5, -1, 0, -1, 0], 100, 1, 1, false, false, pixels); // use convolution matrix on it (ridge detecten 3x3), color addent 100, ...
                    }

                    // convert back using XY - array type
                    let imageData = XYToImageData(pixels, info);

                    // Speichern Sie das Image Data Objekt als Bild
                    sharp(imageData.data, {
                        raw: {
                            width: imageData.width,
                            height: imageData.height,
                            channels: info.channels // RGBA-Farbraum
                        }
                    }).toFile(outputPath, (err, info) => {
                        if (err) {
                            console.log(err);
                            resolve(err);
                        } else {
                            console.log("created image with ridge detected (3x3)");
                            resolve();
                        }
                    });
                });
        });
    }

    function getPixelArrayXY(buffer, info) {
        let width = info.width;
        let height = info.height;
        let channels = info.channels;

        const pixelArr = [];
        for (let x = 0; x < width; x++) {
            const column = [];
            for (let y = 0; y < height; y++) {
                const offset = (y * width + x) * channels;
                const pixel = {
                    r: buffer[offset],
                    g: buffer[offset + 1],
                    b: buffer[offset + 2],
                    a: buffer[offset + 3]
                };
                column.push(pixel);
            }
            pixelArr.push(column);
        }
        return pixelArr;
    } // in the right order ... [x][y]  ... --> needs to be reverted righty back!
    function XYToImageData(pixels, info) {
        let width = pixels.length;
        let height = pixels[0].length;
        const imageData = {
            data: new Uint8ClampedArray(width * height * info.channels),
            width: width,
            height: height
        };

        for (let i = 0; i < width; i++) {
            for (let j = 0; j < height; j++) {
                const pixel = pixels[i][j];
                const offset = (j * info.width + i) * info.channels
                imageData.data[offset] = pixel.r;
                imageData.data[offset + 1] = pixel.g;
                imageData.data[offset + 2] = pixel.b;
                imageData.data[offset + 3] = 255;
            }
        }
        return imageData;
    }

    function convolutionMatrix(originalPicture, pattern, colorAddend, matrixDivisor, times, median, pixelating, pixelArray) {

        let patternSqrt_y0_p = 0;
        for (let t = 0; t < times; t++) {
            if (Math.sqrt(pattern.length) % 1 !== 0 || (Math.sqrt(pattern.length)) % 2 !== 1) {
                System.out.println("Error: square of 'length of 'pattern'' is a decimal OR square of 'length of 'pattern'' is even");
                return null;
            }
            let patternSqrt = parseInt(Math.sqrt(pattern.length));
            let offset;
            if (pixelating) {
                offset = patternSqrt; //((patternSqrt-1)/2) + 1 +((patternSqrt-1)/2) + 1;
            } else {
                offset = 1;
            }

            let width = originalPicture.width;
            let height = originalPicture.height;
            pixel = pixelArray;
            pixelNew = twoDimensionalArr(width, height);
            let patternSqrt_xy0 = (patternSqrt - (patternSqrt - 1) / 2) - 1; // allererster Pixel x, y der für die Matrix-Filter-Größe in Betracht kommt
            let patternSqrt_x0_p = 0; // Deklarierung und erste Initialisierung des Start-x-Pixels für jeden Filterblock eines Pixels (in dem Fall natürlich für den ersten betrachteten Pixel)
            for (let x = patternSqrt_xy0; x + (patternSqrt - 1) / 2 < width; x += offset) { // Prozedere für jeden Pixel für den der Filter anwenndbar ist
                patternSqrt_y0_p = 0;
                for (let y = patternSqrt_xy0; y + (patternSqrt - 1) / 2 < height; y += offset) {
                    let sumR = 0;
                    let sumG = 0;
                    let sumB = 0;
                    let counter = 0;
                    if (median) {
                        let pixelFilterR = new Array(pattern.length);
                        let pixelFilterG = new Array(pattern.length);
                        let pixelFilterB = new Array(pattern.length);
                        for (let x1 = 0; x1 < patternSqrt; x1++) { // einzelne Pixel innerhalb der Reichweite des Filters anschauen, um damit den Farbwert des neuen zu bestimmen
                            for (let y1 = 0; y1 < patternSqrt; y1++) {
                                pixelFilterR[counter] = pixel[patternSqrt_x0_p + x1][patternSqrt_y0_p + y1].r * pattern[counter]; // normalerweise immer 1
                                pixelFilterG[counter] = pixel[patternSqrt_x0_p + x1][patternSqrt_y0_p + y1].g * pattern[counter];
                                pixelFilterB[counter] = pixel[patternSqrt_x0_p + x1][patternSqrt_y0_p + y1].b * pattern[counter];
                                counter += 1;
                            }
                        }
                        pixelFilterR.sort();
                        pixelFilterG.sort();
                        pixelFilterB.sort();
                        sumR = parseInt(pixelFilterR[(pattern.length - 1) / 2 + 1]);
                        sumG = parseInt(pixelFilterG[(pattern.length - 1) / 2 + 1]);
                        sumB = parseInt(pixelFilterB[(pattern.length - 1) / 2 + 1]);
                    } else {
                        for (let x1 = 0; x1 < patternSqrt; x1++) { // einzelne Pixel innerhalb der Reichweite des Filters anschauen, um damit den Farbwert des neuen zu bestimmen
                            for (let y1 = 0; y1 < patternSqrt; y1++) {
                                sumR += pixel[patternSqrt_x0_p + x1][patternSqrt_y0_p + y1].r * pattern[counter];
                                sumG += pixel[patternSqrt_x0_p + x1][patternSqrt_y0_p + y1].g * pattern[counter];
                                sumB += pixel[patternSqrt_x0_p + x1][patternSqrt_y0_p + y1].b * pattern[counter];
                                //console.log("worked");
                                counter += 1;
                            }
                        }

                        sumR = parseInt((sumR / (matrixDivisor) + colorAddend));
                        sumG = parseInt((sumG / (matrixDivisor) + colorAddend));
                        sumB = parseInt((sumB / (matrixDivisor) + colorAddend));
                        if (sumR < 0) {
                            sumR = 0;
                        } else if (sumR > 255) {
                            sumR = 255;
                        }
                        if (sumG < 0) {
                            sumG = 0;
                        } else if (sumG > 255) {
                            sumG = 255;
                        }
                        if (sumB < 0) {
                            sumB = 0;
                        } else if (sumB > 255) {
                            sumB = 255;
                        }
                    }
                    pixelNew[x][y] = { "r": sumR, "g": sumG, "b": sumB };

                    if (pixelating) {
                        for (let x1 = 0; x1 < patternSqrt; x1++) { // jeden Pixel im Filter auf den Ergebniswert setzen, wenn pixelating == true
                            for (let y1 = 0; y1 < patternSqrt; y1++) {
                                pixelNew[patternSqrt_x0_p + x1][patternSqrt_y0_p + y1] = {
                                    "r": sumR,
                                    "g": sumG,
                                    "b": sumB
                                };
                            }
                        }
                    }
                    patternSqrt_y0_p += offset; // ""
                }
                patternSqrt_x0_p += offset; // "Start-x-Pixel für jeden "Filterblock" um 1 weiterschieben; keine ganz neue Berechnung nötig

            }

            if (!pixelating) {
                for (let m = 0; m < 2; m++) { // alle Ränder bestimmen mit nahem bestimmtem Farbwert
                    let fTP = patternSqrt_xy0; // "firstTopPixel_YPOS" --> bezieht sich auf die bereits gesetzte Pixel nach der Filteranwendung
                    let fBP = height - 1 - patternSqrt_xy0;
                    let fLP = patternSqrt_xy0; //"firstLeftPixel_XPOS"
                    let fRP = width - 1 - patternSqrt_xy0;
                    for (let n = 0; n < 2; n++) { // System von 1 und 0 benutzt, ähnlich zu if Abfragen: wenn m = 0 --> 0+x<- ; m = 1 --> 1*(y-x)+x --> y<-
                        for (let x = 0; x < m * (width - fLP) + fLP; x++) {
                            for (let y = 0; y < m * (fTP - height) + height; y++) {
                                if (y < fTP && m === 0) { // Unterscheidungen: pixel über bzw. unter dem höchsten bestimmten filterbasierten Pixel müssen durch den naheliegensten bestimmten Pixel bestimmt werden
                                    pixelNew[n * (fRP + 1) + x][y] = { "r": pixelNew[n * (fRP - fLP) + fLP][fTP].r, "g": pixelNew[n * (fRP - fLP) + fLP][fTP].g, "b": pixelNew[n * (fRP - fLP) + fLP][fTP].b };
                                } else if (m * (x - y) + y <= m * (fRP - fBP) + fBP) {
                                    if (m === 0) {
                                        pixelNew[n * (fRP + 1) + x][y] = { "r": pixelNew[n * (fRP - fLP) + fLP][y].r, "g": pixelNew[n * (fRP - fLP) + fLP][y].g, "b": pixelNew[n * (fRP - fLP) + fLP][y].b };
                                    } else {
                                        pixelNew[x][n * (fBP + 1) + y] = { "r": pixelNew[x][n * (fBP - fTP) + fTP].r, "g": pixelNew[x][n * (fBP - fTP) + fTP].g, "b": pixelNew[x][n * (fBP - fTP) + fTP].b };
                                    }
                                } else if (m === 0) {
                                    pixelNew[n * (fRP + 1) + x][y] = { "r": pixelNew[n * (fRP - fLP) + fLP][fBP].r, "g": pixelNew[n * (fRP - fLP) + fLP][fBP].g, "b": pixelNew[n * (fRP - fLP) + fLP][fBP].b };
                                }
                            }
                        }
                    }
                }
            } else { // Pixelblöcke am Rand erzeugen
                let fBP = patternSqrt_y0_p;
                //System.out.println("fBP = "+fBP);
                let fRP = patternSqrt_x0_p;
                let counter = 0;
                for (let n = 0; n < 2; ++n) {
                    if (fBP + n * (-fBP + fRP) !== height + n * (-height + width)) {
                        for (let x = 0; x < width / offset + n * ((-width / offset) + height / offset); ++x) { // x nicht immer für x bedeutend --> 0, 1 System für beide Ränder angewandt -- wahrscheinlich unübersichtlicher und ineffizienter als 2-Versionen davon zu schreiben, jedoch kürzer im Code
                            let sumR = 0;
                            let sumG = 0;
                            let sumB = 0;
                            for (let x1 = x * offset + n * ((-(x * offset)) + fRP); x1 < x * offset + offset + n * ((-(x * offset + offset)) + width); ++x1) {
                                for (let y1 = fBP + n * ((-fBP) + x * offset); y1 < height + n * ((-height) + x * offset + offset); ++y1) {
                                    sumR += pixel[x1][y1].r;
                                    sumG += pixel[x1][y1].g;
                                    sumB += pixel[x1][y1].b;
                                    counter += 1;
                                }
                            }
                            sumR /= counter;
                            sumG /= counter;
                            sumB /= counter;
                            counter = 0;
                            /*
                            for (int x1 = x*offset; x1 < x*offset+offset; ++x1) {
                            for (int y1 = fBP; y1 < height; ++y1) {
                            pixelNew[x1][y1] = new Color(sumR,sumG,sumB);
                            }
                            }*/
                            for (let x1 = x * offset + n * ((-(x * offset)) + fRP); x1 < x * offset + offset + n * ((-(x * offset + offset)) + width); ++x1) {
                                for (let y1 = fBP + n * ((-fBP) + x * offset); y1 < height + n * ((-height) + x * offset + offset); ++y1) {
                                    pixelNew[x1][y1] = { "r": sumR, "g": sumG, "b": sumB };
                                }
                            }
                        }
                    }
                }
            }

            /*for (int x = 0; x < width; x++) { // Überprüfungsmethode ob wirklich die ganze Liste von pixelNew gefüllt ist
            for (int y = 0; y < height; y++) {
            if (pixelNew[x][y]== null) {
            System.out.println("null found at x= "+x+"; y= "+y);
            }
            }
            }*/

            // OTHER CONCEPT IN JS
            //newPicture.setPixelArray(pixelNew);
            //originalPicture = newPicture;
            // TO
            pixelArray = pixelNew; // setting pixel array instead of picture class --> not used in js, just handling imag data via info, which is consistent and pixelarray, which gets changed
        }
        //return (einPixel.graustufenNatuerlich(einPixel.invertieren(newPicture))); // wenn man wollte könnte man zusätlich das entstandene Bild invertieren etc. über klassenübergreifende Methoden
        // OTHER CONCEPT IN JS
        //return (newPicture);
        return (pixelNew); // returning pixelArray instead of Picture class object



        function twoDimensionalArr(width, height) {
            let pixels = [];
            for (let i = 0; i < width; i++) {
                const column = [];
                for (let j = 0; j < height; j++) {
                    const r = 0;
                    const g = 0;
                    const b = 0;
                    column.push({
                        r,
                        g,
                        b
                    });
                }
                pixels.push(column);
            }
            return pixels;
        }
    } // old function migrated from java to js, had problems using sharps .convolve
} // min max inclusive // filter param pretty irrelevant --> probably also just an alpha channel thingy for using convolve --> might fix

async function getLettersFromImages(dir, test) {
    function sortFilenames(filename) {
        // Split the filename into its numeric and alphabetic components
        const parts = [];
        let currentPart = "";
        for (let i = 0; i < filename.length; i++) {
            const c = filename.charAt(i);
            if (c >= '0' && c <= '9') {
                currentPart += c;
            } else {
                if (currentPart) {
                    parts.push(parseInt(currentPart));
                    currentPart = "";
                }
                parts.push(c);
            }
        }
        if (currentPart) {
            parts.push(parseInt(currentPart));
        }

        // Sort based on the components
        return parts;
    }

    let files = fs.readdirSync(dir);
    files = files.sort((a, b) => {
        const partsA = sortFilenames(a);
        const partsB = sortFilenames(b);
        for (let i = 0; i < Math.min(partsA.length, partsB.length); i++) {
            const result = partsA[i] - partsB[i];
            if (result !== 0) {
                return result;
            }
        }
        return partsA.length - partsB.length;
    });

    let resTesseract = [];
    let resOcrad = [];
    console.group("ocr - processing");
    //console.log(files);


    const worker = await createWorker();
    //await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    await worker.setParameters({
        tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
        //psm: '10', // page segmentation mode: single character
        psm: 10,
        oem: 2,
        //ocr_engine_mode: 1, // enable neural network mode
    });

    for (let i = 0; i < files.length; ++i) {
        await new Promise(resolve => {

            (async () => {
                var Image = Canvas.Image;


                fs.readFile(path.join(dir, files[i]), function (err, src) {
                    if (err) {
                        throw err;
                    }
                    var img = new Image();
                    img.src = src;
                    var canvas = new Canvas.createCanvas(img.width, img.height);
                    var ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, img.width, img.height);
                    let text = OCRAD(canvas, {
                        numeric: false,  // keine Zahlen
                        punctuation: false,  // keine Satzzeichen
                        whitespace: false,  // keine Leerzeichen
                        uncertain: false,  // keine unsicheren Zeichen
                    }).charAt(0);

                    resOcrad.push(text);

                    // now tessaract
                    worker.recognize(path.join(dir, files[i])).then(({ data: { text } }) => {
                        resTesseract.push(text.charAt(0));
                        if (i % 10 === 0) {
                            console.log("completed " + i);
                        }
                        resolve();
                    });
                });
            })();
            /*Tesseract.recognize(
                path.join(dir,files[i]),
                'eng'//,
                //{ logger: m => //console.log(m) }
            ).then(({ data: { text } }) => {
                console.log("finished " + i);
                res.push(text)
                resolve();
            })*/
        });
    }
    console.log("all characters analysed by tesseract.js and ocrad.js");
    let res = sortOutArrays(resTesseract, resOcrad);
    console.log("compared two ocr - engines results");
    console.log(res);
    // compare
    if (test) {
        let str = test;
        // Ersetze alle Kommas in der Zeichenfolge durch Leerzeichen und wandele sie in ein Array um
        const letters = str.replace(/,/g, '').split('');

        compareArrs(letters, res);
    }

    return res;










    function sortOutArrays(arr1, arr2) { // tesseract , ocrad
        let res = [];
        for (let i = 0; i < arr1.length; i++) {
            let i1 = arr1[i].toLowerCase();
            let i2 = arr2[i].toLowerCase();
            if (i1 !== i2) {
                if (i1 !== "" && (i1 === "q" || i1 === "m" || !/^[a-zA-Z]+$/.test(i2) || i2 === "x" || i2 === "a" || i2 === "g" || i2 === "n" || i2 === "b" || i2 === "w" /*|| i2 === "i"*/)) { // w ()
                    res.push(arr1[i]);
                } else {
                    if (arr2[i] === "5") arr2[i] = "s";
                    if (arr2[i] === "1") arr2[i] = "i";
                    if (arr2[i] === "0") arr2[i] = "o";
                    if (arr2[i] === "8") arr2[i] = "b";
                    if (arr2[i] === "6") arr2[i] = "g";
                    if (arr2[i] === "9") arr2[i] = "q";
                    if (arr2[i] === "2") arr2[i] = "z";
                    if (arr2[i] === "3") arr2[i] = "e";
                    if (arr2[i] === "4") arr2[i] = "a";
                    if (arr2[i] === "7") arr2[i] = "t";
                    if (arr2[i] === "|") arr2[i] = "i";
                    res.push(arr2[i]);
                }
            } else {
                res.push(arr1[i]);
            }
        }
        return res;
    }
    function compareArrs(arr1, arr2) {
        if (arr1.length === arr2.length) {

            // Zwei Arrays zum Vergleich


            // Vergleiche die Arrays und finde die unähnlichen Elemente
            const differences = [];

            for (let i = 0; i < arr1.length; i++) {
                //console.log(arr1[i], arr2[i]);//, arr1[i].toLowerCase() !== arr2[i].toLowerCase(),i);
                if (arr1[i].toLowerCase() !== arr2[i].toLowerCase()) {

                    //if (arr1[i] !== "Q") { // without Q
                    differences.push({ index: i, value1: arr1[i], value2: arr2[i] });
                    // }
                }
            }

            // Gib die unähnlichen Elemente aus
            if (differences.length === 0) {
                console.log("Die Arrays sind identisch.");
            } else {
                console.log("length of differences: " + differences.length);
                console.log("Die Arrays sind unterschiedlich an den folgenden Indizes");
                console.log(differences);
            }
        } else {
            console.log("not the same arr length");
        }

    }
} // letters should be black ! --> e.g invert ... using seperateLettersFromGrid() automates inverting and image preprocessing