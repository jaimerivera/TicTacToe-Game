/// <reference path="./jsfiles/raphael.js" /> 
/// <reference path="./jsfiles/jquery-2.0.2.min.js" />
/// <reference path="./jsfiles/jquery-ui-1.10.3.custom.min.js" />
/// <reference path="./jsfiles/knockout.js" />


window.onload = function () {
    boardManager.init("canvas_container");
    board.init();

    var userState = UserState.create();
    var computerState = ComputerState.create();
    var winState = WinState.create();

    ko.applyBindings(new ViewModel(board, userState, computerState, winState));
};

var global = {
    computerMoveDelay: 3000
};


//#region BOARD MANAGER AND BOARD OBJECTS
//*******************************************************
var boardManager = {
    paper: null,
    containerId: null,
    tiles: [],

    init: function (containerId) {
        boardManager.containerId = containerId;
        boardManager.paper = Raphael(containerId, 500, 500);

        var drawSurface = document.getElementById(boardManager.containerId);
        drawSurface.onclick = boardManager.handleClick.bind(boardManager);
        //drawSurface.ondblclick = this.handleDblClick.bind(this);
    },

    drawBoard: function () {
        var p = boardManager.paper;
        var self = boardManager;

        p.clear();
        self.tiles = []; //clear the tiles

        //draw the tiles
        var num = 0;
        for (var y = 0; y < 400; y = y + 160) {
            for (var x = 15; x < 400; x = x + 160) {
                p.rect(x, y, 150, 150, 0).attr({ fill: '#567', stroke: 'none' }).node.setAttribute('tile', 'true');

                num++;
                var obj = { number: num, xpos: x, ypos: y };
                self.tiles.push(obj);
            }
        }
    },

    handleClick: function (e) {
        var self = boardManager;
        var paper = self.paper;
        var element = paper.getElementByPoint(e.x, e.y);

        if (element && element.node.hasAttribute('tile')) {
            var bbox = element.getBBox();
            //this.drawX(bbox.x, bbox.y);
            var num = self.getTileNumber(bbox.x, bbox.y);
            //publish that the tile was clicked
            observable.publish(observableEvents.tileClicked, num);
        }
    },
   
    getTileNumber: function (x, y) {
        var self = boardManager;
        var equalX = [];
        var retNumber = -1;

        ko.utils.arrayForEach(self.tiles, function (tile) {
            if (tile.xpos === x) equalX.push(tile);
        });

        ko.utils.arrayForEach(equalX, function (tile) {
            if (tile.ypos === y) retNumber = tile.number;
        });

        return retNumber;
    },

    getCoordinatesByTileNumber: function (number) {
        var self = boardManager;
        var retTile;

        ko.utils.arrayForEach(self.tiles, function (tile) {
            if (tile.number === number) retTile = tile;
        });

        var retObj = { x: retTile.xpos, y: retTile.ypos };
        return retObj;
    },

    setPositionPlayerChecked: function (positionNumber) {
        var self = boardManager;
        var posObj = self.getCoordinatesByTileNumber(positionNumber);
        self.drawX(posObj.x, posObj.y);
    },

    setPositionComputerChecked: function (positionNumber) {
        var self = boardManager;
        var posObj = self.getCoordinatesByTileNumber(positionNumber);
        self.drawO(posObj.x, posObj.y);
    },

    drawRedX: function (tileNumber) {
        var self = boardManager;
        var posObj = self.getCoordinatesByTileNumber(tileNumber);
        self.drawX(posObj.x, posObj.y, "#b70000");
    },

    drawRedO: function (tileNumber) {
        var self = boardManager;
        var posObj = self.getCoordinatesByTileNumber(tileNumber);
        self.drawO(posObj.x, posObj.y, "#b70000");
    },

    drawX: function (x, y, color) {
        var self = boardManager;
        var xoffset = x + 130;
        if (!color) color = "#fff";
        self.paper.path("M " + (x + 20) + " " + (y + 20) + " l 110 110").attr({ stroke: color, 'stroke-width': 15 });
        self.paper.path("M " + xoffset + " " + (y + 20) + " l -110 110").attr({ stroke: color, 'stroke-width': 15 });
    },

    drawO: function (x, y, color) {
        var self = boardManager;
        if (!color) color = "#fff";
        self.paper.circle((x + 75), (y + 75), 60).attr({ stroke: color, 'stroke-width': 15 });
    }
};

