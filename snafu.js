/**
 * Snafu object using module pattern
 * 
 * The goal of this game is to gobble up as many apples (red squares) on the board
 * while not crashing into yourself or the boundary. There are five stages, each with 
 * increasing speed. The snake itself grows with each apple it consumes, making it more 
 * difficult to consume the other apples without crashing. If all five stages are completed, 
 * the game is won and the user is declared a champion. 
 *
 * @author: Erik Johnson
 * 
 */
var Snafu = (function () {

    "use strict"; //Turn on strict mode

    /***********************
     *                     *
     *    GAME OBJECT      *
     *                     *
     ***********************/

    /**
     * Create an object literal to contain public methods
     */  
    var snakeGame = {
        
        //Initialize game by adding event handlers
        init : function () {
            addHandlers();
        }
    };

    /**
     * Add any event handlers on game startup
     */  
    function addHandlers() {

        var startBtn = document.getElementById('newGame');

        startBtn.onclick = function () {
            gameplay.newGame();
        };

        //Add controls for serpent movement with arrow keys
        document.onkeydown = function (e) {
            mySnake.setDirection((typeof e.which === "number") ? e.which : e.keyCode);
        };
    };

    /***********************
     *                     *
     *  GAMEPLAY CONTROL   *
     *                     *
     ***********************/

    var gameplay = {
        
        interval : null, //Stores rate of motion
        score    : 0,    //Used to tally score
        paused   : false,
        level    : 1,
        msg      : "",
                
        /**
         * This function is triggered by multiple events: crashing into boundary or self, completing game
         * 
         * @return {void}
         */  
        gameOver: function () {
           
           //Set dead to true and direction to null to disable movement
           mySnake.dead = true;
           mySnake.direction = null;
           
           //Clear the interval variables to stop all movement
           clearInterval(this.interval);
           this.interval = null;
           
           //Default message
           if (!this.msg) {
               this.msg = "Gameover! Your score : ";
           }
           
           //Display game over message to user
           alert(this.msg + this.score);
           
           //Hide stats and display "start over" button
           myGameArea.hideGameStats();
        },
                
        /**
         * Toggle the pausing of the game by setting the pause property to true,
         * storing the snake last direction in the lastDirection property, and setting 
         * its current direction to null
         * 
         * @return {void}
         */  
        togglePause: function () {

            if (this.paused === false) {
                
                this.paused = true;
                mySnake.lastDirection = mySnake.direction;
                mySnake.direction  = null;
                
                myGameArea.setPaused();
                
                clearInterval(this.interval);
            }
            else if (this.paused === true) {
                
                this.paused = false;
                mySnake.direction = mySnake.lastDirection;
                
                myGameArea.setPaused();
                
                clearInterval(this.interval);
                this.interval = setInterval(function () { 

                    mySnake.move();

                }, mySnake.speed);
            }
        },
             
        /**
         * Move to the next level by increasing the level property. The final level
         * in the game is 5, afterwhich will trigger the gameOver function
         * 
         * @return {void}
         */  
        nextLevel : function() {
            
            //Increase level
            this.level++;        
                                 
            if (this.level > 5) {
                
                //Stop game and declare user the champion snake wrangler
                this.msg = "You are truly an amazing snafu artist and snake wrangler! Your score: ";
                this.gameOver();
                return;
            }           
            
            mySnake.increaseSpeed();
            
            myGameArea.updateLevel();
        },
        
        /**
         * Start new game and reset all relevant properties
         * 
         * @return {void}
         */  
        newGame: function () {

            //Reset score 
            this.score = 0;
            
            //Reset level 
            this.level = 1;
            
            //Reset gameover message
            this.msg   = "";
            
            //Reset existing apple coordinates
            myApples.appleCoords = [];
            
            //Get columns and rows based on width and height of snafu container
            var columns = myGameArea.getBoardColumns();
            var rows    = myGameArea.getBoardRows();

            //Clear the game board and reset the background color
            myGameArea.clearBoard();
            myGameArea.updateGameboardBG();

            //Build the grid system, initially with grass only (no snake or apples)
            myGameArea.gameGrid.buildGrid('GRASS', columns, rows);

            //Randomize start position of new snake
            mySnake.newSnake();

            //Randomize start position of 3 apples
            myApples.newApple(3);

            //Hide 'gameOver' Div and show 'gameStats' div
            myGameArea.showGameStats();
        },
        
        /**
         * Increase the current score by a specified amount
         * 
         * @param {int} val
         * @return {void}
         */
        increaseScore: function (val) {
            this.score += val;
        },
        
        /**
         * Check the current score and move to the next level if a levels max score has been reached
         * 
         * @return {void}
         */
        checkScore : function () {
            
            var maxScore;
            
            //Level 1
            if (this.level === 1) {
                maxScore = 100;
            }
            else if (this.level === 2) {
                maxScore = 200;
            }
            else if (this.level === 3) {
                maxScore = 300;
            }
            else if (this.level === 4) {
                maxScore = 400;
            }
            else if (this.level === 5) {
                maxScore = 500;
            }
            
            if (this.score === maxScore) {
                this.nextLevel();
            }
        }
    };


    /***********************
     *                     *
     *     GAMEBOARD       *
     *                     *
     ***********************/

    var myGameArea = {
        
        /*
         * Get the gameboard element
         * 
         * @return {object} HTML element
         */  
        getBoard: function () {
            return document.getElementById("snafu");
        },
        
        /*
         * Get the number of columns that can fit into the size of the gameboard
         * 
         * @return {int}
         */  
        getBoardColumns: function () {

            var gameArea = this.getBoard();
            return Math.round(gameArea.offsetWidth / mySnake.blockW);
        },
        
        /*
         * Get the number of rows that can fit into the size of the gameboard
         * 
         * @return {int}
         */  
        getBoardRows: function () {

            var gameArea = this.getBoard();
            return Math.round(gameArea.offsetHeight / mySnake.blockH);
        },
       
        /*
         * Clear the gameboard of any existing elements. Called on each new game start.
         * 
         * @return {void}
         */  
        clearBoard : function() {

            //Find any existing snake elements
            var gameBoard = this.getBoard();
            var snakeElements = gameBoard.querySelectorAll(".serpent");
            var appleElements = gameBoard.querySelectorAll(".apple");
            var i = 0;
            var el;
            
            if (snakeElements.length > 0) {
                
                for (i = 0; i < snakeElements.length; i++) {
                    
                    el = snakeElements[i]; 
                    el.parentNode.removeChild(el);
                }
            }
            
            if (appleElements.length > 0) {
                
                for (i = 0; i < appleElements.length; i++) {
                    
                    el = appleElements[i]; 
                    el.parentNode.removeChild(el);
                }
            }
        },     
        
        /**
         * The functions and properties in this object are responsible for controlling the grid of the game
         */  
        gameGrid : {

            width: null,
            height: null,
            gridArray: [],
            totalGrids: 0,

            /*
             * Build an empty grid on game start and game reset
             */  
            buildGrid: function (el, cols, rows) {

                //Set grid width and height to the number of columns and rows determined
                this.width  = cols;
                this.height = rows;
                
                //Reset grid array
                this.totalGrids = 0;
                this.gridArray  = [];

                //For each column, add a new empty array element and build y number of rows
                for (var x = 0; x < cols; x++) {
                    this.gridArray.push([]);

                    for (var y = 0; y < rows; y++) {
                        this.gridArray[x].push(el);
                        this.totalGrids++;
                    }
                }
            },

            /**
             * Retrieve the value of coordinates at a specified location
             * 
             * @param {int} x
             * @param {int} y
             * @returns {snafuSnafu.myGameArea.gameGrid@arr;@arr;gridArray}
             */
            getCoords: function (x, y) {

                var coords;
                
                if (x && y && typeof this.gridArray[x][y] !== "undefined") {
                    coords = this.gridArray[x][y];
                }
                
                return coords;
            },

            /**
             * Use this method to place an apple, grass or snake at a specified location in the grid
             * 
             * @param {object} el
             * @param {int} x
             * @param {int} y
             * @return {void}
             */
            putElement: function (el, x, y) {
                if (el && x && y) {
                    this.gridArray[x][y] = el;
                }        
            },

            /**
             * Get a random column location in the grid
             * 
             * @return {int}
             */  
            getRandomX: function () {
                return Math.floor(Math.random() * (this.width - 1));
            },

            /**
             * Get a random row location in the grid
             * 
             * @return {int}
             */  
            getRandomY: function () {
                return Math.floor(Math.random() * (this.height - 1));
            }
        },
       
        /**
         * Hide the gameover div, and show the gamestats div for active gameplay
         * 
         * @return {void}
         */  
        showGameStats: function () {

            var gamestats = document.getElementById('gamestats');
            var gameover  = document.getElementById('gameover');
            var scoreArea = document.getElementById("scoreArea");
            var levelArea = document.getElementById("levelArea");

            gameover.style.display  = 'none';
            gamestats.style.display = 'block';
            scoreArea.innerHTML = "Score: " + gameplay.score;
            levelArea.innerHTML = "Level: " + gameplay.level;
        },
        
        /**
         * Hide the gamestats div, and show the game over div for end of game
         * 
         * @return {void}
         */  
        hideGameStats: function () {

            var gamestats = document.getElementById('gamestats');
            var gameover  = document.getElementById('gameover');
            gamestats.style.display = 'none';
            gameover.style.display  = 'block';
        }, 
        
        /**
         * If paused, diplay the "paused" div
         * 
         * @return {void}
         */  
        setPaused : function() {
            
            var paused = document.getElementById('paused');
            
            if (gameplay.paused === true) {
                paused.style.display  = 'block';
            }
            else  {
                paused.style.display  = 'none';
            }
        },
        
        /**
         * Update the score shown in the score board area
         * 
         * @return {void}
         */  
        updateScore : function() {
            
            var scoreArea = document.getElementById("scoreArea");
            scoreArea.innerHTML = "Score: " + gameplay.score;
        }, 
        
        
        /*
         * Update the level shown in the score board area
         * 
         * @return {void}
         */   
        updateLevel : function() {
            
            var levelArea = document.getElementById("levelArea");
            levelArea.innerHTML = "Level: " + gameplay.level;
            
            this.updateGameboardBG();
        },
        
        /*
         * Update the background color of the game board according to the level of play
         * 
         * @return {void}
         */   
        updateGameboardBG : function () {
            
            var gameboard = this.getBoard();
            
            if (gameplay.level === 1) {
                gameboard.style.backgroundColor = "green";
            }
            else if (gameplay.level === 2) {
                gameboard.style.backgroundColor = "royalblue";
            }
            else if (gameplay.level === 3) {
                gameboard.style.backgroundColor = "plum";
            }
            else if (gameplay.level === 4) {
                gameboard.style.backgroundColor = "silver";
            }
            else if (gameplay.level === 5) {
                gameboard.style.backgroundColor = "gold";
            }
        }
    };


    /***********************
     *                     *
     *       APPLES        *
     *                     *
     ***********************/

    var myApples = {
        
        appleCoords : [],
        appleCount  : 0, 
        
        /**
         * Create a new apple on startup or on when the previous apple was consumed
         * 
         * @return {void}
         */   
        newApple : function (num) {

            //Allow up to four apples to be created at once
            if (isNaN(num) === false && num > 0 && num < 5) {

                var gameArea = myGameArea.getBoard();
                var appleElement,
                        appleId,
                        appleObj,
                        column,
                        row,
                        posX,
                        posY,
                        randomX,
                        randomY,
                        searchGrass;

                //Make sure that apple is not placed on top of existing snakebody or other apple
                for (var i = 0; i < num; i++) {

                    //Find an empty plot of grass
                    var g = 0;
                    while (g < myGameArea.gameGrid.totalGrids) {

                        randomX = myGameArea.gameGrid.getRandomX();
                        randomY = myGameArea.gameGrid.getRandomY();
                        searchGrass = myGameArea.gameGrid.getCoords(randomX, randomY);

                        if (searchGrass === 'GRASS') {

                            column = randomX;
                            row = randomY;
                            myGameArea.gameGrid.putElement('APPLE', column, row);
                            break;
                        }
                        g++;
                    }

                    //Calculate pixel location of apple
                    posX = randomX * mySnake.blockW;
                    posY = randomY * mySnake.blockH;

                    //Append randomized apple element to gameboard
                    appleElement = document.createElement("div");
                    appleId = "apple_" + this.appleCount;
                    appleElement.setAttribute("id", appleId);
                    appleElement.setAttribute("class", "apple");
                    appleElement.style.top = posY + "px";
                    appleElement.style.left = posX + "px";

                    gameArea.appendChild(appleElement);

                    //Store apple information location for later retrieval
                    appleObj = {};
                    appleObj.id   = appleId;
                    appleObj.posY = posX;
                    appleObj.posX = posY;
                    appleObj.col = column;
                    appleObj.row = row;

                    this.appleCoords.push(appleObj);
                    
                    //Increase the tally of total apples created thus far
                    this.appleCount++;
                }
            }
        }
    };


    /***********************
     *                     *
     *       SNAKE         *
     *                     *
     ***********************/

    var mySnake = {
        
        snakeHead : null,
        snakeTail : null,
        movement : [],  //container for snake body grid coordinates
        headPos : {},   //grid position of snakes head
        prevHead : {},  //grid position of the previous head
        tailPos : {},   //grid position of snakes tail
        speed: 100,    //used to determine speed of interval
        direction : null,
        lastDirection : null,
        blockW : 20,   //block width
        blockH : 20,   //block height
        dead : false,
        
        /*
         * Get the current position of the leading snake div element from the movement array
         * 
         * @return {object}
         */   
        getHeadPos: function () {  //Gets head position in grids
            if (this.movement[0]) {
                return this.movement[0];
            }
        },
                
        /**
         * Create and display the snake element at a random position on the page 
         * 
         * @return {void}
         */       
        newSnake : function () {

            //Place the snake on a random grid square
            var gameArea = myGameArea.getBoard();
            var i = 0;
            var posX,
                posY,
                randomCol,
                randomRow,
                startCol,
                startRow,
                searchGrass,
                snakeId;

           //Reset snake movement coordinates and other variables
            this.movement   = [];
            this.direction  = null;
            this.snakeHead  = null;            
            this.snakeTail  = null;
            this.headPos    = {};
            this.prevHead   = {};
            this.tailPos    = {};
            this.dead       = false;
            this.speed      = 100;
            
            //Use the grid to find an available plot of grass
            while (i < myGameArea.gameGrid.totalGrids) {

                randomCol = myGameArea.gameGrid.getRandomX();
                randomRow = myGameArea.gameGrid.getRandomY();
                searchGrass = myGameArea.gameGrid.getCoords(randomCol, randomRow);

                if (searchGrass === 'GRASS') {

                    startCol = randomCol;
                    startRow = randomRow;
                    break;
                }
                i++;
            }

            //Place the snake in the start position, identified by 'SERPENT'
            myGameArea.gameGrid.putElement('SERPENT', startCol, startRow);

            //Calculate pixel value of position in grid
            posX = startCol * this.blockW;
            posY = startRow * this.blockH;

            snakeId = "serpent_" + startCol + startRow; //Ex: serpent_1630

            //Store the grid coordinates and px locations of the snakes head
            this.headPos = {
                col  : startCol,
                row  : startRow,
                posX : posX,
                posY : posY, 
                id   : snakeId };
           
            //Manage the snakes movements in the movement array
            this.movement.push(this.headPos);

            //Create snake element
            this.snakeHead = document.createElement("div");
            this.snakeHead.setAttribute("id", this.headPos.id);
            this.snakeHead.setAttribute("class", "serpent");
            this.snakeHead.style.top  = posY + "px";
            this.snakeHead.style.left = posX + "px";
            gameArea.appendChild(this.snakeHead);
        },
        
        /*
         * Set the direction of the snake with arrow keys - up, down, left, and right. 
         * Or, optionally, pause the game when the space bar is pressed. 
         * 
         * @return {void}
         */
        setDirection : function (key) {
           
            if (this.snakeHead === null || this.dead === true ) {
                return;
            }

            //Space bar will pause and unpause the gameplay
            if (key === 32) {
                gameplay.togglePause();
            }

            //Base direction on keycode, and disable reverse movement   
            if (key === 40 && this.direction !== 'up') {        // down = 40
                this.direction = 'down';
            }
            else if (key === 38 && this.direction !== 'down') { // up = 38
                this.direction = 'up';
            }
            else if (key === 37 && this.direction !== 'right') { // left = 37
                this.direction = 'left';
            }
            else if (key === 39 && this.direction !== 'left') { // right = 39
                this.direction = 'right';
            }

            if (this.direction && gameplay.paused === false) {

                var self = this; 

                clearInterval(gameplay.interval);             //Clear existing directional movement

                gameplay.interval = setInterval(function () { //Update direction of movement 

                    self.move();

                }, self.speed);
            }
        },

        /*
         * This function called with the setInterval function and will move the snake by 
         * adjusting the snakes head and tail. The tail will become the head with each new move, 
         * and give the illusion that the snake is moving fluidly across the game area. 
         * 
         * @return {void}
         */
        move : function () {

            if (!this.direction || !this.snakeHead) {
                return;
            }
            
            //Check for any score updates
            gameplay.checkScore();

            //Get the snake heads current grid position
            var oldHead, 
                oldTail, 
                newHeadCol, 
                newHeadRow, 
                newHeadX, 
                newHeadY, 
                snakeId, 
                crashed, 
                growth;
        
            //Store the last hea location into the previous head object
            this.prevHead = oldHead = this.getHeadPos();

            //Adjust the location of the new snake head according to the direction
            if (this.direction === 'up') {

                newHeadCol = oldHead.col;
                newHeadRow = oldHead.row - 1;
                newHeadX = oldHead.posX;
                newHeadY = oldHead.posY - this.blockH;

            }
            else if (this.direction === 'down') {

                newHeadCol = oldHead.col;
                newHeadRow = oldHead.row + 1;
                newHeadX = oldHead.posX;
                newHeadY = oldHead.posY + this.blockH;

            }
            else if (this.direction === 'left') {

                newHeadCol = oldHead.col - 1;
                newHeadRow = oldHead.row;
                newHeadX = oldHead.posX - this.blockW;
                newHeadY = oldHead.posY;

            }
            else if (this.direction === 'right') {

                newHeadCol = oldHead.col + 1;
                newHeadRow = oldHead.row;
                newHeadX = oldHead.posX + this.blockW;
                newHeadY = oldHead.posY;
            }

            //Update ID based on grid coordinates
            snakeId = "serpent_" + newHeadCol + newHeadRow;
            
            //Store the grid coordinates and px locations of the snakes head
            this.headPos = {
                col  : newHeadCol,
                row  : newHeadRow,
                posX : newHeadX,
                posY : newHeadY, 
                id   : snakeId
            };
            
            //With each movement, check for crashes into self or boundary, and growth (apple eating) event
            crashed = this.checkCrashEvent();

            if (crashed === true) {
                
                this.dead = true;
                gameplay.gameOver();
                return;
            }

            //Check whether the snake has eaten an apple
            growth = this.checkGrowthEvent();
            
            if (growth === true) {
                
                this.eatApple();
                this.addLength();
            }

            //Remove the old tail and move the element to the new head position
            this.tailPos = this.movement.pop();

            //Update the snakes head and tail positions on the board
            myGameArea.gameGrid.putElement('GRASS',   this.tailPos.col, this.tailPos.row);
            myGameArea.gameGrid.putElement('SERPENT', this.headPos.col, this.headPos.row);

            //Push new head to the front of the movement array
            this.movement.unshift(this.headPos);
                
            //Now, move the old tail block to the new head position
            oldTail = document.getElementById(this.tailPos.id);
                        
            if (oldTail) {
                
                oldTail.setAttribute("id", snakeId);
                oldTail.style.top  = this.headPos.posY + "px";
                oldTail.style.left = this.headPos.posX + "px";

                //Set new snake head element
                this.snakeHead = oldTail;  
            }
        },
                
        /**
         * This function will check whether the snake has crashed into the boundary or itself
         * 
         * @return {bool}
         */
        checkCrashEvent : function () {

            //Out of bounds
            if (this.headPos.col < 0 || this.headPos.col >= myGameArea.gameGrid.width ||
                this.headPos.row < 0 || this.headPos.row >= myGameArea.gameGrid.height ) {
                    return true;
            }

            var getGrid = myGameArea.gameGrid.getCoords(this.headPos.col, this.headPos.row);

            if (getGrid === 'SERPENT' ) {
                return true;
            }
            
            return false;
        }, 
        
        /**
         * This function will monitor whether the snake has "eaten" an apple, and grow accordingly
         * 
         * @return {bool}
         */
        checkGrowthEvent : function () {

            var getGrid = myGameArea.gameGrid.getCoords(this.headPos.col, this.headPos.row);

            if (getGrid === 'APPLE') {
                return true;
            }

            return false;
        },
        
        /*
         * Remove the "eaten" apple from the gameplay and apples array object, 
         * increase the score, and create a new apple to place on the board.
         * 
         * @return {void}
         */
        eatApple : function () {

            var appleId, el;

            //Remove existing apple from 
            myGameArea.gameGrid.putElement('GRASS', this.headPos.col, this.headPos.row);

            //Remove the apple from the myApples.appleCoords array
            for (var i = 0; i < myApples.appleCoords.length; i++) {
                               
                if (myApples.appleCoords[i]['col'] === this.headPos.col && 
                    myApples.appleCoords[i]['row'] === this.headPos.row ) {
                   
                    appleId = myApples.appleCoords[i]['id'];
                    
                    myApples.appleCoords.splice(i, 1);
                    break;
                }
            }

            //Now remove the apple from the gameboard
            if (document.getElementById(appleId)) {

                el = document.getElementById(appleId);
                el.parentNode.removeChild(el);
            }

            //Increase the game score
            gameplay.increaseScore(5);
            myGameArea.updateScore();
            
            //Create a new apple on the board
            myApples.newApple(1);
        }, 
        
        /**
         * Add an additional block to the snakes body with its own unique id in order to adjust 
         * the position of the element later.
         * 
         * @return {void}
         */
        addLength : function () {
            
            //Place the snake on a random grid square
            var gameArea = myGameArea.getBoard();
            var posX,
                posY,
                snakeId, 
                snakeBody;
                       
            //Place the snake in the start position, identified by 'SERPENT'
            myGameArea.gameGrid.putElement('SERPENT', this.prevHead.col, this.prevHead.row);

            //Calculate pixel value of position in grid
            posX = this.prevHead.col * this.blockW;
            posY = this.prevHead.row * this.blockH;

            //Create a unique id for the div element
            snakeId = "serpent_" + this.prevHead.col + this.prevHead.row; //Ex: serpent_1630

            //Add the new body element to the movement array
            this.movement.push(this.prevHead);

            //Create snake element
            snakeBody = document.createElement("div");
            snakeBody.setAttribute("id", snakeId);
            snakeBody.setAttribute("class", "serpent");
            snakeBody.style.top  = posY + "px";
            snakeBody.style.left = posX + "px";
            gameArea.appendChild(snakeBody);
        },
        
        /**
         * Increase the speed of the snake by subtracting 10, as this is used by the setInterval function.
         * 
         * @return {void}
         */
        increaseSpeed : function () {
            if (this.speed - 10 > 0 ) {
                this.speed -= 10;
            }
        }
    };

    return snakeGame;
})();