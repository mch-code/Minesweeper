
// - - - GAME SETUP - - - //

// Difficulty level in dropdown [Easy, Medium, Hard, Extreme]
let difficultyNum: number = userDifSelection();

function onPlayerDifSelect() {
    localStorage.setItem('difficultyKey', (<HTMLInputElement>document.getElementById('difficulty-select')).value);
    refreshPage();
}

// Define function to set and retain difficulty
function userDifSelection() {
    if (parseInt(localStorage.getItem('difficultyKey')) !== null) {
        (<HTMLInputElement>document.getElementById('difficulty-select')).value = String(parseInt(localStorage.getItem('difficultyKey')));
        return parseInt(localStorage.getItem('difficultyKey'));
    }
    else {
        let dif: number = parseInt((<HTMLInputElement>document.getElementById('difficulty-select')).value)
        localStorage.setItem('difficultyKey', String(dif));
        return dif;
    }
}

// Define function to restart game via "Restart" top menu button
function refreshPage() {
    window.location.reload();
}

function difficultySetting(difficultyNum: number) {
    // Game size [Easy, Medium, Hard, Extreme]
    const gameSize: number[] = [9, 13, 17, 21, 35];
    // Ratio of gameSize x bombs [Easy, Medium, Hard, Extreme, Legendary]
    const difRatio: number[] = [1.1, 2.7, 3.8, 4.75, 6.43];
    // Starting grid size
    const startSize: number[] = [1, 1, 3, 3, 3];
    // Number of lives
    const numLives: number[] = [3, 3, 1, 1, 1];

    const gameSettings = {
        gameSize: gameSize[difficultyNum],
        bombNumber: Math.round(gameSize[difficultyNum] * difRatio[difficultyNum]),
        startingGridNum: startSize[difficultyNum],
        startingLives: numLives[difficultyNum]
    }
    // Return object containing defined game settings
    return gameSettings;
}

// Call game settings
const gameSettingObj = difficultySetting(difficultyNum);

// Define number of lives
let numLives = {lives: gameSettingObj.startingLives};

// Define number of flags
let numFlags = {flags: gameSettingObj.bombNumber};

console.log(gameSettingObj.bombNumber, numFlags);

// Set starting score  to 0
let score: number = 0;
let baselineScore: number;

// Create array of coordinates on game board
let gameStateCoordinates = [];

// Create game board
for (let i: number = 0; i < gameSettingObj.gameSize; i++) {
    let row: any = document.createElement('div');
    row.className = 'row';
    row.id = `row ${i}`;
    for (let j: number = 0; j < gameSettingObj.gameSize; j++) {
        let cell: any = document.createElement('div');
        cell.className = 'cell';
        cell.id = `${i} ${j}`;
        cell.onclick = function() { leftClick(this.id); };
        cell.addEventListener('contextmenu', function(ev) {
            ev.preventDefault();
            rightClick(this.id);
            return false;
        }, false);

        gameStateCoordinates.push([i, j]);

        row.appendChild(cell);
    }
    // Append to parent (canvas)
    document.getElementById("canvas").appendChild(row);
}

let cellGameStateObj: object = {};

// Define constructure for cell objects
function Cell(
    cellName: string,
    cellId: string[],
    isVisible: boolean,
    safeInd: boolean,
    bombInd: boolean,
    flagInd: boolean,
    proxNum: number,
    frozen: boolean,
    proxArray: number[][]) {
        this.cellName = cellName;
        this.cellId = cellId;
        this.isVisible = isVisible;
        this.safeInd = safeInd;
        this.bombInd = bombInd;
        this.flagInd = flagInd;
        this.proxNum = proxNum;
        this.proxArray = proxArray;
}

// Iterate through array of cell coordinates & create cell obuject for each pair of coordinates
for (let cell of gameStateCoordinates) {
    let objName: string = `cell_${cell[0]}_${cell[1]}`;
    let newCellObj = {};
    newCellObj[objName] = new Cell(
        objName,
        cell,
        false,
        true,
        false,
        false,
        undefined,
        false,
        neighborsArray(cell)
    );
    cellGameStateObj[objName] = newCellObj[objName];
}

