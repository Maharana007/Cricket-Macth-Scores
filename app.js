const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();

app.use(express.json());

let db = null;
const initializer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3010, () =>
      console.log("Sever is running at http://localhost:3010/")
    );
  } catch (e) {
    console.log(`DB error${e.message}`);
    process.exit(1);
  }
};
initializer();

const convertPlayerDetails = (item) => {
  return {
    playerId: item.player_id,
    playerName: item.player_name,
  };
};
const convertMatchDetails = (item) => {
  return {
    matchId: item.match_id,
    match: item.match,
    year: item.year,
  };
};
const convertPlayerMatchScore = (item) => {
  return {
    playerMatchId: item.player_match_id,
    playerId: item.player_id,
    matchId: item.match_id,
    score: item.score,
    fours: item.fours,
    sixes: item.sixes,
  };
};
/// APP 1 get /players/
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `SELECT * FROM player_details`;
  const playersList = await db.all(getPlayersQuery);
  response.send(playersList.map((each) => convertPlayerDetails(each)));
});

/// API 2 GET PLAYER BY ID /players/:playerId/
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayersQuery = `
  SELECT * FROM player_details WHERE player_id=${playerId}`;
  const playersList = await db.get(getPlayersQuery);
  response.send(convertPlayerDetails(playersList));
});

/// API 3 update details

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updateDbQuery = `UPDATE player_details
  SET player_name='${playerName}' WHERE player_id = ${playerId}`;
  await db.run(updateDbQuery);
  response.send("Player Details Updated");
});

/// API 4 get math details by id

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetails = `SELECT * FROM match_details WHERE match_id = ${matchId}`;
  const matchDetailResponse = await db.get(getMatchDetails);
  response.send(convertMatchDetails(matchDetailResponse));
});

/// API 5 matches by player id

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchByPlayerQuery = `SELECT * FROM 
    match_details NATURAL JOIN player_match_score WHERE player_id = ${playerId}`;
  const matchResponse = await db.all(getMatchByPlayerQuery);
  response.send(matchResponse.map((match) => convertMatchDetails(match)));
});

//// API 6 PLAYER BY MATCH ID

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerQuery = `
  SELECT player_details.player_id AS playerId, 
          player_details.player_name AS playerName
  FROM  
    player_details NATURAL JOIN player_match_score WHERE match_id = ${matchId}`;
  const playerResponse = await db.all(getPlayerQuery);
  response.send(playerResponse);
  //response.send(playerResponse.map((match) => convertPlayerDetails(match)));
});

/// API 7 get player scores

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScores = `SELECT
     player_details.player_id AS playerId, 
     player_details.player_name AS playerName,
     SUM(score) AS totalScore, 
     SUM(fours) AS totalFours, 
     SUM(sixes) AS totalSixes 
  FROM  player_details NATURAL JOIN player_match_score 
     WHERE player_id = ${playerId}`;
  const playerScores = await db.get(getPlayerScores);
  response.send(playerScores);
});

module.exports = app;