var board = {
    positions: [],
    init: function () {
        board.positions = [];

        for (var i = 1; i < 10; i++) {
            board.positions[i] = 0;
        }

        boardManager.drawBoard();
    },

    getValueAt: function (number) {
        var self = board;
        return self.positions[number];
    },

    setUser: function (tileNumber) {
        var self = board;
        self.positions[tileNumber] = 1;
        boardManager.setPositionPlayerChecked(tileNumber);
    },

    setComputer: function (tileNumber) {
        var self = board;
        self.positions[tileNumber] = 5;
        boardManager.setPositionComputerChecked(tileNumber);
    },

    getBoardSum: function () {
        var boardSum = 0;

        for (var i = 1; i < board.positions.length; i++) {
            boardSum = boardSum + board.positions[i];
        }

        return boardSum;
    },

    status: function () {
        var self = board;
        //check horizontal
        for (var i = 1; i < 8; i = i + 3) {
            var left = self.positions[i];
            var center = self.positions[i + 1];
            var right = self.positions[i + 2];

            if (left > 0 && left === center && left === right) return { win: true, start: i, center: i + 1, end: i + 2, continueGame: false };
        }

        //vertical
        for (var j = 1; j < 4; j++) {
            var top = self.positions[j];
            var middle = self.positions[j + 3];
            var bottom = self.positions[j + 6];

            if (top > 0 && top === middle && top === bottom) return { win: true, start: j, center: j + 3, end: j + 6, continueGame: false };
        }

        //diagonal right
        if (self.positions[1] > 0 && self.positions[1] === self.positions[5] && self.positions[1] === self.positions[9])
            return { win: true, start: 1, center: 5, end: 9, continueGame: false };

        //diagonal left
        if (self.positions[3] > 0 && self.positions[3] === self.positions[5] && self.positions[3] === self.positions[7])
            return { win: true, start: 3, center: 5, end: 7, continueGame: false };

        //if we get here then no win
        var keepPlaying = false;
        ko.utils.arrayForEach(self.positions, function (el) {
            if (el === 0) keepPlaying = true;
        });

        if (keepPlaying) return { win: false, start: 0, end: 0, continueGame: true };
        else return { win: false, start: 0, center: 0, end: 0, continueGame: false };
    },

    setWinnerRed: function () {
        var self = board;
        var status = self.status();
        
        if (status.win === true) {
           var method = self.getValueAt(status.start) === 5 ? boardManager.drawRedO : boardManager.drawRedX;

            method(status.start);
            method(status.center);
            method(status.end);
        }        
    },
};

//#endregion

