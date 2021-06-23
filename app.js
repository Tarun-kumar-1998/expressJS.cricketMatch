const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());
const databasePath = path.join(__dirname, "cricketMatchDetails.db");
let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertPlayerDetails = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};
const convertMatchDetails = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};
const convertPlayerMatchScore = (dbObject) => {
  return {
    playerMatchId: dbObject.player_match_id,
    playerId: dbObject.player_id,
    matchId: dbObject.match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};

app.get("/players/", async (request, response) => {
  const playerquery = `
      SELECT
        *
      FROM
      player_details;`;
  const players = await database.all(playerquery);
  response.send(players.map((a) => convertPlayerDetails(a)));
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getplayerquery = `
    SELECT *
    FROM player_details
    WHERE
    player_id = ${playerId};`;
  const player = await database.get(getplayerquery);
  response.send(convertPlayerDetails(player));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updateQuery = `
    UPDATE
    player_details
    SET 
      player_name = ${playerName}
      WHERE
        player_id = ${playerId};`;
  await database.run(updateQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getmatchQuery = `
    SELECT *
    FROM
    match_details
    WHERE
    match_id = ${matchId};`;
  const match = await database.get(getmatchQuery);
  response.send(convertMatchDetails(match));
});

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getmatchDetailsQuery = `
    SELECT
      match_id, match, year
    FROM 
      player_match_score
      NATURAL JOIN match_details
    WHERE
      player_id = ${playerId};`;
  const getmatchdetails = await database.all(getmatchDetailsQuery);
  response.send(getmatchdetails.map((a) => convertPlayerMatchScore(a)));
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getplayerQuery = `
    SELECT
      *
    FROM match_details
    NATURAL JOIN player_details
    WHERE 
      match_id = ${matchId};`;
  const players = await database.all(getplayerQuery);
  response.send(getplayerQuery.map((a) => convertPlayerDetails(a)));
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const playerId = request.params;
  const getdetails = `
    SELECT 
      player_id AS playerId, player_name AS playerName, SUM(score) as totalScore, SUM(fours) AS totalFours, SUM(sixes) AS totalSixes
    FROM 
      player_match_score NATURAL JOIN player_details
    WHERE
      player_id = ${playerId};`;
  const details = await database.all(getdetails);
  reponse.send(details);
});

module.exports = app;
