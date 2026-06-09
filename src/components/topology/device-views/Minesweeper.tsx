"use client";
import { useState, useEffect } from "react";

const ROWS = 8;
const COLS = 8;
const MINES = 10;

type Cell = {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
};

export default function Minesweeper() {
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);

  useEffect(() => {
    initGame();
  }, []);

  const initGame = () => {
    const newGrid: Cell[][] = Array(ROWS).fill(null).map(() => 
      Array(COLS).fill(null).map(() => ({
        isMine: false, isRevealed: false, isFlagged: false, neighborMines: 0
      }))
    );
    let minesPlaced = 0;
    while(minesPlaced < MINES) {
      const r = Math.floor(Math.random() * ROWS);
      const c = Math.floor(Math.random() * COLS);
      if(!newGrid[r][c].isMine) {
        newGrid[r][c].isMine = true;
        minesPlaced++;
      }
    }
    for(let r=0; r<ROWS; r++) {
      for(let c=0; c<COLS; c++) {
        if(!newGrid[r][c].isMine) {
          let count = 0;
          for(let i=-1; i<=1; i++) {
            for(let j=-1; j<=1; j++) {
              if(r+i >= 0 && r+i < ROWS && c+j >= 0 && c+j < COLS && newGrid[r+i][c+j].isMine) count++;
            }
          }
          newGrid[r][c].neighborMines = count;
        }
      }
    }
    setGrid(newGrid);
    setGameOver(false);
    setWin(false);
  };

  const reveal = (r: number, c: number) => {
    if(gameOver || win || grid[r][c].isRevealed || grid[r][c].isFlagged) return;
    const newGrid = [...grid.map(row => [...row])];
    if(newGrid[r][c].isMine) {
      setGameOver(true);
      newGrid.forEach(row => row.forEach(cell => { if(cell.isMine) cell.isRevealed = true; }));
    } else {
      const queue = [[r,c]];
      while(queue.length > 0) {
        const [currR, currC] = queue.shift()!;
        if(!newGrid[currR][currC].isRevealed) {
          newGrid[currR][currC].isRevealed = true;
          if(newGrid[currR][currC].neighborMines === 0) {
            for(let i=-1; i<=1; i++) {
              for(let j=-1; j<=1; j++) {
                if(currR+i >= 0 && currR+i < ROWS && currC+j >= 0 && currC+j < COLS && !newGrid[currR+i][currC+j].isRevealed) {
                  queue.push([currR+i, currC+j]);
                }
              }
            }
          }
        }
      }
    }
    setGrid(newGrid);
    
    // Check win
    if(!newGrid[r][c].isMine) {
      let unrevealedSafe = 0;
      newGrid.forEach(row => row.forEach(cell => { if(!cell.isMine && !cell.isRevealed) unrevealedSafe++; }));
      if(unrevealedSafe === 0) setWin(true);
    }
  };

  const toggleFlag = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if(gameOver || win || grid[r][c].isRevealed) return;
    const newGrid = [...grid.map(row => [...row])];
    newGrid[r][c].isFlagged = !newGrid[r][c].isFlagged;
    setGrid(newGrid);
  };

  if(!grid.length) return null;

  return (
    <div style={{ background: "#c0c0c0", padding: "10px", border: "2px solid #fff", borderBottomColor: "#808080", borderRightColor: "#808080", display: "inline-block" }}>
      <div style={{ background: "#c0c0c0", border: "2px solid #808080", borderBottomColor: "#fff", borderRightColor: "#fff", padding: "5px", marginBottom: "10px", textAlign: "center", fontSize: "1.5rem", cursor: "pointer" }} onClick={initGame}>
        {win ? "😎" : gameOver ? "😵" : "🙂"}
      </div>
      <div style={{ border: "2px solid #808080", borderBottomColor: "#fff", borderRightColor: "#fff" }}>
        {grid.map((row, r) => (
          <div key={r} style={{ display: "flex" }}>
            {row.map((cell, c) => (
              <div 
                key={c} 
                onClick={() => reveal(r, c)}
                onContextMenu={(e) => toggleFlag(e, r, c)}
                style={{ 
                  width: 20, height: 20, 
                  background: cell.isRevealed ? "#c0c0c0" : "#c0c0c0", 
                  border: cell.isRevealed ? "1px solid #808080" : "2px solid #fff",
                  borderBottomColor: cell.isRevealed ? "#808080" : "#808080",
                  borderRightColor: cell.isRevealed ? "#808080" : "#808080",
                  display: "flex", justifyContent: "center", alignItems: "center",
                  fontSize: "12px", fontWeight: "bold",
                  color: cell.neighborMines === 1 ? "blue" : cell.neighborMines === 2 ? "green" : cell.neighborMines === 3 ? "red" : cell.neighborMines === 4 ? "darkblue" : "#000"
                }}>
                {cell.isRevealed ? (cell.isMine ? "💣" : cell.neighborMines > 0 ? cell.neighborMines : "") : (cell.isFlagged ? "🚩" : "")}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