//#region UI VIEW MODEL -- MVVM PATTERN
//*******************************************************
function ViewModel(board, userState, computerState, winState) {
    var self = this;

    this.computerScore = ko.observable(0);
    this.playerScore = ko.observable(0);
    this.strategy = ko.observable("random");
    this.whosTurn = ko.observable("Player's Turn"); //we will initially set the user to be first

    this.newGameClick = function () {
        this.board.init();
    };

    //board
    this.board = board;

    //set the state logic
    this.userState = userState;
    this.computerState = computerState;
    this.winState = winState;
    this.whoLastWon = "";
    this.currentState = this.userState;

    //set the strategies
    this.random = RandomStrategy.create();
    this.beginner = BeginnerStrategy.create();
    this.expert = ExpertStrategy.create();
    this.currentStrategy = this.random;

    //obervable function to update the strategy when the selection changes
    this.strategy.subscribe(function (newVal) {
        if (newVal === "random") self.currentStrategy = self.random;
        else if (newVal === "beginner") self.currentStrategy = self.beginner;
        else self.currentStrategy = self.expert;
    });

    this.tileClickEventHandler = function (args) {
        this.currentState.handleTileClick(this.board, args);
        this.checkBoardStatusAndChangeState();
    };

    this.computerReadyToMoveEventHandler = function () {
        this.currentState.makeMove(this.board, this.currentStrategy);
        this.checkBoardStatusAndChangeState();
    };

    this.gameWonEventHandler = function () {
        this.board.init();
        if (this.whoLastWon === "User") {
            this.currentState = this.computerState;
            self.whosTurn("Computer's Turn");
        }
        else {
            this.currentState = this.userState;
            self.whosTurn("User's Turn");
        }

        this.currentState.setActive();
    };

    this.checkBoardStatusAndChangeState = function () {
        if (this.currentState.isDone()) {
            var boardStatus = this.board.status();

            if (boardStatus.win) { //add win and reset board                
                var identity = this.currentState.getIdentity();
                if (identity === "User") {
                    var uscore = this.playerScore();
                    this.playerScore(uscore + 1);
                }
                else {
                    var cscore = this.computerScore();
                    this.computerScore(cscore + 1);
                }

                this.whoLastWon = identity;
                this.currentState = this.winState;
                this.currentState.setActive();
                this.whosTurn("Game Won");
            }
            else if (!boardStatus.continueGame) { //if continue game is false we have a tie
                this.board.init();
                this.switchState();
            }
            else {
                this.switchState();
            }

        }//is done is true ends here       
    };

    this.switchState = function () {
        var identity = this.currentState.getIdentity();
        if (identity === "User") {
            this.currentState = this.computerState;
            self.whosTurn("Computer's Turn");
        }
        else {
            this.currentState = this.userState;
            self.whosTurn("User's Turn");
        }

        this.currentState.setActive();
    };

    //subscribe to tile click events
    observable.subscribe(observableEvents.tileClicked, this.tileClickEventHandler, this);
    observable.subscribe(observableEvents.computerReadyToMove, this.computerReadyToMoveEventHandler, this);
    observable.subscribe(observableEvents.gameWon, this.gameWonEventHandler, this);
}

//#endregion

//#region OBSERVABLE IMPLEMENTATION -- OBSERVER PATTERN
//*******************************************************
var observable = {
    _subscribers: [],

    subscribe: function (event, callBackHandler, context) {
        var saveObj = { handler: callBackHandler, atContext: context };
        var index = this._subscribers.indexOf(event);

        if (index === -1) {
            this._subscribers[event] = [saveObj];
        }
        else {
            this._subscribers[event].push(saveObj);
        }
    },

    publish: function (event, args) {
        var eventSubscribers = this._subscribers[event];
        if (eventSubscribers) {
            ko.utils.arrayForEach(eventSubscribers, function (obj) {
                obj.handler.call(obj.atContext, args);
            });
        }
    }
};

var observableEvents = {
    tileClicked: 1,
    computerReadyToMove: 2,
    gameWon: 3
};
//#endregion

//#region GAME STATES -- STATE PATTERN
//*******************************************************

//the client will make calls to the functions defined here
function BaseState() {
    this.setActive = function () {
        this._setActive();
    };

    this.makeMove = function (board, strategy) {
        this._makeMove(board, strategy);
    };

    this.handleTileClick = function (board, tileNumber) {
        this._handleTileClick(board, tileNumber);
    };

    this.getIdentity = function () {
        return this._getIdentity();
    };

    this.isDone = function () {
        return this._isDone();
    };
}

function UserState() {
    var isDone = false;

    this._setActive = function () {
        isDone = false;
    };

    this._getIdentity = function () {
        return "User";
    };

    this._makeMove = function (board, strategy) {
        //console.log("user state made a move");
        return;
    };

    this._handleTileClick = function (board, tileNumber) {
        if (board.getValueAt(tileNumber) === 0) {
            board.setUser(tileNumber);
            isDone = true;
        }
    };

    this._isDone = function () {
        return isDone;
    };
}
UserState.create = function () {
    UserState.prototype = new BaseState();
    return new UserState();
};

