const fetch = require('node-fetch');
const express = require('express');
const app = express();
const fs = require('fs');
const path = require("path");




let baseUrl = "http://localhost:3000";
// statische Dateien bereitstellen
app.use(express.static('public'));

// HTTP-Handler für die Startseite
app.get('/', (req, res) => {
    res.send('Willkommen auf der Startseite!');
});

// HTTP-Handler für einen API-Endpunkt
app.get('/api/example', (req, res) => {
    const data = { message: 'Dies ist eine Beispielantwort.' };
    res.json(data);
});

// Server starten
app.listen(3000, () => {
    console.log('Server gestartet auf http://localhost:3000');
});




//myAsyncLoad();
async function myAsyncLoad() {

    let germanWords = [];
    let englishWords = [];

    function loadGerman() {
        if (germanWords.length > 0) {
            // Wenn die deutsche Wortliste bereits im Cache ist, gib sie direkt zurück
            return Promise.resolve(germanWords);
        } else {
            // Andernfalls lade die Textdatei und speichere sie im Cache
            //const url = "https://raw.githubusercontent.com/enz/german-wordlist/master/words";
            const url = baseUrl + "/wordlists/german/german.txt";
            return fetch(url)
                .then(response => response.text())
                .then(text => {
                    germanWords = text.split(/\r?\n/);
                    return germanWords.map((str) => str.toLowerCase());
                });
        }
    }

    function loadEnglish() {
        if (englishWords.length > 0) {
            // Wenn die englische Wortliste bereits im Cache ist, gib sie direkt zurück
            return Promise.resolve(englishWords);
        } else {
            // Andernfalls lade die JSON-Datei und speichere sie im Cache
            //const url = "https://raw.githubusercontent.com/dwyl/english-words/master/words_dictionary.json";
            const url = baseUrl + "/wordlists/english/english.json";
            return fetch(url)
                .then(response => response.json())
                .then(json => {
                    englishWords = Object.keys(json);
                    return englishWords.map((str) => str.toLowerCase());
                });
        }
    }

    // Beispielverwendung
    Promise.all([loadGerman(), loadEnglish()]).then(results => {
        const germanWords = results[0];
        const englishWords = results[1];

        console.group("start - information");
        console.log(`number of german words in wordlist: ${germanWords.length}`);
        console.log(`number of englisch words in wordlist: ${englishWords.length}`);

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
        let grid = inputToGrid("hGyRCPyxlFLPdsRkgTYZ,AYoSXsVOdehUMQCPsFPx,JulThCrFnUNkfblOagbW,bmwKqLaZVcovTswIZKJw,qKGvbyjpyjvNSdWiUgIO,wVDyTANsJaewvTGPAJUa,svXIxGHUeHdmpPQfbGrA,IFlbtTSpNDgnZZvuEQIv,ntsGWNauWUmUomROMPUx,ZYnYahZeHqTsdMuAnQec,CXgcKMGUbayrwkeSigmV,NMdZqqgxCxtDcHolmUdB,QiElqqRGpoeLAlvUdViY,bKVZPcYrSjiVQxidtdbr,pitYQnuPKdpHSxrgDQiu,TAVtaGnEHfAUIoaITQJR");



        let allPossibilities = getAllPossibilities(grid);


        console.log("all possibilities: " + allPossibilities.length + " items");
        console.groupEnd();
        console.group("finding words");
        let foundWords = [];
        //console.log(allPossibilities);
        for (let i = 0; i < allPossibilities.length; ++i) {
            let item = allPossibilities[i];
            let english = isEnglish(item);
            let german = isGerman(item);
            if ((english || german) && item.length > 2) {
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
        console.log(sort);
        console.groupEnd();













































        function isGerman(word) {
            return germanWords.includes(word.toLowerCase());
        }

        function isEnglish(word) {
            return englishWords.includes(word.toLowerCase());
        }
    });













































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
        const filePaths = ['./public/dictionaries/EnglishToGerman.json', './public/dictionaries/GermanToEnglish.json'];
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

    function getAllPossibilities(grid) {
        function reverseEachListItem(arr) {
            let res = [];
            for (let i = 0; i < arr.length; ++i) {
                res.push(reverseString(arr[i]));
            }
            return res;
        }

        function forwardWords() {
            let words = [];

            // horizontale Wörter
            for (let i = 0; i < grid.length; i++) {
                let word = '';
                for (let j = 0; j < grid[i].length; j++) {
                    // jedes mögliche Wort am aktuellen Ort ermitteln
                    for (let k = j; k < grid[i].length; k++) {
                        word += grid[i][k];
                        words.push(word);
                    }
                    word = '';
                }
            }

            // vertikale Wörter
            for (let i = 0; i < grid[0].length; i++) {
                let word = '';
                for (let j = 0; j < grid.length; j++) {
                    // jedes mögliche Wort am aktuellen Ort ermitteln
                    for (let k = j; k < grid.length; k++) {
                        word += grid[k][i];
                        words.push(word);
                    }
                    word = '';
                }
            }


            // diagonale Wörter von links oben nach rechts unten
            for (let i = 0; i < grid.length; i++) {
                for (let j = 0; j < grid[i].length; j++) {
                    for (let k = 0; i + k < grid.length && j + k < grid[i].length; k++) {
                        let word = '';
                        for (let l = 0; l <= k; l++) {
                            word += grid[i + l][j + l];
                        }
                        words.push(word);
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
                        }
                        words.push(word);
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



}





















const sharp = require('sharp');







test();
async function test() {
    await seperateLettersFromGrid("./puzzles/background4.png", "./letterSeperator", 1 / 10, 1 / 10, 50, 4, "ridge3x3"); // second (number param) 1/6 before
}

async function seperateLettersFromGrid(grid, outputDir, XFilledRequired, YFilledRequired, minBackgroundDiff, streakMaxDiff, filter) {
    let backgroundColor;
    let imgPath = grid;

    // create output dir and needed folders
    createFoldersIfNeeded(outputDir + "/tempVerticals"); // works because recursive
    createFoldersIfNeeded(outputDir + "/tempFinals");
    function createFoldersIfNeeded(dir) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    console.group("image analysing");
    if (filter === "ridge3x3") {
        console.log("using ridge detection filter");
        await useFilter(imgPath, outputDir + "/filteredImage.png", filter); // png
        console.log("filtering done, starting splitting");
        imgPath = outputDir + "/filteredImage.png";
    }

    await new Promise((resolve, reject) => {
        sharp(imgPath)
            .modulate({ brightness: 1.2, saturation: 1.2, hue: 0 })
            .grayscale()
            .raw()
            .toBuffer((err, buffer, info) => {
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


                console.log(info);
                // using pixel arroy now

                // SET UP BASICS
                backgroundColor = getBackgroundColorFromTwoColors(pixels);
                console.log("recognized background color (rgb): " + backgroundColor);

                // GET X CROPS AND SAFE
                let xCrops = getXCrops(backgroundColor, pixels);
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
                        let yCrops = getYCrops(backgroundColor, pixels);
                        await finishWithXCrops(verticalPaths, yCrops);
                    }
                }
            });
    });
    return;






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

            const peaks = keys.filter((key, index) => {
                if (keys.length === 2) {
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
                if (Math.abs(streaks[i][0] - mostOften[0]) <= streakMaxDiff) {
                    finalStreaks.push(streaks[i]);
                }
            }
            console.log("found "+finalStreaks.length+" streaks after similarity streak check");
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
            //console.log("count: " + count + " / " + pixels.length)
            if (count > pixels.length * YFilledRequired) {
                //console.log("found pillar");
                streak++;
            } else if (streak > 0) {
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
                if (Math.abs(streaks[i][0] - mostOften[0]) <= streakMaxDiff) {
                    finalStreaks.push(streaks[i]);
                }
            }
            console.log("found "+finalStreaks.length+" streaks after similarity streak check");
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
                        pixels = convolutionMatrix(info, [0, -1, 0, -1, 4, -1, 0, -1, 0], 100, 1, 1, false, false, pixels) // use convolution matrix on it (ridge detecten 3x3), color addent 100, ...
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
} // min max inclusive



































/*
const Tesseract = require('tesseract.js'); // Tesseract requires internet connection

Tesseract.recognize(
    './96.png',
    'eng',
    { logger: m => console.log(m) }
  ).then(({ data: { text } }) => {
    console.log(text);
  }) // Q - Recognizing still a bit bad (!)
*/