function neighborsArray(xy: number[]) {
    // Define empty array to receive coordinates
    let neighborArray: number[][] = [];
    // Get x, y coordinates as numbers
    const cellX: number = xy[0];
    const cellY: number = xy[1];
    // Get min/max of each number (x, y -1/+1)
    const minX: number = cellX - 1;
    const maxX: number = cellX + 1;
    const minY: number = cellY - 1;
    const maxY: number = cellY + 1;
    // Iterate through -1/+1 possibilities
    for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
            let tempNeighbor: number[] = [x, y];
            if (
                (tempNeighbor[0] !== cellX || tempNeighbor[1] !== cellY) &&
                (x >= 0 && x < gameSettingObj.gameSize) &&
                (y >= 0 && y < gameSettingObj.gameSize)
                ) neighborArray.push(tempNeighbor);
        }
    }
    return neighborArray;
}

// - - - STARTING AREA - - - //
function startingAreaBase(startPoint: number, size: number) {
    const midPoint: number = startPoint / 2 - 0.5;
    const midPointBoundaries: number = size / 2 + 0.5
    const startingAreaGrid = {
        startLow: midPoint - midPointBoundaries,
        startHigh: midPoint + midPointBoundaries
    }

    return startingAreaGrid;
}

const startingAreaBaseObj = startingAreaBase(gameSettingObj.gameSize, gameSettingObj.startingGridNum);

// Call function to derive number of bombs to place
let bombNumber: number = gameSettingObj.bombNumber;

// Function to randomly place bombs
function bombPlacer(bombNum: number) {
    // Define where bombs can be placed
    let bombCoordinates = [];
    // Randomly populate bomb coordinates respecting restrictions
    while (bombCoordinates.length < bombNum) {
        let coordinate = [];
        let row: number = getRandomInt(0,gameSettingObj.gameSize);
        let cell: number = getRandomInt(0,gameSettingObj.gameSize);

        // Check if valid coordinate outside defined safe area
        if (cell < startingAreaBaseObj.startLow || startingAreaBaseObj.startHigh < cell) coordinate.push(row)
        else if (row < startingAreaBaseObj.startLow || startingAreaBaseObj.startHigh < row) coordinate.push(row);
        if (row < startingAreaBaseObj.startLow || startingAreaBaseObj.startHigh < row) coordinate.push(cell)
        else if (cell < startingAreaBaseObj.startLow || startingAreaBaseObj.startHigh < cell) coordinate.push(cell);
        // If valid x,y coordinates found, pass to coordinate array
        if (coordinate.length === 2) bombCoordinates.push(coordinate);
    }

    // Push bomb coordinates once array meets bombNum
    if (bombCoordinates.length === bombNum)
        bombCoordinates.forEach(c => {
            cellGameStateObj[`cell_${c[0]}_${c[1]}`].bombInd = true;
            cellGameStateObj[`cell_${c[0]}_${c[1]}`].safeInd = false;
        })
}

