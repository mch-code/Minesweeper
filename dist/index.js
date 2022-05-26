// // Import the functions you need from the SDKs you need
// import firebase from 'firebase/compat/app'; 
// import 'firebase/compat/firestore';
// import 'firebase/compat/auth';
// import { getDatabase, ref, push, set } from "firebase/database";
// const firebaseConfig = {
//     apiKey: "AIzaSyDYkBTZX89plUWijXyxycsr6fnz2i9zVoU",
//     authDomain: "minesweeper-ec7bd.firebaseapp.com",
//     projectId: "minesweeper-ec7bd",
//     storageBucket: "minesweeper-ec7bd.appspot.com",
//     messagingSenderId: "791691570583",
//     appId: "1:791691570583:web:1afdc1a4116b24aa8128d2",
//     measurementId: "G-XYRKSPC28H"
//   };
// // Initialize Firebase
// const app = firebase.initializeApp(firebaseConfig);
// // Declare database
// const db = getDatabase(app);
// const scoreRef = ref(db, 'Scores');
// const newPostRef = push(scoreRef);
// set(scoreRef, {
//     'Score': 10
// })
window.refreshPage = refreshPage;
window.onPlayerDifSelect = onPlayerDifSelect;
// - - - GAME SETUP - - - //
// Difficulty level in dropdown [Easy, Medium, Hard, Extreme]
let difficultyNum = userDifSelection();
function onPlayerDifSelect() {
    localStorage.setItem('difficultyKey', document.getElementById('difficulty-select').value);
    refreshPage();
}
// Define function to set and retain difficulty
function userDifSelection() {
    const localStorageValue = JSON.parse(localStorage.getItem('difficultyKey') || '{}');
    if (localStorage.getItem('difficultyKey') !== null) {
        document.getElementById('difficulty-select').value = String(localStorageValue);
        return localStorageValue;
    }
    else {
        let dif = document.getElementById('difficulty-select').value;
        localStorage.setItem('difficultyKey', dif);
        return parseInt(dif);
    }
}
// Define function to restart game via "Restart" top menu button
function refreshPage() {
    window.location.reload();
}
function difficultySetting(difficultyNum) {
    // Game size [Easy, Medium, Hard, Extreme]
    const gameSize = [9, 13, 17, 21, 35];
    // Ratio of gameSize x bombs [Easy, Medium, Hard, Extreme, Legendary]
    const difRatio = [1.1, 2.7, 3.8, 4.75, 6.43];
    // Starting grid size
    const startSize = [1, 1, 3, 3, 3];
    // Number of lives
    const numLives = [3, 3, 1, 1, 1];
    const gameSettings = {
        gameSize: gameSize[difficultyNum],
        bombNumber: Math.round(gameSize[difficultyNum] * difRatio[difficultyNum]),
        startingGridNum: startSize[difficultyNum],
        startingLives: numLives[difficultyNum]
    };
    // Return object containing defined game settings
    return gameSettings;
}
// Call game settings
const gameSettingObj = difficultySetting(difficultyNum);
// Define number of lives
let numLives = { lives: gameSettingObj.startingLives };
// Define number of flags
let numFlags = { flags: gameSettingObj.bombNumber };
console.log(gameSettingObj.bombNumber, numFlags);
// Set starting score  to 0
let score = 0;
let baselineScore;
// Create array of coordinates on game board
let gameStateCoordinates = [];
// Create game board
for (let i = 0; i < gameSettingObj.gameSize; i++) {
    let row = document.createElement('div');
    row.className = 'row';
    row.id = `row ${i}`;
    for (let j = 0; j < gameSettingObj.gameSize; j++) {
        let cell = document.createElement('div');
        cell.className = 'cell';
        cell.id = `${i} ${j}`;
        cell.onclick = function () { leftClick(this.id); };
        cell.addEventListener('contextmenu', function (ev) {
            ev.preventDefault();
            rightClick(this.id);
            return false;
        }, false);
        gameStateCoordinates.push([String(i), String(j)]);
        row.appendChild(cell);
    }
    // Append to parent (canvas)
    document.getElementById("canvas").appendChild(row);
}
// Define class for cell objects
class Cell {
    constructor(cellName, cellId, isVisible, safeInd, bombInd, flagInd, proxNum, frozen, proxArray) {
        this.cellName = cellName;
        this.cellId = cellId;
        this.isVisible = isVisible;
        this.safeInd = safeInd;
        this.bombInd = bombInd;
        this.flagInd = flagInd;
        this.proxNum = proxNum;
        this.proxArray = proxArray;
    }
}
let cellGameStateObj = {};
// Iterate through array of cell coordinates & create cell object for each pair of coordinates
for (let cell of gameStateCoordinates) {
    const objName = `cell_${cell[0]}_${cell[1]}`;
    // let newCellObj = new Cell {  };
    let newCellObj = new Cell(objName, cell, false, true, false, false, 0, false, neighborsArray(cell));
    cellGameStateObj[objName] = newCellObj;
}
function neighborsArray(xy) {
    // Define empty array to receive coordinates
    let neighborArray = [];
    // Get x, y coordinates as numbers
    const cellX = parseInt(xy[0]);
    const cellY = parseInt(xy[1]);
    // Get min/max of each number (x, y -1/+1)
    const minX = cellX - 1;
    const maxX = cellX + 1;
    const minY = cellY - 1;
    const maxY = cellY + 1;
    // Iterate through -1/+1 possibilities
    for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
            let tempNeighbor = [x, y];
            if ((tempNeighbor[0] !== cellX || tempNeighbor[1] !== cellY) &&
                (x >= 0 && x < gameSettingObj.gameSize) &&
                (y >= 0 && y < gameSettingObj.gameSize))
                neighborArray.push(tempNeighbor);
        }
    }
    return neighborArray;
}
// - - - STARTING AREA - - - //
function startingAreaBase(startPoint, size) {
    const midPoint = startPoint / 2 - 0.5;
    const midPointBoundaries = size / 2 + 0.5;
    const startingAreaGrid = {
        startLow: midPoint - midPointBoundaries,
        startHigh: midPoint + midPointBoundaries
    };
    return startingAreaGrid;
}
const startingAreaBaseObj = startingAreaBase(gameSettingObj.gameSize, gameSettingObj.startingGridNum);
// Call function to derive number of bombs to place
let bombNumber = gameSettingObj.bombNumber;
// Function to randomly place bombs
function bombPlacer(bombNum) {
    // Define where bombs can be placed
    let bombCoordinates = [];
    // Randomly populate bomb coordinates respecting restrictions
    while (bombCoordinates.length < bombNum) {
        let coordinate = [];
        let row = getRandomInt(0, gameSettingObj.gameSize);
        let cell = getRandomInt(0, gameSettingObj.gameSize);
        // Check if valid coordinate outside defined safe area
        if (cell < startingAreaBaseObj.startLow || startingAreaBaseObj.startHigh < cell)
            coordinate.push(row);
        else if (row < startingAreaBaseObj.startLow || startingAreaBaseObj.startHigh < row)
            coordinate.push(row);
        if (row < startingAreaBaseObj.startLow || startingAreaBaseObj.startHigh < row)
            coordinate.push(cell);
        else if (cell < startingAreaBaseObj.startLow || startingAreaBaseObj.startHigh < cell)
            coordinate.push(cell);
        // If valid x,y coordinates found, pass to coordinate array
        if (coordinate.length === 2)
            bombCoordinates.push(coordinate);
    }
    // Push bomb coordinates once array meets bombNum
    if (bombCoordinates.length === bombNum)
        bombCoordinates.forEach(c => {
            cellGameStateObj[`cell_${c[0]}_${c[1]}`].bombInd = true;
            cellGameStateObj[`cell_${c[0]}_${c[1]}`].safeInd = false;
        });
}
// Define function to derive random number
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
}
// Call function to place bombs
bombPlacer(bombNumber);
// Call function to add proximity count to each cell object
for (let obj in cellGameStateObj)
    cellGameStateObj[obj].proxNum = neighborBombCount(cellGameStateObj[obj].proxArray);
