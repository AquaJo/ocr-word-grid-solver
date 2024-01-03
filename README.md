# What is this?
This tool is designed for analyzing grid-search puzzles, even when the words within are unkown.  
It thoroughly assesses diagonals, rows, and cells in both directions.  
The process combines the capabilities of tesseract.js and ocrad.js to weigh results, ultimately yielding the most accurate outcomes.
# Demo & Tutorial
https://github.com/AquaJo/ocr-word-grid-solver/assets/84229101/1a2abc25-f55b-4d5f-b846-fd58e71c10a3

## In text form
After `npm install`, do `npm start` and follow the instructions:

`Do you want to use ocr? (y/n) (n --> no image, type grid / no option for visualization):` `y`  

`Name the relative path (e.g relative to index.js) to the grid puzzle image:` `./puzzles/demo.jpg`  
(some background noise shouldn't bother)  
<img src="https://github.com/AquaJo/ocr-word-grid-solver/assets/84229101/72c55480-f7a1-4a8d-92b2-83d8743afc27" alt="Image Alt Text" width="200" />

`Do you want to mark specific words in the grid now? (y/n):` `n`

`Do you want to search for words from the dictionaries in the grid now? (y/n):` `y`
```
['BuTTERFLY', 'RAiNBow', 'FLowERS', 'BLoSSoM', 'BuTTER', 'FLowER', 'LowER', 'SUNNY', 'RAiN', ...]
```

`Do you want to mark words in the grid now? (y/n):` `y`  
`Name the words you want to mark in the grid seperated by a comma (,):` `butterfly, rainbow`  
<img src="https://github.com/AquaJo/ocr-word-grid-solver/assets/84229101/42155551-cbce-413b-b7cd-31369384d722" alt="Image Alt Text" width="250" />