function ComputerState() {
    var isDone = false;

    this._setActive = function () {
        isDone = false;
        setTimeout(function () { observable.publish(observableEvents.computerReadyToMove, null); }, global.computerMoveDelay, null);
    };

    this._getIdentity = function () {
        return "Computer";
    };

    this._makeMove = function (board, strategy) {
        var position = strategy.getMovePosition(board);
        board.setComputer(position);
        isDone = true;
    };

    this._handleTileClick = function (board, tileNumber) {
        //console.log("computer handled tile click");
        return;
    };

    this._isDone = function () {
        return isDone;
    };
}

ComputerState.create = function () {
    ComputerState.prototype = new BaseState();
    return new ComputerState();
};

function WinState() {
    var isDone = false;

    this._setActive = function () {
        isDone = false;
        board.setWinnerRed();

        setTimeout(function () {
            observable.publish(observableEvents.gameWon, null);
        }, 3000, null);
    };

    this._getIdentity = function () {
        return "GameWon";
    };

    this._makeMove = function (board, strategy) {
        //console.log("Win state made a move");
        return;
    };

    this._handleTileClick = function (board, tileNumber) {
        //console.log("Win handled tile click");
        return;
    };

    this._isDone = function () {
        return isDone;
    };
}
WinState.create = function () {
    WinState.prototype = new BaseState();
    return new WinState();
};
//#endregion

//#region GAME LOGIC STRATEGIES -- STRATEGY PATTERN
//*******************************************************

function BaseStrategy() {
    //public member
    this.getMovePosition = function (board) {
        return this._getMovePosition(board);
    };

    //private members    
    this._getRowEmptyPosition = function (rowNumber, board) {
        var startIndex;
        if (rowNumber === 1) startIndex = 1;
        else if (rowNumber === 2) startIndex = 4;
        else startIndex = 7;

        if (!board.getValueAt(startIndex)) return startIndex;
        else if (!board.getValueAt(startIndex + 1)) return startIndex + 1;
        else return startIndex + 2;
    };

    this._getRowSum = function (rowNumber, board) {
        var startIndex;
        if (rowNumber === 1) startIndex = 1;
        else if (rowNumber === 2) startIndex = 4;
        else startIndex = 7;

        return board.getValueAt(startIndex) + board.getValueAt(startIndex + 1) + board.getValueAt(startIndex + 2);
    };

    this._getColumnEmptyPosition = function (columNumber, board) { //columnNumber = startIndex
        if (!board.getValueAt(columNumber)) return columNumber;
        else if (!board.getValueAt(columNumber + 3)) return columNumber + 3;
        else return columNumber + 6;
    };

    this._getColumnSum = function (columnNumber, board) {
        return board.getValueAt(columnNumber) + board.getValueAt(columnNumber + 3) + board.getValueAt(columnNumber + 6);
    };

    this._getRightDiagonalEmptyPosition = function (board) {
        if (!board.getValueAt(1)) return 1;
        else if (!board.getValueAt(5)) return 5;
        else return 9;
    };

    this._getRightDiagonalSum = function (board) {
        return board.getValueAt(1) + board.getValueAt(5) + board.getValueAt(9);
    };

    this._getLeftDiagonalEmptyPosition = function (board) {
        if (!board.getValueAt(3)) return 3;
        else if (!board.getValueAt(5)) return 5;
        else return 7;
    };

    this._getLeftDiagonalSum = function (board) {
        return board.getValueAt(3) + board.getValueAt(5) + board.getValueAt(7);
    };

    this._getRandomMove = function (board) {
        var retValue = 0;
        do {
            var randNum = Math.round((Math.random() * 8) + 1);
            if (board.getValueAt(randNum) === 0) retValue = randNum;
        } while (!retValue);

        return retValue;
    };

    this._getBlockPosition = function (board) {
        //return 0 if no block needed else return position where block is needed        

        //algorightm uses knowledge that the board marks a user position with value of 1
        //and a computer position with a value of 5
        //check row
        for (var h = 1; h < 4; h++) {
            var hSum = this._getRowSum(h, board);
            if (hSum === 2) return this._getRowEmptyPosition(h, board);
        }
        //check column
        for (var v = 1; v < 4; v++) {
            var vSum = this._getColumnSum(v, board);
            if (vSum === 2) return this._getColumnEmptyPosition(v, board);
        }

        var rightDiagonalSum = this._getRightDiagonalSum(board);
        if (rightDiagonalSum === 2) return this._getRightDiagonalEmptyPosition(board);

        var leftDiagonalSum = this._getLeftDiagonalSum(board);
        if (leftDiagonalSum === 2) return this._getLeftDiagonalEmptyPosition(board);

        //if we made it this far we don't need to block
        return 0;
    };

    this._getWinningPosition = function (board) {
        //return 0 if no win possible else return position where win is possible        
        //algorightm uses knowledge that the board position is = 1 for user and 5 for computer

        //check horizontal
        for (var h = 1; h < 4; h++) {
            var hSum = this._getRowSum(h, board);
            if (hSum === 10) return this._getRowEmptyPosition(h, board);
        }

        for (var v = 1; v < 4; v++) {
            var vSum = this._getColumnSum(v, board);
            if (vSum === 10) return this._getColumnEmptyPosition(v, board);
        }

        var rightDiagonalSum = this._getRightDiagonalSum(board);
        if (rightDiagonalSum === 10) return this._getRightDiagonalEmptyPosition(board);

        var leftDiagonalSum = this._getLeftDiagonalSum(board);
        if (leftDiagonalSum === 10) return this._getLeftDiagonalEmptyPosition(board);
        //if we made it this far we don't need to block
        return 0;
    };

    this._getWinInTwoMovesPosition = function (board) {

        for (var h = 1; h < 4; h++) {
            var hSum = this._getRowSum(h, board);
            if (hSum === 5) return this._getRowEmptyPosition(h, board);
        }

        for (var v = 1; v < 4; v++) {
            var vSum = this._getColumnSum(v, board);
            if (vSum === 5) return this._getColumnEmptyPosition(v, board);
        }

        var rDiagonalSum = this._getRightDiagonalSum(board);
        if (rDiagonalSum === 5) return this._getRightDiagonalEmptyPosition(board);

        var lDiagonalSum = this._getLeftDiagonalSum(board);
        if (lDiagonalSum === 5) return this._getLeftDiagonalEmptyPosition(board);

        return 0;
    };
}

