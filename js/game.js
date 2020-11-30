'use strict';

const BOARD_ROW = 28;
const BOARD_COL = 14;
const SPEED_INTERVAL = 200;
const TIMER_INTERVAL = 100;
const SCORE_DISPLAY = document.querySelector('.lines');
const TIMER_DISPLAY = document.querySelector('.time');
const BTN_START = document.querySelector('.startGame');
const BTN_RIGHT = document.getElementById('right');
const BTN_LEFT = document.getElementById('left');
var gScore;

//This is a function that creates the tetromino as an object with randomized starting point at the top.
// I'm using a function to get j2 coords because an object cannot add on itself before it's created.
function getStartBlock() {
    return {
        i1: 0,
        j1: getRandomInt(0, BOARD_COL - 1),
        i2: 1,
        get j2() {
            return this.j1 + 1
        }
    }
}

var gTetroBlock = getStartBlock();
var gBoard;
var gTetroIntrval;
var gGame = {
    isOn: false,
    lineCount: 0,
    score: 0,
    startTime: Date.now()
};
var gTimeInterval;

//setting the board, including button and keyboard moves.
function init() {
    pauseGame()
    gGame.isOn = false;
    gGame.lineCount = 0;
    gTimeInterval = 0;
    gBoard = buildBoard(BOARD_ROW, BOARD_COL);
    renderBoard(gBoard)
    document.addEventListener('keydown', moveKey)
    BTN_RIGHT.addEventListener('click', moveRight)
    BTN_LEFT.addEventListener('click', moveLeft)
}

function toggleGame() {
    gGame.isOn = !gGame.isOn;
    if (gGame.isOn) {
        startGame()
    } else {
        pauseGame()
    }
}

function startGame() {
    gTetroIntrval = setInterval(nextTurn, SPEED_INTERVAL, gBoard, gTetroBlock);
    BTN_START.innerHTML = 'Pause Game';
    gTimeInterval = setInterval(timer,TIMER_INTERVAL);
}

function pauseGame() {
    clearInterval(gTetroIntrval);
    clearInterval(gTimeInterval);
    BTN_START.innerHTML = 'Start Game';
}

//ROW ZONE:

//This function checks only if the rows that are filled with tetrominos are complete. 
// Instead of going through the full board, it only catches i1 and i2 and sees if they're full.
function isRowComplete({ i1, i2 }) {
    for (var i = i2; i >= i1; i--) {
        var isRowComplete = !gBoard[i].find(cell => !cell.isFill)
        if (isRowComplete) {
            removeRow(i)
            gGame.lineCount++
            SCORE_DISPLAY.innerHTML = gGame.lineCount * 100
        }
    }
}

function createNewRow() {
    var newRow = []
    for (var j = 0; j < BOARD_COL; j++) {
        newRow.push(createCell())
    }
    gBoard.splice(0, 0, newRow)
}

//MOVE ZONE: 

// This is the main function that checks if next position on i is valid, update the board data model when block rests, check row complete and add new rows if needed, checks gameOver.
function nextTurn() {
    var currentBlock = { ...gTetroBlock };
    var nextTurnBlock = {
        i1: currentBlock.i1 + 1,
        j1: currentBlock.j1,
        i2: currentBlock.i2 + 1,
        j2: currentBlock.j2,
    };
    if (!canBlockMoveDown(currentBlock)) {
        updateBoardWithBlock(currentBlock);
        isRowComplete(currentBlock);
        while (gBoard.length < BOARD_ROW) {
            createNewRow()
        }
        gTetroBlock = getStartBlock();
    } else {
        gTetroBlock = nextTurnBlock;
    }
    if (checkGameOver()) {
        alert('GAME OVER');
        clearInterval(gTimeInterval)
        SCORE_DISPLAY.innerHTML = 0;
        TIMER_DISPLAY.innerHTML = 0;
        init();
    }
    renderBoard(gBoard);
}

// I had to separate every type of move because otherwise the conditions clash.

function canBlockMoveDown(currentBlock) {
    // checks if the next move is the bottom border.
    if (currentBlock.i2 + 1 === BOARD_ROW) {
        return false;
    }
    // checks if both cells are empty.
    else if (gBoard[currentBlock.i2 + 1][currentBlock.j1].isFill || gBoard[currentBlock.i2 + 1][currentBlock.j2].isFill) {
        return false;
    }
    return true;
}

