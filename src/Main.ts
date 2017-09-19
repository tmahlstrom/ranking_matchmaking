import { matchMaker } from './Matchmaker';
import { matchMakerAnalyzer } from './MatchmakerAnalyzer';
import { GameSearchTicket, ERealm, EGameType } from './GameSearchTicket';
import { Util } from './Util';

class Main {
    constructor() {
        console.log("\nPress ctrl + c to exit the application...\n")
        
        matchMaker.on("soloMatchMade", (ticket1: GameSearchTicket, ticket2: GameSearchTicket)=> {
            console.log(ticket1.username + " has been matched with " + ticket2.username);
        })
        matchMaker.on("twosMatchMade", (twosTickets: GameSearchTicket[])=> {
            var ally1; 
            if (twosTickets[0] === twosTickets[1]){
                ally1 = twosTickets[0].partner;
            } else {
                ally1 = twosTickets[1].username;
            }
            var ally2; 
            if (twosTickets[2] === twosTickets[3]){
                ally2 = twosTickets[2].partner;
            } else {
                ally2 = twosTickets[3].username;
            }
            console.log(twosTickets[0].username + " has been teamed with " + ally1 + " against " + twosTickets[2].username + " and " + ally2 + " in a twos match");
        })

        matchMaker.on("foursMatchMade", (foursTickets: GameSearchTicket[])=> {
            console.log(foursTickets[0].username + " has been teamed with " + foursTickets[1].username + ", " + foursTickets[2].username + ", and " + foursTickets[3].username + " in a fours match against " + foursTickets[4].username + ", " + foursTickets[5].username + ", " + foursTickets[6].username + ", " + foursTickets[7].username);
        })

        setInterval(() => {
            Main.updateMatchMaker()
        }, 100);

        setInterval(() => {
            Main.analyzeProcessedTickets()
        }, 500);
    }

    private static updateMatchMaker(): void {
        matchMaker.processSearchTickets();
        Main.CreateRandomTestTickets(Util.getRandomArbitrary(1, 3));
    }

    private static analyzeProcessedTickets(): void {
        var processedTickets = matchMaker.handOverProcessedTickets();
        matchMakerAnalyzer.addProcessTickets(processedTickets);
        matchMakerAnalyzer.analyzeProcessedTickets();
    }

    private static CreateRandomTestTickets(count: number): void { // fake username indicates elo and realm search and gametype
        for (let i = 0; i < count; i++) {

            let newTicket = new GameSearchTicket();

            let elo = Util.getRandomArbitrary(1000, 2400)
            newTicket.elo = elo;

            newTicket.gameType = 0; 
            var randomInt = Util.getRandomArbitrary(0, 4);
            if (randomInt === 0) {
                newTicket.gameType |= EGameType.solo;
            }
            else if (randomInt === 1) {
                newTicket.gameType |= EGameType.twoRT;
            }
            else if (randomInt === 2) {
                var cutInHalf = Util.getRandomArbitrary(0, 2);//added to check numbers. since these tickets count for two people, i want half as many of them.
                if (cutInHalf === 1){
                    return;
                }
                newTicket.gameType |= EGameType.twoAT;
            }
            else if (randomInt === 3) {
                newTicket.gameType |= EGameType.fourRT;
            }

            newTicket.realmSearch = 0;
            if (Util.getRandomArbitrary(0, 2) > 0) {
                newTicket.realmSearch |= ERealm.asia;
            }
            if (Util.getRandomArbitrary(0, 2) > 0) {
                newTicket.realmSearch |= ERealm.eu;
            }
            if (Util.getRandomArbitrary(0, 2) > 0) {
                newTicket.realmSearch |= ERealm.us;
            }
            if (newTicket.realmSearch == 0){//if not searching on any realms, serach on eu
                newTicket.realmSearch |= ERealm.eu;
            }
            let realmIDs = "";
            realmIDs += (newTicket.realmSearch & ERealm.asia) ? 'a' : 'x';
            realmIDs += (newTicket.realmSearch & ERealm.eu) ? 'e' : 'x';
            realmIDs += (newTicket.realmSearch & ERealm.us) ? 'u' : 'x';


            newTicket.username = "testUser" + elo + realmIDs + newTicket.gameType;//the fake (info rich) username
            if (newTicket.gameType === EGameType.twoAT){
                newTicket.partner = "PARTNERof" + newTicket.username;// + Util.getRandomArbitrary(0, 99).toString;
            }

            matchMaker.beginGameSearch(newTicket);
        }
    }

}
export const main:Main = new Main();