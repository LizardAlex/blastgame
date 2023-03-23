
class gameLogic extends EventTarget {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.board = this.generateBoard();
    this.swapBonusActive = false;
    this.swapsRemaining = 3;
    this.swapTile1 = null;
    this.bombBonusActive = false;
    this.bombsRemaining = 3;
    this.bombRadius = 3;
    this.bonusTileThreshold = 7;
    this.score = 0;
  }

  generateBoard() {
    const board = [];
    for (let row = 0; row < this.height; row++) {
      board[row] = [];
      for (let col = 0; col < this.width; col++) {
        board[row][col] = Math.floor(Math.random() * 5) + 1;
      }
    }
    return board;
  }

  findAdjacentMatches(row, col, visited) {
    if (
      row < 0 ||
      row >= this.height ||
      col < 0 ||
      col >= this.width ||
      visited.has(`${row},${col}`)
    ) {
      return [];
    }

    const color = this.board[row][col];
    visited.add(`${row},${col}`);

    const matches = [{ row, col }];

    const directions = [
      { r: -1, c: 0 },
      { r: 1, c: 0 },
      { r: 0, c: -1 },
      { r: 0, c: 1 },
    ];

    for (const { r, c } of directions) {
      const newRow = row + r;
      const newCol = col + c;
      if (
        newRow >= 0 &&
        newRow < this.height &&
        newCol >= 0 &&
        newCol < this.width &&
        this.board[newRow][newCol] === color
      ) {
        matches.push(...this.findAdjacentMatches(newRow, newCol, visited));
      }
    }

    return matches;
  }

  removeTiles(matches) {
    for (const { row, col } of matches) {
      this.board[row][col] = null;
      this.dispatchEvent(new CustomEvent('tileDestroyed', { detail: { row, col } }));
    }

    // Calculate score based on combo size
    const comboSize = matches.length;
    const comboMultiplier = comboSize >= 12 ? 3 : comboSize >= 7 ? 2 : 1;
    const scoreIncrement = comboSize * comboMultiplier;
    this.score += scoreIncrement;

    this.dropBlocks();
    this.generateNewBlocks();
  }

  dropBlocks() {
    for (let col = 0; col < this.width; col++) {
      let writeRow = this.height - 1;
      for (let row = this.height - 1; row >= 0; row--) {
        if (this.board[row][col] !== null) {
          if (writeRow !== row) {
            this.board[writeRow][col] = this.board[row][col];
            this.board[row][col] = null;
            this.dispatchEvent(new CustomEvent('tileMoved', { detail: { fromRow: row, fromCol: col, toRow: writeRow, toCol: col } }));
          }
          writeRow--;
        }
      }
    }
  }

  generateNewBlocks() {
    for (let row = 0; row < this.height; row++) {
      for (let col = 0; col < this.width; col++) {
        if (this.board[row][col] === null) {
          this.board[row][col] = Math.floor(Math.random() * 5) + 1;
          this.dispatchEvent(new CustomEvent('tileSpawned', { detail: { row, col, type: this.board[row][col] } }));
        }
      }
    }
  }
  removeTilesInRadius(row, col, radius) {
    for (let r = Math.max(0, row - radius); r <= Math.min(this.height - 1, row + radius); r++) {
      for (let c = Math.max(0, col - radius); c <= Math.min(this.width - 1, col + radius); c++) {
        this.board[r][c] = null;
      }
    }
  }

  tap(row, col) {
    if (this.swapBonusActive) {
      if (!this.swapTile1) {
        this.swapTile1 = { row, col };
      } else {
        const row2 = this.swapTile1.row;
        const col2 = this.swapTile1.col;
        const temp = this.board[row][col];
        this.board[row][col] = this.board[row2][col2];
        this.board[row2][col2] = temp;
        this.swapTile1 = null;
        this.swapBonusActive = false;
        this.swapsRemaining--;
      }
    } else if (this.bombBonusActive) {
      this.removeTilesInRadius(row, col, this.bombRadius);
      this.removeTiles([]);
      this.bombBonusActive = false;
      this.bombsRemaining--;
    } else {
      const visited = new Set();
      const matches = this.findAdjacentMatches(row, col, visited);

      if (matches.length >= 2) {
        this.removeTiles(matches);

        if (matches.length >= this.bonusTileThreshold) {
          const bonusType = Math.random() < 0.5 ? 5 : 6;
          this.board[row][col] = bonusType;
        }
      }
    }
  }

  activateSwapBonus() {
    if (this.swapsRemaining > 0) {
      this.swapBonusActive = true;
    }
  }

  activateBombBonus() {
    if (this.bombsRemaining > 0) {
      this.bombBonusActive = true;
    }
  }
}

export default gameLogic;