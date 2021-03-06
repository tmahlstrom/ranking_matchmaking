import { PlayerRatingCard } from "./models/PlayerRatingCard";

// Updates player ratings in response to a win/loss

var glicko2 = require('./glicko2');

var settings = {
    tau: 0.5,
    //tau: the larger this paramter, the quicker the volatility (vol below) will change. it should be somewhere between .3 and 1.2
    //it's an interesting parameter, the value for which depends on the kind of game. the more luck involved, the smaller this should be. 
    rating: 1500, //default rating
    rd: 250, //the smaller this is, the more confident the system is about the rating assignment
    vol: 0.06
    //vol: how volatile the players performance is
    //e.g., someone may have a 1500 rating by always beating <1500 players and losing to >1500 players. they would have low vol
    //someone else might always beat 1600 players and lose to 1400 players. they may also have a 1500 rating (even with a low rd) but a higher vol
};
var ratingSystem = new glicko2.Glicko2(settings);

export class RatingUpdater {

    public updateRating(playerRatingCards: PlayerRatingCard[], team1Won: boolean) {

        ratingSystem.removePlayers();

        let teams = this.establishTeams(playerRatingCards);
        let teamAverageCards = this.makeTeamAverageCards(teams);

        let players = this.makePlayers(playerRatingCards);
        let teamAverageFakePlayers = this.makePlayers(teamAverageCards);

        let matches = this.makeMatches(players, teamAverageFakePlayers, team1Won);
        ratingSystem.updateRatings(matches);

        playerRatingCards = this.rewritePlayerRatingCards(playerRatingCards, players);

        return (playerRatingCards);
    }

    private establishTeams(cards: PlayerRatingCard[]) {
        let teamSize = cards.length / 2;
        let team1 = [];
        let team2 = [];
        for (let i = 0; i < cards.length; i++) {
            if (i < teamSize) {
                team1.push(cards[i]);
            } else {
                team2.push(cards[i]);
            }
        }
        return [team1, team2];
    }

    private makeTeamAverageCards(teams: PlayerRatingCard[][]) {
        let teamAverageCards: PlayerRatingCard[] = new Array(teams.length);
        for (let i = 0; i < teams.length; i++) {
            if (teams[i].length >= 1) {
                teamAverageCards[i] = this.createAverageCard(teams[i]);
            }
        }
        return teamAverageCards;
    }

    private createAverageCard(cards: PlayerRatingCard[]) {
        var averageRatingCard = new PlayerRatingCard;
        averageRatingCard.rating = 0;
        averageRatingCard.ratingUncertainty = 0; 
        averageRatingCard.ratingVolatility = 0; 
        for (let card of cards) {
            averageRatingCard.rating += card.rating;
            averageRatingCard.ratingUncertainty += card.ratingUncertainty;
            averageRatingCard.ratingVolatility += card.ratingVolatility;
        }
        averageRatingCard.rating = averageRatingCard.rating / cards.length;
        averageRatingCard.ratingUncertainty = averageRatingCard.ratingUncertainty / cards.length;
        averageRatingCard.ratingVolatility = averageRatingCard.ratingVolatility / cards.length;
        return averageRatingCard;
    }

    private makePlayers(cards: PlayerRatingCard[]) {
        let players = new Array(cards.length);
        for (let i = 0; i < cards.length; i++) {
            players[i] = ratingSystem.makePlayer(cards[i].rating, cards[i].ratingUncertainty, cards[i].ratingVolatility);
        }
        return players;
    }

    private makeMatches(players: any[], teamAverageFakePlayers: any[], team1Won: boolean) {
        var matches = new Array(players.length);
        for (let i = 0; i < players.length; i++) {
            if (i < (players.length / 2)) {
                matches[i] = [players[i], teamAverageFakePlayers[1], team1Won];
            } else {
                matches[i] = [players[i], teamAverageFakePlayers[0], !team1Won];
            }
        }
        return matches;
    }

    private rewritePlayerRatingCards(playerCards: PlayerRatingCard[], players: any[]) {
        for (let i = 0; i < playerCards.length; i++) {
            playerCards[i] = this.reWriteCard(playerCards[i], players[i].getAllRatingNumbers());
        }
        return playerCards;
        // playerRatingCards[0] = this.reWriteCard(playerRatingCards[0], players[0].getAllRatingNumbers());
        // playerRatingCards[1] = this.reWriteCard(playerRatingCards[1], players[1].getAllRatingNumbers());
    }

    private reWriteCard(playerCard: PlayerRatingCard, ratingNumbers: number[]) {
        playerCard.rating = ratingNumbers[0];
        playerCard.ratingUncertainty = ratingNumbers[1];
        playerCard.ratingVolatility = ratingNumbers[2];
        return (playerCard);
    }
}

export var ratingUpdater: RatingUpdater = new RatingUpdater();