function RandomStrategy() {
    this._getMovePosition = function (board) {
        return this._getRandomMove(board);
    };
}
RandomStrategy.create = function () {
    RandomStrategy.prototype = new BaseStrategy();
    return new RandomStrategy();
};

function BeginnerStrategy() {
    this._getMovePosition = function (board) {
        var movePosition = 0;
        var type;
        movePosition = this._getWinningPosition(board);
        type = "winning" + movePosition;
        if (!movePosition) { movePosition = this._getBlockPosition(board); type = "block" + movePosition; }
        if (!movePosition) { movePosition = this._getWinInTwoMovesPosition(board); type = "winIn2" + movePosition; }
        if (!movePosition) { movePosition = this._getRandomMove(board); type = "random" + movePosition; }
        //console.log(type);
        return movePosition;
    };
}
BeginnerStrategy.create = function () {
    BeginnerStrategy.prototype = new BaseStrategy();
    return new BeginnerStrategy();
};

function ExpertStrategy() {
    this._getRandomCornerMove = function () {
        var val = Math.random() * 6;
        if (val < 3) {
            val = Math.random() * 6;
            if (val < 3) return 1;
            else return 3;
        }
        else {
            val = Math.random() * 6;
            if (val < 3) return 7;
            else return 9;
        }
    };

    this._makeCenterOrCornerMove = function (board) {
        if (board.getValueAt(5) === 1) return this._getRandomCornerMove();
        else return 5;
    };

    this._setupSecondCornerMove = function (board) {
        var sum = board.getBoardSum();
        var userMove1 = 0;
        var userMove2 = 0;
        var compLastMovePosition;
        for (var i = 1; i < board.positions.length; i++) {//get move positions
            if (board.getValueAt(i) === 5) {
                compLastMovePosition = i;
            }
            if (board.getValueAt(i) === 1) {
                if (userMove1 === 0) userMove1 = i;
                else userMove2 = i;
            }
        }

        if (sum === 6) {//player one move computer also one move
            //check middle make oppossing move            
            if (board.getValueAt(5) === 1) {
                if (compLastMovePosition === 1) return 9;
                else if (compLastMovePosition === 3) return 7;
                else if (compLastMovePosition === 7) return 3;
                else return 1;
            }
            else {//did not click in the center 
                if (userMove1 === 2 || userMove1 === 8) {
                    if (compLastMovePosition === 1) return 7;
                    else if (compLastMovePosition === 3) return 9;
                    else if (compLastMovePosition === 7) return 1;
                    else return 3;
                }
                else if (userMove1 === 4 || userMove1 === 6) {
                    if (compLastMovePosition === 1) return 3;
                    else if (compLastMovePosition === 3) return 1;
                    else if (compLastMovePosition === 7) return 9;
                    else return 7;
                }//we are both at the corners just get the empty corner horizontal or vertical
                else {
                    var moveSum = userMove1 + compLastMovePosition;
                    if (moveSum === 4 || moveSum === 16) {//horizontal
                        if (compLastMovePosition === 1) return 7;
                        else if (compLastMovePosition === 3) return 9;
                        else if (compLastMovePosition === 7) return 1;
                        else return 3;
                    }
                    else {//vertical
                        if (compLastMovePosition === 1) return 3;
                        else if (compLastMovePosition === 3) return 1;
                        else if (compLastMovePosition === 7) return 9;
                        else return 7;
                    }
                }
            }
        }
        else if (sum === 7) {
            //am I in the middle of a cris cross?
            if ((userMove1 === 1 && userMove2 === 9) || (userMove1 === 9 && userMove2 === 1)
               || (userMove1 === 3 && userMove2 === 7) || (userMove1 === 7 && userMove2 === 3)) {
                return 2; //if we get here I am definetly in the middle just for the issue to block
            }
            else {
                if (board.getValueAt(5) === 0) return 5;
                else {
                    var retVal;
                    do {
                        retVal = this._getRandomCornerMove();
                    } while (board.getValueAt(retVal) !== 0);

                    return retVal;
                }
            }
        }
    };

    this._setupThirdCornerMove = function (board) {
        var rSum = this._getRowSum(1, board);
        if (rSum === 5) {
            if (board.getValueAt(1) === 5) return 3;
            else return 1;
        }

        rSum = this._getRowSum(3, board);
        if (rSum === 5) {
            if (board.getValueAt(7) === 5) return 9;
            else return 7;
        }

        rSum = this._getColumnSum(1, board);
        if (rSum === 5) {
            if (board.getValueAt(1) === 5) return 7;
            else return 1;
        }

        rSum = this._getColumnSum(3, board);
        if (rSum === 5) {
            if (board.getValueAt(3) === 5) return 9;
            else return 3;
        }

        return 0;
    };

    this._getSmartMove = function (board) {
        var boardSum = board.getBoardSum();
        if (boardSum === 0) return this._getRandomCornerMove();
        else if (boardSum === 1) return this._makeCenterOrCornerMove(board);
        else if (boardSum < 8) return this._setupSecondCornerMove(board);
        else if (boardSum < 14) return this._setupThirdCornerMove(board);
        return 0;
    };

    this._getMovePosition = function (board) {
        var movePosition = 0;

        movePosition = this._getWinningPosition(board);
        if (!movePosition) movePosition = this._getBlockPosition(board);
        if (!movePosition) movePosition = this._getSmartMove(board);
        if (!movePosition) movePosition = this._getWinInTwoMovesPosition(board);
        if (!movePosition) movePosition = this._getRandomMove(board);
        return movePosition;
    };
}
ExpertStrategy.create = function () {
    ExpertStrategy.prototype = new BaseStrategy();
    return new ExpertStrategy();
};

//#endregion