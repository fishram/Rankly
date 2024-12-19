"use client";

import Link from "next/link";
import { useFetchPlayers } from "../hooks/useFetchPlayers";
import { useState } from "react";
import { Player } from "../types/player";

export default function Page() {
  const { players, loading, error } = useFetchPlayers();
  const [player1, setPlayer1] = useState("Player 1");
  const [player2, setPlayer2] = useState("Player 2");
  const [dropdown1Open, setDropdown1Open] = useState(false);
  const [dropdown2Open, setDropdown2Open] = useState(false);

  const findPlayerByName = (players: Player[], name: string): Player | undefined => {
    return players.find(player => player.name === name);
  };

  if (loading) {
    return <></>;
  }

  if (error) {
    return (
      <div className="container mx-auto py-4 px-32 mt-10">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 px-56 mt-10">
      <div className="flex flex-col items-center justify-center">
      <div className="flex flex-row p-3 items-center justify-between mb-8 mx-16">
        <h1 className="text-3xl font-bold mr-64">Matches</h1>
        <Link href="./" className="btn btn-outline mr-5 px-7">
          Back
        </Link>
      </div>
      <div className="flex flex-col items-center justify-center">
      <div className="flex flex-row px-64 items-center justify-center space-x-12">
        <div className={`dropdown ${player1 === "Player 1" ? "dropdown-hover" : ""}`}>
          <div 
            tabIndex={0} 
            role="button" 
            className={`btn m-1 w-40 text-lg truncate ${player1 !== "Player 1" ? "btn-primary" : ""}`}
          >
            {player1}
          </div>
          <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
            {players.map((player) => (
              <li key={player.id}>
                <a onClick={() => setPlayer1(player.name)}>
                  {player.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className={`dropdown ${player2 === "Player 2" ? "dropdown-hover" : ""}`}>
          <div 
            tabIndex={0} 
            role="button" 
            className={`btn m-1 w-40 text-lg truncate ${player2 !== "Player 2" ? "btn-secondary" : ""}`}
          >
            {player2}
          </div>
          <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
            {players.map((player) => (
              <li key={player.id}>
                <a onClick={() => setPlayer2(player.name)}>
                  {player.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      </div>
      <div className="flex flex-row items-center justify-center mt-1">
        <div className="text-center w-52">
          {player1 !== "Player 1" && (
            <div className="text-2xl mt-2">
              {findPlayerByName(players, player1)?.eloScore || 'N/A'}
            </div>
          )}
        </div>
        <div className="text-center w-52">
          {player2 !== "Player 2" && (
            <div className="text-2xl mt-2">
              {findPlayerByName(players, player2)?.eloScore || 'N/A'}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
