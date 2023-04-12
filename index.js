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

seperateLettersFromGrid("./puzzles/wordsearch.PNG", 1 / 10, 1 / 10, 50, 4); // second 1/6 eig
function seperateLettersFromGrid(grid, XFilledRequired, YFilledRequired, minBackgroundDiff, streakMaxDiff) {

    let backgroundColor;
    let imgPath = grid;
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


            console.group("image analysing");
            console.log(info);
            // using pixel arroy now

            // SET UP BASICS
            backgroundColor = getBackgroundColorFromTwoColors(pixels);
            console.log("recognized background color (rgb): " + backgroundColor);

            // GET X CROPS AND SAFE
            let xCrops = getXCrops(backgroundColor, pixels);
            // deleting temp folder before
            let directory = "./tempVerticals/";
            fs.readdir(directory, (err, files) => {
                if (err) throw err;

                for (const file of files) {
                    fs.unlink(path.join(directory, file), (err) => {
                        if (err) throw err;
                    })
                }

                directory = "./tempFinals/";
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
            if (xCrops.length === 0) {
                console.log("seems like there were no sections found");
                console.groupEnd();
            }
            function deletedTempDirectory() {
                let verticalPaths = [];
                for (let i = 0; i < xCrops.length; ++i) {
                    sharp(imgPath)
                        .extract({ left: i !== 0 ? Math.ceil(xCrops[i - 1]) : 0, top: 0, width: i !== 0 ? Math.ceil(xCrops[i] - xCrops[i - 1]) : Math.ceil(xCrops[0]), height: info.height })
                        .toFile('./tempVerticals/' + i + '.png', (err, info) => {
                            verticalPaths.push('./tempVerticals/' + i + '.png');
                            if (err) {
                                console.log(err);
                            } else {
                                console.log("added " + i + '.png as vertical image part');
                                if (i === xCrops.length - 1) {
                                    console.log("finished vertical cropping, now cropping all letters off of already cropped vertical parts");
                                    console.groupEnd();
                                    // LAST --> FINISH in other function
                                    finish();
                                }
                                //console.log(info);
                            }
                        });
                }

                function finish() {
                    // GET Y CROPS AND SAFE
                    let yCrops = getYCrops(backgroundColor, pixels);
                    finishWithXCrops(verticalPaths, yCrops);
                }
            }
        });

    function finishWithXCrops(paths, yCrops) {
        let allPathsLength = paths.length;
        for (let i = 0; i < paths.length; ++i) {
            let myPath = paths[i];
            sharp(myPath)
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

                    //  console.log("cropping now vertical section of: " + myPath);

                    // using pixel arroy now
                    let splitPath = myPath.split("/");
                    let myPartNum = Number(splitPath[splitPath.length - 1].split(".")[0]);

                    for (let i = 0; i < yCrops.length; ++i) {
                        let toFile = './tempFinals/' + ((i) * allPathsLength + (myPartNum + 1)) + '.png'; // calculate number in query ...
                        sharp(myPath)
                            .extract({ left: 0, top: i !== 0 ? Math.ceil(yCrops[i - 1]) : 0, width: info.width, height: i !== 0 ? Math.ceil(yCrops[i] - yCrops[i - 1]) : Math.ceil(yCrops[0]) })
                            .toFile(toFile, (err, info) => {
                                if (err) {
                                    console.log(err);
                                } else {
                                    //  console.log("added as final image part: " + toFile);
                                }
                            });
                    }
                });
        }
    }









    function countMostOftenOccurrences(arr) {
        var counts = {};
        var result = [];

        for (var i = 0; i < arr.length; i++) {
            var num = arr[i];
            counts[num] = counts[num] ? counts[num] + 1 : 1;
        }

        let biggestCount = 0;
        let resNum = 0;
        for (var num in counts) {
            if (counts[num] > biggestCount) {
                biggestCount = counts[num];
                resNum = num;
            }
            result.push([Number(num), counts[num]]);
        }

        return [Number(resNum), biggestCount];
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
        let mostOften = countMostOftenOccurrences(firstItemsOfArr(streaks));
        let streakYEnds = getResultingStreakYEnds();
        return streakYEnds;
        function getResultingStreakYEnds() {
            let res = [];
            let finalStreaks = [];
            for (let i = 0; i < streaks.length; i++) {
                if (Math.abs(streaks[i][0] - mostOften[0]) <= streakMaxDiff) {
                    finalStreaks.push(streaks[i]);
                }
            }
            for (let i = 0; i < finalStreaks.length; ++i) {
                if (i !== finalStreaks.length - 1) {
                    res.push(finalStreaks[i][1] + (finalStreaks[i + 1][2] - finalStreaks[i][1]) / 2); // + (end to start) / 2
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

        console.log(streaks)


        let mostOften = countMostOftenOccurrences(firstItemsOfArr(streaks));
        console.log(mostOften);
        let streakXEnds = getResultingStreakXEnds();
        return streakXEnds;
        function getResultingStreakXEnds() {
            let res = [];
            let finalStreaks = [];
            for (let i = 0; i < streaks.length; i++) {
                if (Math.abs(streaks[i][0] - mostOften[0]) <= streakMaxDiff) {
                    finalStreaks.push(streaks[i]);
                }
            }
            for (let i = 0; i < finalStreaks.length; ++i) {
                if (i !== finalStreaks.length - 1) {
                    res.push(finalStreaks[i][1] + (finalStreaks[i + 1][2] - finalStreaks[i][1]) / 2); // + (end to start) / 2
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
} // min max inclusive



































/*
const Tesseract = require('tesseract.js'); // Tesseract requires internet connection

Tesseract.recognize(
    './320.png',
    'eng',
    { logger: m => console.log(m) }
  ).then(({ data: { text } }) => {
    console.log(text);
  }) // Q - Recognizing still a bit bad (!)
*/