function moveLeft(currentBlock) {
    if (!gGame.isOn) return;
    currentBlock = { ...gTetroBlock };
    var nextTurnBlock = {
        i1: currentBlock.i1,
        j1: currentBlock.j1 - 1,
        i2: currentBlock.i2,
        j2: currentBlock.j2 - 1,
    };
    if (!canBlockMoveDown(currentBlock)) {
        updateBoardWithBlock(currentBlock);
        isRowComplete(currentBlock);
        gTetroBlock = getStartBlock();
    }
    // checks if the next move is the left border.
    else if (nextTurnBlock.j1 < 0) {
        return;
    }
    // checks if both cells are empty.
    else if (gBoard[currentBlock.i1][currentBlock.j1 - 1].isFill || gBoard[currentBlock.i2][currentBlock.j1 - 1].isFill) {
        return;
    }
    else {
        gTetroBlock = nextTurnBlock;
    }
    renderBoard(gBoard);
}

function moveRight(currentBlock) {
    if (!gGame.isOn) return;
    currentBlock = { ...gTetroBlock };
    var nextTurnBlock = {
        i1: currentBlock.i1,
        j1: currentBlock.j1 + 1,
        i2: currentBlock.i2,
        j2: currentBlock.j2 + 1,
    };
    if (!canBlockMoveDown(currentBlock)) {
        updateBoardWithBlock(currentBlock);
        gTetroBlock = getStartBlock();
    }
    // checks if the next move is the right border.
    else if (nextTurnBlock.j2 >= BOARD_COL) {
        return;
    }
     // checks if both cells are empty.
    else if (gBoard[currentBlock.i1][currentBlock.j2 + 1].isFill || gBoard[currentBlock.i2][currentBlock.j2 + 1].isFill) {
        return;
    }
    else {
        gTetroBlock = nextTurnBlock;

    }
    renderBoard(gBoard);
}

// This function updates the board model with the block's last valid position .

function updateBoardWithBlock(currentBlock) {
    gBoard[currentBlock.i1][currentBlock.j1].isFill = true;
    gBoard[currentBlock.i1][currentBlock.j2].isFill = true;
    gBoard[currentBlock.i2][currentBlock.j1].isFill = true;
    gBoard[currentBlock.i2][currentBlock.j2].isFill = true;
}

//RENDER ZONE:

function renderBoard(board) {
    var strHTML = '';
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>';
        for (var j = 0; j < board[0].length; j++) {
            var className = getClassName(i, j);
            strHTML += `\t<td class=" cell ${className} "></td>`
        }
        strHTML += '\n</tr>\n'
    };
    var elContainer = document.querySelector('.board');
    elContainer.innerHTML = strHTML;

}

function getClassName(i, j) {
    if ((i === gTetroBlock.i1 || i === gTetroBlock.i2) && (j === gTetroBlock.j1 || j === gTetroBlock.j2)){
        return 'block';
    }
    else if (gBoard[i][j].isFill) {
        return 'full';
    }
    else if (i === BOARD_ROW) {
        return 'full';
    }
    else {
        return 'empty';
    }
}

//UTIL ZONE:

function checkGameOver() {
    for (var j = 0; j < BOARD_COL; j++) {
        if (gBoard[0][j].isFill) {
            return true
        }
    };
    return false;
}

function buildBoard(row, col) {
    var board = [];
    for (var i = 0; i < row; i++) {
        board[i] = [];
        for (var j = 0; j < col; j++) {
            board[i][j] = createCell()
        };
    }
    return board;
}

function moveKey(e) {
    if (!gGame.isOn) return
    switch (e.keyCode) {
        case 37:
            moveLeft()
            break;
        case 39:
            moveRight()
            break;
        default:
            return
    }
}

function timer() {
    TIMER_DISPLAY.innerHTML = (((Date.now() - gGame.startTime) / 1000));
}

function removeRow(i) {
    gBoard.splice(i, 1)
}

function createCell() {
    var cell = {
        isFill: false
    }
    return cell;
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}
