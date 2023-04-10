const fetch = require('node-fetch');
const express = require('express');
const app = express();
const fs = require('fs');




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




myAsyncLoad();
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

        let engTest = "ill";
        let deTest = "apfel";
        console.log("is word " + engTest + " english?: " + isEnglish(engTest));
        console.log("is word " + deTest + " german?: " + isGerman(deTest));

        // NOW TO GRID TESTING

        let grid =
        [  
        ['a', 'f', 'i', 'd', 'e'],
        ['r', 'l', 'l', 'i', 'j'],
        ['l', 'a', 'l', 's', 'o'],
        ['p', 'q', 'c', 's', 'h'],
        ['u', 'v', 'w', 'x', 'y']
      ];
        //let grid = inputToGrid("hGyRCPyxlFLPdsRkgTYZ,AYoSXsVOdehUMQCPsFPx,JulThCrFnUNkfblOagbW,bmwKqLaZVcovTswIZKJw,qKGvbyjpyjvNSdWiUgIO,wVDyTANsJaewvTGPAJUa,svXIxGHUeHdmpPQfbGrA,IFlbtTSpNDgnZZvuEQIv,ntsGWNauWUmUomROMPUx,ZYnYahZeHqTsdMuAnQec,CXgcKMGUbayrwkeSigmV,NMdZqqgxCxtDcHolmUdB,QiElqqRGpoeLAlvUdViY,bKVZPcYrSjiVQxidtdbr,pitYQnuPKdpHSxrgDQiu,TAVtaGnEHfAUIoaITQJR");



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
        // sort found words by commonality
        let sort = sortArrByCommonality(foundWords);
        console.log("final array sort by commonality with the help of a shorter dictionary (some common words can still be missed): ");
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
            for (let i = 0; i < arrPaths.length; ++i) {
                const data = fs.readFileSync(arrPaths[i], 'utf-8');
                const json = JSON.parse(data);
                let keys = Object.keys(json);
                keys = keys.map((str) => str.toLowerCase());
                if (keys.includes(word.toLowerCase())) {
                    return true;
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



















/*const Tesseract = require('tesseract.js'); // Tesseract requires internet connection

Tesseract.recognize(
    './wordsearch.png',
    'eng',
    { logger: m => console.log(m) }
  ).then(({ data: { text } }) => {
    console.log(text);
  })*/