// Define function to derive random number
function getRandomInt(min: number, max: number) {
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
function neighborBombCount(neighborArray: number[][]) {
    const neighborCoordinates: number[][] = neighborArray;
    let tempCount: number = 0;
    for (let i of neighborCoordinates) {
        if (cellGameStateObj[`cell_${i[0]}_${i[1]}`].bombInd) tempCount++;
    }
    return tempCount;
}

// - - - STARTING AREA - - - //

// Function to define starting area
function startingArea(difficultyNum: number) {
    let startingAreaGrid = [];
    // Create array of safe grid places
    for (let a = startingAreaBaseObj.startLow; a < startingAreaBaseObj.startHigh; a++) {
        for (let b = startingAreaBaseObj.startLow; b < startingAreaBaseObj.startHigh; b++) {
            startingAreaGrid.push(`${a} ${b}`);
        }
    }

    // Iterate through starting grid
    startingAreaGrid.forEach(ab => {
        (<HTMLInputElement>document.getElementById(`${ab}`)).style.backgroundColor = 'rgb(245, 245, 245)';
        cellGameStateObj[`cell_${ab.split(' ')[0]}_${ab.split(' ')[1]}`].safeInd = true;
        cellGameStateObj[`cell_${ab.split(' ')[0]}_${ab.split(' ')[1]}`].isVisible = true;
    });
}


// Define function to check for '0' cells near visible cells
function proxZeros() {
    let visGrid: string[] = [];
    let newVisCells: string[] = [];
    for (let obj in cellGameStateObj) {
        if (cellGameStateObj[obj].isVisible === true && cellGameStateObj[obj].bombInd === false) {
            let x: string = String(cellGameStateObj[obj].cellId[0]);
            let y: string = String(cellGameStateObj[obj].cellId[1]);
            visGrid.push(`${x} ${y}`);
            // Loop through bordering cells looking for empty cells
            const neighbors = cellGameStateObj[obj].proxArray;
            for (let i of neighbors) {
                if (cellGameStateObj[`cell_${i[0]}_${i[1]}`].bombInd === false && cellGameStateObj[obj].proxNum === 0) {
                    let xNeighbor: string = String(cellGameStateObj[`cell_${i[0]}_${i[1]}`].cellId[0]);
                    let yNeighbor: string = String(cellGameStateObj[`cell_${i[0]}_${i[1]}`].cellId[1]);
                    // Push cells to visGrid
                    newVisCells.push(`${xNeighbor} ${yNeighbor}`);
                }
            }
        }
    }
    return newVisCells;
}

function visCellArray(newVisCells: string[]) {
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
            let tempCellId: string = `${cellGameStateObj[obj].cellId[0]} ${cellGameStateObj[obj].cellId[1]}`
            // Insert proxNum
            document.getElementById(tempCellId).innerText = String(cellGameStateObj[obj].proxNum);
            // Styling
            document.getElementById(tempCellId).style.fontWeight = 'bold';
            document.getElementById(tempCellId).style.fontSize = '25px';
            document.getElementById(tempCellId).style.lineHeight = '100%';
            // Define proxNum-sepcific styling
            if (cellGameStateObj[obj].proxNum === 1) document.getElementById(tempCellId).style.color = 'blue'
            else if (cellGameStateObj[obj].proxNum === 2) document.getElementById(tempCellId).style.color = 'green'
            else if (cellGameStateObj[obj].proxNum === 3) document.getElementById(tempCellId).style.color = 'red'
            else if (cellGameStateObj[obj].proxNum === 4) document.getElementById(tempCellId).style.color = 'purple'
            else if (cellGameStateObj[obj].proxNum === 5) document.getElementById(tempCellId).style.color = 'maroon'
            else if (cellGameStateObj[obj].proxNum === 6) document.getElementById(tempCellId).style.color = 'turquoise'
            else if (cellGameStateObj[obj].proxNum === 7) document.getElementById(tempCellId).style.color = 'black'
            else if (cellGameStateObj[obj].proxNum === 8) document.getElementById(tempCellId).style.color = 'grey'
        }
    }
}

// Call function to define starting area
startingArea(difficultyNum);
// Call function to look for '0' cells that have 
visCellArray(proxZeros());

