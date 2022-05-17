// - - - GAME SETUP - - - //
// Difficulty level in dropdown [Easy, Medium, Hard, Extreme]
var difficultyNum = userDifSelection();
function onPlayerDifSelect() {
    localStorage.setItem('difficultyKey', document.getElementById('difficulty-select').value);
    refreshPage();
}
// Define function to set and retain difficulty
function userDifSelection() {
    if (parseInt(localStorage.getItem('difficultyKey')) !== null) {
        document.getElementById('difficulty-select').value = String(parseInt(localStorage.getItem('difficultyKey')));
        return parseInt(localStorage.getItem('difficultyKey'));
    }
    else {
        var dif = parseInt(document.getElementById('difficulty-select').value);
        localStorage.setItem('difficultyKey', String(dif));
        return dif;
    }
}
// Define function to restart game via "Restart" top menu button
function refreshPage() {
    window.location.reload();
}
function difficultySetting(difficultyNum) {
    // Game size [Easy, Medium, Hard, Extreme]
    var gameSize = [9, 13, 17, 21, 35];
    // Ratio of gameSize x bombs [Easy, Medium, Hard, Extreme, Legendary]
    var difRatio = [1.1, 2.7, 3.8, 4.75, 6.43];
    // Starting grid size
    var startSize = [1, 1, 3, 3, 3];
    // Number of lives
    var numLives = [3, 3, 1, 1, 1];
    var gameSettings = {
        gameSize: gameSize[difficultyNum],
        bombNumber: Math.round(gameSize[difficultyNum] * difRatio[difficultyNum]),
        startingGridNum: startSize[difficultyNum],
        startingLives: numLives[difficultyNum]
    };
    // Return object containing defined game settings
    return gameSettings;
}
// Call game settings
var gameSettingObj = difficultySetting(difficultyNum);
// Define number of lives
var numLives = { lives: gameSettingObj.startingLives };
// Define number of flags
var numFlags = { flags: gameSettingObj.bombNumber };
console.log(gameSettingObj.bombNumber, numFlags);
// Set starting score  to 0
var score = 0;
var baselineScore;
// Create array of coordinates on game board
var gameStateCoordinates = [];
// Create game board
for (var i = 0; i < gameSettingObj.gameSize; i++) {
    var row = document.createElement('div');
    row.className = 'row';
    row.id = "row ".concat(i);
    for (var j = 0; j < gameSettingObj.gameSize; j++) {
        var cell = document.createElement('div');
        cell.className = 'cell';
        cell.id = "".concat(i, " ").concat(j);
        cell.onclick = function () { leftClick(this.id); };
        cell.addEventListener('contextmenu', function (ev) {
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
var cellGameStateObj = {};
// Define constructure for cell objects
function Cell(cellName, cellId, isVisible, safeInd, bombInd, flagInd, proxNum, frozen, proxArray) {
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
for (var _i = 0, gameStateCoordinates_1 = gameStateCoordinates; _i < gameStateCoordinates_1.length; _i++) {
    var cell = gameStateCoordinates_1[_i];
    var objName = "cell_".concat(cell[0], "_").concat(cell[1]);
    var newCellObj = {};
    newCellObj[objName] = new Cell(objName, cell, false, true, false, false, undefined, false, neighborsArray(cell));
    cellGameStateObj[objName] = newCellObj[objName];
}
function neighborsArray(xy) {
    // Define empty array to receive coordinates
    var neighborArray = [];
    // Get x, y coordinates as numbers
    var cellX = xy[0];
    var cellY = xy[1];
    // Get min/max of each number (x, y -1/+1)
    var minX = cellX - 1;
    var maxX = cellX + 1;
    var minY = cellY - 1;
    var maxY = cellY + 1;
    // Iterate through -1/+1 possibilities
    for (var x = minX; x <= maxX; x++) {
        for (var y = minY; y <= maxY; y++) {
            var tempNeighbor = [x, y];
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
    var midPoint = startPoint / 2 - 0.5;
    var midPointBoundaries = size / 2 + 0.5;
    var startingAreaGrid = {
        startLow: midPoint - midPointBoundaries,
        startHigh: midPoint + midPointBoundaries
    };
    return startingAreaGrid;
}
var startingAreaBaseObj = startingAreaBase(gameSettingObj.gameSize, gameSettingObj.startingGridNum);
// Call function to derive number of bombs to place
var bombNumber = gameSettingObj.bombNumber;
// Function to randomly place bombs
function bombPlacer(bombNum) {
    // Define where bombs can be placed
    var bombCoordinates = [];
    // Randomly populate bomb coordinates respecting restrictions
    while (bombCoordinates.length < bombNum) {
        var coordinate = [];
        var row = getRandomInt(0, gameSettingObj.gameSize);
        var cell = getRandomInt(0, gameSettingObj.gameSize);
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
        bombCoordinates.forEach(function (c) {
            cellGameStateObj["cell_".concat(c[0], "_").concat(c[1])].bombInd = true;
            cellGameStateObj["cell_".concat(c[0], "_").concat(c[1])].safeInd = false;
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
for (var obj in cellGameStateObj)
    cellGameStateObj[obj].proxNum = neighborBombCount(cellGameStateObj[obj].proxArray);
// Define function to indicate number of bombs nearby
function neighborBombCount(neighborArray) {
    var neighborCoordinates = neighborArray;
    var tempCount = 0;
    for (var _i = 0, neighborCoordinates_1 = neighborCoordinates; _i < neighborCoordinates_1.length; _i++) {
        var i = neighborCoordinates_1[_i];
        if (cellGameStateObj["cell_".concat(i[0], "_").concat(i[1])].bombInd)
            tempCount++;
    }
    return tempCount;
}
// - - - STARTING AREA - - - //
// Function to define starting area
function startingArea(difficultyNum) {
    var startingAreaGrid = [];
    // Create array of safe grid places
    for (var a = startingAreaBaseObj.startLow; a < startingAreaBaseObj.startHigh; a++) {
        for (var b = startingAreaBaseObj.startLow; b < startingAreaBaseObj.startHigh; b++) {
            startingAreaGrid.push("".concat(a, " ").concat(b));
        }
    }
    // Iterate through starting grid
    startingAreaGrid.forEach(function (ab) {
        document.getElementById("".concat(ab)).style.backgroundColor = 'rgb(245, 245, 245)';
        cellGameStateObj["cell_".concat(ab.split(' ')[0], "_").concat(ab.split(' ')[1])].safeInd = true;
        cellGameStateObj["cell_".concat(ab.split(' ')[0], "_").concat(ab.split(' ')[1])].isVisible = true;
    });
}
// Define function to check for '0' cells near visible cells
function proxZeros() {
    var visGrid = [];
    var newVisCells = [];
    for (var obj in cellGameStateObj) {
        if (cellGameStateObj[obj].isVisible === true && cellGameStateObj[obj].bombInd === false) {
            var x = String(cellGameStateObj[obj].cellId[0]);
            var y = String(cellGameStateObj[obj].cellId[1]);
            visGrid.push("".concat(x, " ").concat(y));
            // Loop through bordering cells looking for empty cells
            var neighbors = cellGameStateObj[obj].proxArray;
            for (var _i = 0, neighbors_1 = neighbors; _i < neighbors_1.length; _i++) {
                var i = neighbors_1[_i];
                if (cellGameStateObj["cell_".concat(i[0], "_").concat(i[1])].bombInd === false && cellGameStateObj[obj].proxNum === 0) {
                    var xNeighbor = String(cellGameStateObj["cell_".concat(i[0], "_").concat(i[1])].cellId[0]);
                    var yNeighbor = String(cellGameStateObj["cell_".concat(i[0], "_").concat(i[1])].cellId[1]);
                    // Push cells to visGrid
                    newVisCells.push("".concat(xNeighbor, " ").concat(yNeighbor));
                }
            }
        }
    }
    return newVisCells;
}
function visCellArray(newVisCells) {
    newVisCells.forEach(function (ab) {
        document.getElementById("".concat(ab)).style.backgroundColor = 'rgb(245, 245, 245)';
        // cellGameStateObj[`cell_${ab.split(' ')[0]}_${ab.split(' ')[1]}`].safeInd = true;
        cellGameStateObj["cell_".concat(ab.split(' ')[0], "_").concat(ab.split(' ')[1])].isVisible = true;
    });
}
// Define function to insert proximity indicators into cells
function proxIndicators() {
    for (var obj in cellGameStateObj) {
        if (cellGameStateObj[obj].isVisible === true && cellGameStateObj[obj].proxNum > 0 && cellGameStateObj[obj].bombInd === false) {
            var tempCellId = "".concat(cellGameStateObj[obj].cellId[0], " ").concat(cellGameStateObj[obj].cellId[1]);
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
function runAll() {
    var originalZeroCount = proxZeros().length;
    var newZeroCount;
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
    var clickedID = id.split(' ');
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
        cellGameStateObj["cell_".concat(clickedID[0], "_").concat(clickedID[1])].isVisible = true;
        console.log("cell_".concat(clickedID[0], "_").concat(clickedID[1]));
        document.getElementById("".concat(clickedID[0], " ").concat(clickedID[1])).innerHTML = '💣';
        document.getElementById("".concat(clickedID[0], " ").concat(clickedID[1])).style.fontSize = '20px';
        document.getElementById("".concat(clickedID[0], " ").concat(clickedID[1])).style.lineHeight = '120%';
        document.getElementById("".concat(clickedID[0], " ").concat(clickedID[1])).style.backgroundColor = 'red';
        bombShowAll(numLives.lives);
        remainingLives();
    }
    // Actions
    else if (!bombChecker(clickedID)) {
        document.getElementById(id).style.backgroundColor = 'rgb(245, 245, 245)';
        cellGameStateObj["cell_".concat(clickedID[0], "_").concat(clickedID[1])].safeInd = true;
        cellGameStateObj["cell_".concat(clickedID[0], "_").concat(clickedID[1])].isVisible = true;
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
    var clickedID = id.split(' ');
    // Remove flag if flag already present
    if (flagChecker(clickedID)) {
        document.getElementById(id).innerHTML = '';
        cellGameStateObj["cell_".concat(clickedID[0], "_").concat(clickedID[1])].flagInd = false;
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
        document.getElementById("".concat(clickedID[0], " ").concat(clickedID[1])).style.fontSize = '20px';
        document.getElementById("".concat(clickedID[0], " ").concat(clickedID[1])).style.lineHeight = '120%';
        cellGameStateObj["cell_".concat(clickedID[0], "_").concat(clickedID[1])].flagInd = true;
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
    var clickedID = id;
    return (cellGameStateObj["cell_".concat(clickedID[0], "_").concat(clickedID[1])].bombInd === true) ? true : false;
}
// Define function to check if flag is in cell
function flagChecker(id) {
    var clickedID = id;
    return (cellGameStateObj["cell_".concat(clickedID[0], "_").concat(clickedID[1])].flagInd === true) ? true : false;
}
// Define function to check if cell is safe
function safeChecker(id) {
    var clickedID = id;
    return (cellGameStateObj["cell_".concat(clickedID[0], "_").concat(clickedID[1])].safeInd === true) ? true : false;
}
// Define function to check if cell is visible
function visibleChecker(id) {
    var clickedID = id;
    return (cellGameStateObj["cell_".concat(clickedID[0], "_").concat(clickedID[1])].isVisible === true) ? true : false;
}
// Define function to reveal all bombs once game is lost
function bombShowAll(lives) {
    if (lives === 1) {
        numLives.lives--;
        var bombArray = [];
        for (var obj in cellGameStateObj) {
            if (cellGameStateObj[obj].bombInd === true && cellGameStateObj[obj].isVisible === false) {
                var x = String(cellGameStateObj[obj].cellId[0]);
                var y = String(cellGameStateObj[obj].cellId[1]);
                bombArray.push("".concat(x, " ").concat(y));
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
    newBombCells.forEach(function (ab) {
        document.getElementById("".concat(ab)).style.backgroundColor = 'rgb(245, 245, 245)';
        document.getElementById("".concat(ab)).innerHTML = '💣';
        document.getElementById("".concat(ab)).style.fontSize = '20px';
        document.getElementById("".concat(ab)).style.lineHeight = '120%';
        cellGameStateObj["cell_".concat(ab.split(' ')[0], "_").concat(ab.split(' ')[1])].isVisible = true;
    });
}
// Define function to update number of available flags in UI
function flagCountUpdate() {
    document.getElementById("flagCounter").innerHTML = String('🚩 ' + numFlags.flags);
}
// Define function to update number of remaining lives in UI
function remainingLives() {
    var livesEmojiArray = ['💀', '😯', '🙂', '😀'];
    var lifesString = "".concat(livesEmojiArray[numLives.lives], " ").concat(String(numLives.lives));
    document.getElementById("livesCounter").innerHTML = lifesString;
}
// Define function to update score (10 points for new safe cells)
function scoreCounter() {
    var priorScore = score;
    for (var obj in cellGameStateObj) {
        if (cellGameStateObj[obj].isVisible === true && cellGameStateObj[obj].bombInd === false)
            score += 10;
    }
    var netScore = score - priorScore - baselineScore;
    var htmlScore = String("Score: ".concat(netScore)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    document.getElementById("score").innerHTML = htmlScore;
}
// Define function to establish basline score
function startingScore() {
    var tempBaseline = 0;
    for (var obj in cellGameStateObj) {
        if (cellGameStateObj[obj].isVisible === true && cellGameStateObj[obj].bombInd === false)
            tempBaseline += 10;
    }
    return tempBaseline;
}
// Define function to check if player has won
function playerWonChecker() {
    var hiddenSafeCount = 0;
    for (var obj in cellGameStateObj) {
        if (cellGameStateObj[obj].isVisible === false && cellGameStateObj[obj].safeInd === true && cellGameStateObj[obj].bombInd === false)
            hiddenSafeCount++;
    }
    return (hiddenSafeCount === 0) ? true : false;
}
// Player won actions
function playerWonTrue() {
    var lifesString = "".concat('🥳', " ").concat(String(numLives.lives));
    document.getElementById("livesCounter").innerHTML = lifesString;
    freezeGame();
    alert("You Won!!! ".concat(document.getElementById("score").innerHTML));
}
// Define function to check if player has lost
function playerLostChecker(lives) {
    return (lives === 0) ? true : false;
}
// Player  list actions
function playerLostTrue() {
    alert("Game Over - ".concat(document.getElementById("score").innerHTML));
}
// Define function to freeze game
function freezeGame() {
    for (var obj in cellGameStateObj) {
        (cellGameStateObj[obj].frozen === true);
    }
}
// Game timer
function timer() {
    var sec = 1;
    var timer = setInterval(function () {
        if (playerWonChecker() === false && playerLostChecker(numLives.lives) === false) {
            document.getElementById('timer').innerHTML = "".concat(String(timeFormat(sec)));
            sec++;
        }
    }, 1000);
    return timer;
}
function timeFormat(duration) {
    // Derive minutes & seconds
    var mins = Math.floor((duration % 3600) / 60);
    var secs = Math.floor(duration % 60);
    // Output like "01:01"
    var timeString = "";
    timeString += "" + (mins < 10 ? "0" : "") + mins + ":" + (secs < 10 ? "0" : "");
    timeString += "" + secs;
    return timeString;
}
timer();
