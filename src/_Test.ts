import { matchmaker } from './Matchmaker';
import { matchmakerAnalyzer } from './MatchmakerAnalyzer';
import { MatchProcessingTicket } from './models/MatchProcessingTicket';
import { ratingUpdater } from './RatingUpdater';
import { Util } from './Util';

import { matchmakingModule } from './_MatchmakingModule';
import { AccountMatchmaking, MatchSearchTicket, MatchAssignment } from "./models/ExternalModels";
import { PlayerRatingCard } from './models/PlayerRatingCard';
import { EGameType, ERealm, ERace } from "./models/Enums";  

class Main {
    constructor() {
        console.log("\nPress ctrl + c to exit the application...\n")

        matchmakingModule.integrationTest(new AccountMatchmaking());
        // Main.example1v1RatingsUpdateSubmission();
        // Main.example4v4RatingsUpdateSubmission();
        // Main.submitRandomGameSearchTickets(10);//this is also called along with Main.updateMatchmaker. See the GameSearchTicket script for details on submission

        Main.submitRandomMatchSearchTicket(2); 


        matchmaker.on("soloMatchMade", (usernames: string[]) => {
            console.log(usernames[0] + " has been matched with " + usernames[1]);
        })
        matchmaker.on("twosMatchMade", (usernames: string[]) => {
            console.log(usernames[0] + " has been teamed with " + usernames[1] + " against " + usernames[2] + " and " + usernames[3] + " in a twos match");
        })
        matchmaker.on("foursMatchMade", (usernames: string[]) => {
            console.log(usernames[0] + " has been teamed with " + usernames[1] + ", " + usernames[2] + ", and " + usernames[3] + " in a fours match against " + usernames[4] + ", " + usernames[5] + ", " + usernames[6] + ", " + usernames[7]);
        })

        setInterval(() => {
            Main.updateMatchmaker()
        }, 1000); //when the console is not being used to example the workings of this module, this number should be smaller, maybe 100-200, primarily so that search cancels are processed quickly (and people are not matched for games nearly a second after they 'cancel' their search)

        setInterval(() => {
            Main.analyzeProcessedTickets()
        }, 5000); //when the console is not being used to example the workings of this module, this number can be called less often
    }

    private static updateMatchmaker(): void {
        //Main.submitRandomGameSearchTickets(Util.getRandomInteger(1, 10));
        matchmaker.processSearchTickets();
    }

    private static analyzeProcessedTickets(): void {
        var processedTickets = matchmaker.handOverProcessedTickets();
        matchmakerAnalyzer.addProcessTickets(processedTickets);
        matchmakerAnalyzer.analyzeProcessedTickets();
    }


    private static submitRandomMatchSearchTicket(count : number){
        for (let i = 0; i < count; i++) {
            let searchTicket : MatchSearchTicket = new MatchSearchTicket; 
            let account : AccountMatchmaking = new AccountMatchmaking;
            searchTicket.players.push(account);
            searchTicket.gameType = EGameType.solo; 
            searchTicket.realm = 3; 
            searchTicket.races.push (3);
            if (i==0){
                account.humRating = 1199; 
                account.orcRating = 1200;
                searchTicket.realm = 2; 
            }
            matchmaker.beginMatchSearch(searchTicket); 
            if (i==0){
                matchmaker.cancelMatchSearch([account]);
            }
        }
    }

    /*
    For the rating update submission, the bool indicates whether or not team 1 won.
    The order of the player rating cards indicates the teams:
    Solo: [team1, team2]
    Twos: [team1, team1, team2, team2]
    and so with 4s.
    See the PlayerRatingCard class in the Matchmaker script for details on that, but in short, it has a username and 3 rating parameters
    */
    private static example1v1RatingsUpdateSubmission() {
        let playerRatingCards = Main.createRandomPlayerRatingCards(2);
        var soloExampleUpdateSubmission = ratingUpdater.updateRating(playerRatingCards, true);
        console.log("UPDATED RATINGS FOR 1V1 (see username for original rating):");
        console.log(soloExampleUpdateSubmission);
    }

    private static example2v2RatingsUpdateSubmission() {
        let playerRatingCards = Main.createRandomPlayerRatingCards(4);
        var twosExampleUpdateSubmission = ratingUpdater.updateRating(playerRatingCards, false);
        console.log("UPDATED RATINGS FOR 2V2 (see username for original rating):");
        console.log(twosExampleUpdateSubmission);
    }

    private static example4v4RatingsUpdateSubmission() {
        let playerRatingCards = Main.createRandomPlayerRatingCards(8);
        var foursExampleUpdateSubmission = ratingUpdater.updateRating(playerRatingCards, true);
        console.log("UPDATED RATINGS FOR 4V4 (see username for original rating):");
        console.log(foursExampleUpdateSubmission);
        console.log(" ");
    }

    private static createRandomPlayerRatingCards(count: number) {
        let cards = [];
        for (let i = 0; i < count; i++) {
            let newCard = new PlayerRatingCard();
            newCard.rating = Util.getRandomInteger(1000, 2400);
            newCard.ratingUncertainty = Util.getRandomArbitrary(25, 250);
            newCard.ratingVolatility = Util.getRandomArbitrary(.04, .06);
            newCard.username = "testcard" + newCard.rating;
            cards.push(newCard);
        }
        return cards;
    }

    private static submitRandomGameSearchTickets(count: number): void { // fake username indicates elo and realm search and gametype
        for (let i = 0; i < count; i++) {

            let newTicket = new MatchProcessingTicket();

            let elo = Util.getRandomInteger(1000, 2400)
            newTicket.ratings[0] = elo;

            newTicket.gameType = 0;
            var randomInt = Util.getRandomInteger(0, 4);
            if (randomInt === 0) {
                newTicket.gameType |= EGameType.solo;
            }
            else if (randomInt === 1) {
                newTicket.gameType |= EGameType.twosRT;
            }
            else if (randomInt === 2) {
                var cutInHalf = Util.getRandomInteger(0, 2);//added to check numbers. since these tickets count for two people, i want half as many of them.
                if (cutInHalf === 1) {
                    return;
                }
                newTicket.gameType |= EGameType.twosAT;
            }
            else if (randomInt === 3) {
                newTicket.gameType |= EGameType.foursRT;
            }

            newTicket.realm = 0;
            if (Util.getRandomInteger(0, 2) > 0) {
                newTicket.realm |= ERealm.asia;
            }
            if (Util.getRandomInteger(0, 2) > 0) {
                newTicket.realm |= ERealm.eu;
            }
            if (Util.getRandomInteger(0, 2) > 0) {
                newTicket.realm |= ERealm.us;
            }
            if (newTicket.realm == 0) {//if not searching on any realms, serach on eu
                newTicket.realm |= ERealm.eu;
            }
            let realmIDs = "";
            realmIDs += (newTicket.realm & ERealm.asia) ? 'a' : 'x';
            realmIDs += (newTicket.realm & ERealm.eu) ? 'e' : 'x';
            realmIDs += (newTicket.realm & ERealm.us) ? 'u' : 'x';


            newTicket.account.username = "testUser" + elo + realmIDs + newTicket.gameType;//the fake (info rich) username
            if (newTicket.gameType === EGameType.twosAT) {
                newTicket.partner = "PARTNERof" + newTicket.account.username;// + Util.getRandomArbitrary(0, 99).toString;
            }

            //matchmaker.beginMatchSearch(newTicket);
        }
    }

}
export const main: Main = new Main();