function runAll() {
    let originalZeroCount: number = proxZeros().length;
    let newZeroCount: number;
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
function leftClick(id: string) {
    // Define id
    const clickedID = id.split(' ');
    // Check if flag is present in cell
    if (playerWonChecker()) return;
    if (playerLostChecker(numLives.lives)) return;
    if (flagChecker(clickedID)) return;
    if (visibleChecker(clickedID)) return;
    // Check if bombInd is true
    if (bombChecker(clickedID)) {
        cellGameStateObj[`cell_${clickedID[0]}_${clickedID[1]}`].isVisible = true;
        console.log(`cell_${clickedID[0]}_${clickedID[1]}`);
        document.getElementById(`${clickedID[0]} ${clickedID[1]}`).innerHTML = '💣';
        (<HTMLInputElement>document.getElementById(`${clickedID[0]} ${clickedID[1]}`)).style.fontSize = '20px';
        (<HTMLInputElement>document.getElementById(`${clickedID[0]} ${clickedID[1]}`)).style.lineHeight = '120%';
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
        if (playerWonChecker()) playerWonTrue();
    }
}

// Right click action (place flag)
function rightClick(id: string) {
    if (playerWonChecker()) return;
    if (playerLostChecker(numLives.lives)) return;
    // Define id
    const clickedID = id.split(' ');
    // Remove flag if flag already present
    if (flagChecker(clickedID)) {
        document.getElementById(id).innerHTML = '';
        cellGameStateObj[`cell_${clickedID[0]}_${clickedID[1]}`].flagInd = false;
        if (numFlags.flags < gameSettingObj.bombNumber) numFlags.flags++;
        flagCountUpdate();
    }
    // Insert flag if flag not already present
    else {
        if (visibleChecker(clickedID)) return;
        if (numFlags.flags === 0) return;
        document.getElementById(id).innerHTML = '🚩';
        (<HTMLInputElement>document.getElementById(`${clickedID[0]} ${clickedID[1]}`)).style.fontSize = '20px';
        (<HTMLInputElement>document.getElementById(`${clickedID[0]} ${clickedID[1]}`)).style.lineHeight = '120%';
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
function bombChecker(id: string[]) {
    const clickedID = id;
    return (cellGameStateObj[`cell_${clickedID[0]}_${clickedID[1]}`].bombInd === true) ? true : false;
}

// Define function to check if flag is in cell
function flagChecker(id: string[]) {
    const clickedID = id;
    return (cellGameStateObj[`cell_${clickedID[0]}_${clickedID[1]}`].flagInd === true) ? true : false;
}

// Define function to check if cell is safe
function safeChecker(id: string[]) {
    const clickedID = id;
    return (cellGameStateObj[`cell_${clickedID[0]}_${clickedID[1]}`].safeInd === true) ? true : false;
}

// Define function to check if cell is visible
function visibleChecker(id: string[]) {
    const clickedID = id;
    return (cellGameStateObj[`cell_${clickedID[0]}_${clickedID[1]}`].isVisible === true) ? true : false;
}

// Define function to reveal all bombs once game is lost
function bombShowAll(lives: number) {
    if (lives === 1) {
        numLives.lives--
        let bombArray: string[] = [];
        for (let obj in cellGameStateObj) {
            if (cellGameStateObj[obj].bombInd === true && cellGameStateObj[obj].isVisible === false) {
                let x: string = String(cellGameStateObj[obj].cellId[0]);
                let y: string = String(cellGameStateObj[obj].cellId[1]);
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
function visBombArray(newBombCells: string[]) {
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
    const livesEmojiArray: string[] = ['💀','😯','🙂','😀'];
    let lifesString: string = `${livesEmojiArray[numLives.lives]} ${String(numLives.lives)}`;
    document.getElementById("livesCounter").innerHTML = lifesString;
}

// Define function to update score (10 points for new safe cells)
function scoreCounter() {
    const priorScore: number = score;
    for (let obj in cellGameStateObj) {
        if (cellGameStateObj[obj].isVisible === true && cellGameStateObj[obj].bombInd === false) score += 10;
    }
    let netScore: number = score - priorScore  - baselineScore;
    let htmlScore: string = String(`Score: ${netScore}`).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    document.getElementById("score").innerHTML = htmlScore;
}

// Define function to establish basline score
function startingScore() {
    let tempBaseline: number = 0;
    for (let obj in cellGameStateObj) {
        if (cellGameStateObj[obj].isVisible === true && cellGameStateObj[obj].bombInd === false) tempBaseline += 10;
    }
    return tempBaseline;
}

// Define function to check if player has won
function playerWonChecker() {
    let hiddenSafeCount: number = 0;
    for (let obj in cellGameStateObj) {
        if (cellGameStateObj[obj].isVisible === false && cellGameStateObj[obj].safeInd === true && cellGameStateObj[obj].bombInd === false) hiddenSafeCount++;
    }
    return (hiddenSafeCount === 0) ? true : false;
}

// Player won actions
function playerWonTrue() {
    let lifesString: string = `${'🥳'} ${String(numLives.lives)}`;
    document.getElementById("livesCounter").innerHTML = lifesString;
    freezeGame();
    alert(`You Won!!! ${document.getElementById("score").innerHTML}`);
}

// Define function to check if player has lost
function playerLostChecker(lives: number) {
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
    let sec: number = 1;
    let timer = setInterval(function(){
        if (playerWonChecker() === false && playerLostChecker(numLives.lives) === false) {
            document.getElementById('timer').innerHTML = `${String(timeFormat(sec))}`;
            sec++;
        }
    }, 1000);
    return timer;
}

function timeFormat(duration: number) {   
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
