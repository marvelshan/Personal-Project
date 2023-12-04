import * as model from '../model/odds.js';
import { client } from '../utils/cache.js';

const oddCalculator = async (req, res, next) => {
  const { id } = req.body;
  const checkGame = JSON.parse(await client.get(`game${id}`));
  if (parseInt(checkGame.period, 10) !== 4) {
    return res
      .status(404)
      .json({ success: false, message: 'Game is not fininshed yet' });
  }
  const gameInformation = await model.getNBAGame(id);
  const getHomeTeamRank = await model.getNBAStandings(
    gameInformation.home_team_id,
  );
  const getAwayTeamRank = await model.getNBAStandings(
    gameInformation.away_team_id,
  );
  const homeWinningRate =
    (parseInt(getHomeTeamRank[0].win, 10) +
      parseInt(getAwayTeamRank[0].lose, 10)) /
    164;
  const home_odds = (1 / homeWinningRate - 0.3).toFixed(2);
  const away_odds = (1 / (1 - homeWinningRate) - 0.3).toFixed(2);
  const moneyBuffer = 1000;
  const gameInitialOdds = {
    id,
    home_odds,
    away_odds,
    moneyBuffer,
  };
  await client.set(`odds${id}`, JSON.stringify(gameInitialOdds));
  await model.updateOdds(id, home_odds, away_odds, moneyBuffer);
  next();
};

export default oddCalculator;