// Define function to indicate number of bombs nearby
function neighborBombCount(neighborArray) {
    const neighborCoordinates = neighborArray;
    let tempCount = 0;
    for (let i of neighborCoordinates) {
        if (cellGameStateObj[`cell_${i[0]}_${i[1]}`].bombInd)
            tempCount++;
    }
    return tempCount;
}
// - - - STARTING AREA - - - //
// Function to define starting area
function startingArea(difficultyNum) {
    let startingAreaGrid = [];
    // Create array of safe grid places
    for (let a = startingAreaBaseObj.startLow; a < startingAreaBaseObj.startHigh; a++) {
        for (let b = startingAreaBaseObj.startLow; b < startingAreaBaseObj.startHigh; b++) {
            startingAreaGrid.push(`${a} ${b}`);
        }
    }
    // Iterate through starting grid
    startingAreaGrid.forEach(ab => {
        document.getElementById(`${ab}`).style.backgroundColor = 'rgb(245, 245, 245)';
        cellGameStateObj[`cell_${ab.split(' ')[0]}_${ab.split(' ')[1]}`].safeInd = true;
        cellGameStateObj[`cell_${ab.split(' ')[0]}_${ab.split(' ')[1]}`].isVisible = true;
    });
}
// Define function to check for '0' cells near visible cells
function proxZeros() {
    let visGrid = [];
    let newVisCells = [];
    for (let obj in cellGameStateObj) {
        if (cellGameStateObj[obj].isVisible === true && cellGameStateObj[obj].bombInd === false) {
            let x = String(cellGameStateObj[obj].cellId[0]);
            let y = String(cellGameStateObj[obj].cellId[1]);
            visGrid.push(`${x} ${y}`);
            // Loop through bordering cells looking for empty cells
            const neighbors = cellGameStateObj[obj].proxArray;
            for (let i of neighbors) {
                if (cellGameStateObj[`cell_${i[0]}_${i[1]}`].bombInd === false && cellGameStateObj[obj].proxNum === 0) {
                    let xNeighbor = String(cellGameStateObj[`cell_${i[0]}_${i[1]}`].cellId[0]);
                    let yNeighbor = String(cellGameStateObj[`cell_${i[0]}_${i[1]}`].cellId[1]);
                    // Push cells to visGrid
                    newVisCells.push(`${xNeighbor} ${yNeighbor}`);
                }
            }
        }
    }
    return newVisCells;
}
function visCellArray(newVisCells) {
    newVisCells.forEach(ab => {
        document.getElementById(`${ab}`).style.backgroundColor = 'rgb(245, 245, 245)';
        // cellGameStateObj[`cell_${ab.split(' ')[0]}_${ab.split(' ')[1]}`].safeInd = true;
        cellGameStateObj[`cell_${ab.split(' ')[0]}_${ab.split(' ')[1]}`].isVisible = true;
    });
}
// Define function to insert proximity indicators into cells
function proxIndicators() {
    for (let obj in cellGameStateObj) {
        if (cellGameStateObj[obj].isVisible === true && cellGameStateObj[obj].proxNum > 0 && cellGameStateObj[obj].bombInd === false) {
            let tempCellId = `${cellGameStateObj[obj].cellId[0]} ${cellGameStateObj[obj].cellId[1]}`;
            // Insert proxNum
            document.getElementById(tempCellId).innerText = String(cellGameStateObj[obj].proxNum);
            // Styling
            document.getElementById(tempCellId).style.fontWeight = 'bold';
            document.getElementById(tempCellId).style.fontSize = '25px';
            document.getElementById(tempCellId).style.lineHeight = '100%';
            // Define proxNum-sepcific styling
            if (cellGameStateObj[obj].proxNum === 1)
                document.getElementById(tempCellId).style.color = 'blue';
            else if (cellGameStateObj[obj].proxNum === 2)
                document.getElementById(tempCellId).style.color = 'green';
            else if (cellGameStateObj[obj].proxNum === 3)
                document.getElementById(tempCellId).style.color = 'red';
            else if (cellGameStateObj[obj].proxNum === 4)
                document.getElementById(tempCellId).style.color = 'purple';
            else if (cellGameStateObj[obj].proxNum === 5)
                document.getElementById(tempCellId).style.color = 'maroon';
            else if (cellGameStateObj[obj].proxNum === 6)
                document.getElementById(tempCellId).style.color = 'turquoise';
            else if (cellGameStateObj[obj].proxNum === 7)
                document.getElementById(tempCellId).style.color = 'black';
            else if (cellGameStateObj[obj].proxNum === 8)
                document.getElementById(tempCellId).style.color = 'grey';
        }
    }
}
// Call function to define starting area
startingArea(difficultyNum);
// Call function to look for '0' cells that have 
visCellArray(proxZeros());
// Opportunity for recursion?
function runAll() {
    let originalZeroCount = proxZeros().length;
    let newZeroCount = -1;
    while (originalZeroCount !== newZeroCount) {
        originalZeroCount = proxZeros().length;
        visCellArray(proxZeros());
        newZeroCount = proxZeros().length;
    }
}
runAll();
// Add proxy indicators
proxIndicators();
// - - - INITIAL UI ELEMENTS - - - //
// Set flags
flagCountUpdate();
// Remaining lives
remainingLives();
// Establish baseline score
baselineScore = startingScore();
// - - - PLAYER ACTIONS - - - //
// Left click action (sweep cell)
function leftClick(id) {
    // Define id
    const clickedID = id.split(' ');
    // Check if flag is present in cell
    if (playerWonChecker())
        return;
    if (playerLostChecker(numLives.lives))
        return;
    if (flagChecker(clickedID))
        return;
    if (visibleChecker(clickedID))
        return;
    // Check if bombInd is true
    if (bombChecker(clickedID)) {
        cellGameStateObj[`cell_${clickedID[0]}_${clickedID[1]}`].isVisible = true;
        console.log(`cell_${clickedID[0]}_${clickedID[1]}`);
        document.getElementById(`${clickedID[0]} ${clickedID[1]}`).innerHTML = '💣';
        document.getElementById(`${clickedID[0]} ${clickedID[1]}`).style.fontSize = '20px';
        document.getElementById(`${clickedID[0]} ${clickedID[1]}`).style.lineHeight = '120%';
        document.getElementById(`${clickedID[0]} ${clickedID[1]}`).style.backgroundColor = 'red';
        bombShowAll(numLives.lives);
        remainingLives();
    }
    // Actions
    else if (!bombChecker(clickedID)) {
        document.getElementById(id).style.backgroundColor = 'rgb(245, 245, 245)';
        cellGameStateObj[`cell_${clickedID[0]}_${clickedID[1]}`].safeInd = true;
        cellGameStateObj[`cell_${clickedID[0]}_${clickedID[1]}`].isVisible = true;
        runAll();
        proxIndicators();
        scoreCounter();
        if (playerWonChecker())
            playerWonTrue();
    }
}
// Right click action (place flag)
function rightClick(id) {
    if (playerWonChecker())
        return;
    if (playerLostChecker(numLives.lives))
        return;
    // Define id
    const clickedID = id.split(' ');
    // Remove flag if flag already present
    if (flagChecker(clickedID)) {
        document.getElementById(id).innerHTML = '';
        cellGameStateObj[`cell_${clickedID[0]}_${clickedID[1]}`].flagInd = false;
        if (numFlags.flags < gameSettingObj.bombNumber)
            numFlags.flags++;
        flagCountUpdate();
    }
    // Insert flag if flag not already present
    else {
        if (visibleChecker(clickedID))
            return;
        if (numFlags.flags === 0)
            return;
        document.getElementById(id).innerHTML = '🚩';
        document.getElementById(`${clickedID[0]} ${clickedID[1]}`).style.fontSize = '20px';
        document.getElementById(`${clickedID[0]} ${clickedID[1]}`).style.lineHeight = '120%';
        cellGameStateObj[`cell_${clickedID[0]}_${clickedID[1]}`].flagInd = true;
        numFlags.flags--;
        flagCountUpdate();
    }
    console.log(id);
    console.log(clickedID);
    return false;
}
// - - - PLAYER ACTIONS HELPER FUNCTIONS - - - //
// Define function to check if bomb is in cell
function bombChecker(id) {
    const clickedID = id;
    return (cellGameStateObj[`cell_${clickedID[0]}_${clickedID[1]}`].bombInd === true) ? true : false;
}
// Define function to check if flag is in cell
function flagChecker(id) {
    const clickedID = id;
    return (cellGameStateObj[`cell_${clickedID[0]}_${clickedID[1]}`].flagInd === true) ? true : false;
}
// Define function to check if cell is safe
function safeChecker(id) {
    const clickedID = id;
    return (cellGameStateObj[`cell_${clickedID[0]}_${clickedID[1]}`].safeInd === true) ? true : false;
}
// Define function to check if cell is visible
function visibleChecker(id) {
    const clickedID = id;
    return (cellGameStateObj[`cell_${clickedID[0]}_${clickedID[1]}`].isVisible === true) ? true : false;
}
// Define function to reveal all bombs once game is lost
function bombShowAll(lives) {
    if (lives === 1) {
        numLives.lives--;
        let bombArray = [];
        for (let obj in cellGameStateObj) {
            if (cellGameStateObj[obj].bombInd === true && cellGameStateObj[obj].isVisible === false) {
                let x = String(cellGameStateObj[obj].cellId[0]);
                let y = String(cellGameStateObj[obj].cellId[1]);
                bombArray.push(`${x} ${y}`);
            }
        }
        visBombArray(bombArray);
        playerLostTrue();
    }
    else {
        numLives.lives--;
    }
}
// Define function to show all bombs
function visBombArray(newBombCells) {
    newBombCells.forEach(ab => {
        document.getElementById(`${ab}`).style.backgroundColor = 'rgb(245, 245, 245)';
        document.getElementById(`${ab}`).innerHTML = '💣';
        document.getElementById(`${ab}`).style.fontSize = '20px';
        document.getElementById(`${ab}`).style.lineHeight = '120%';
        cellGameStateObj[`cell_${ab.split(' ')[0]}_${ab.split(' ')[1]}`].isVisible = true;
    });
}
// Define function to update number of available flags in UI
function flagCountUpdate() {
    document.getElementById("flagCounter").innerHTML = String('🚩 ' + numFlags.flags);
}
// Define function to update number of remaining lives in UI
function remainingLives() {
    const livesEmojiArray = ['💀', '😯', '🙂', '😀'];
    let lifesString = `${livesEmojiArray[numLives.lives]} ${String(numLives.lives)}`;
    document.getElementById("livesCounter").innerHTML = lifesString;
}
// Define function to update score (10 points for new safe cells)
function scoreCounter() {
    const priorScore = score;
    for (let obj in cellGameStateObj) {
        if (cellGameStateObj[obj].isVisible === true && cellGameStateObj[obj].bombInd === false)
            score += 10;
    }
    let netScore = score - priorScore - baselineScore;
    let htmlScore = String(`Score: ${netScore}`).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    document.getElementById("score").innerHTML = htmlScore;
}
// Define function to establish basline score
function startingScore() {
    let tempBaseline = 0;
    for (let obj in cellGameStateObj) {
        if (cellGameStateObj[obj].isVisible === true && cellGameStateObj[obj].bombInd === false)
            tempBaseline += 10;
    }
    return tempBaseline;
}
// Define function to check if player has won
function playerWonChecker() {
    let hiddenSafeCount = 0;
    for (let obj in cellGameStateObj) {
        if (cellGameStateObj[obj].isVisible === false && cellGameStateObj[obj].safeInd === true && cellGameStateObj[obj].bombInd === false)
            hiddenSafeCount++;
    }
    return (hiddenSafeCount === 0) ? true : false;
}
// Player won actions
function playerWonTrue() {
    let lifesString = `${'🥳'} ${String(numLives.lives)}`;
    document.getElementById("livesCounter").innerHTML = lifesString;
    freezeGame();
    alert(`You Won!!! ${document.getElementById("score").innerHTML}`);
}
// Define function to check if player has lost
function playerLostChecker(lives) {
    return (lives === 0) ? true : false;
}
// Player  list actions
function playerLostTrue() {
    alert(`Game Over - ${document.getElementById("score").innerHTML}`);
}
// Define function to freeze game
function freezeGame() {
    for (let obj in cellGameStateObj) {
        (cellGameStateObj[obj].frozen === true);
    }
}
// Game timer
function timer() {
    let sec = 1;
    let timer = setInterval(function () {
        if (playerWonChecker() === false && playerLostChecker(numLives.lives) === false) {
            document.getElementById('timer').innerHTML = `${String(timeFormat(sec))}`;
            sec++;
        }
    }, 1000);
    return timer;
}
function timeFormat(duration) {
    // Derive minutes & seconds
    let mins = Math.floor((duration % 3600) / 60);
    let secs = Math.floor(duration % 60);
    // Output like "01:01"
    let timeString = "";
    timeString += "" + (mins < 10 ? "0" : "") + mins + ":" + (secs < 10 ? "0" : "");
    timeString += "" + secs;
    return timeString;
}
timer();
