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
            console.log(twosTickets[0].username + " has been teamed with " + twosTickets[1].username + " against " + twosTickets[2].username + " and " + twosTickets[3].username + " in a twos match");
        })

        matchMaker.on("foursMatchMade", (foursTickets: GameSearchTicket[])=> {
            console.log(foursTickets[0].username + " has been teamed with " + foursTickets[1].username + ", " + foursTickets[2].username + ", and " + foursTickets[3].username + " in a fours match against " + foursTickets[4].username + ", " + foursTickets[5].username + ", " + foursTickets[6].username + ", " + foursTickets[7].username);
        })

        setInterval(() => {
            Main.updateMatchMaker()
        }, 1000);

        setInterval(() => {
            Main.analyzeProcessedTickets()
        }, 5000);
    }

    private static updateMatchMaker(): void {
        matchMaker.processSearchTickets();
        Main.CreateRandomTestTickets(Util.getRandomArbitrary(1, 3));
    }

    private static analyzeProcessedTickets(): void {
        var processedTickets = matchMaker.handOverProcessedTickets();
        matchMakerAnalyzer.analyzeProcessedTickets(processedTickets);
    }

    private static CreateRandomTestTickets(count: number): void { //username indicates elo and realm search
        for (let i = 0; i < count; i++) {

            let newTicket = new GameSearchTicket();

            let elo = Util.getRandomArbitrary(1000, 2400)
            newTicket.elo = elo;

            newTicket.gameType = 0; 
            if (Util.getRandomArbitrary(0, 3) > 1) {
                newTicket.gameType |= EGameType.solo;
            } else if (Util.getRandomArbitrary(0, 3) > 1) {
                newTicket.gameType |= EGameType.twoRT;
            } else if (Util.getRandomArbitrary(0, 3) > 1) {
                newTicket.gameType |= EGameType.twoAT;
            } else {
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


            newTicket.username = "testUser" + elo + realmIDs + newTicket.gameType;//the username

            matchMaker.beginGameSearch(newTicket);
        }
    }

}
export const main:Main = new Main();