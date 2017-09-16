import { matchMaker } from './Matchmaker';
import { GameSearchTicket, ERealm } from './GameSearchTicket';
import { Util } from './Util';

class Main {
    constructor() {
        console.log("\nPress ctrl + c to exit the application...\n")
        
        matchMaker.on("matched", (ticket1: GameSearchTicket, ticket2: GameSearchTicket)=> {
            console.log(ticket1.username + " has been matched with " + ticket2.username);
        })

        setInterval(() => {
            Main.updateMatchMaker()
        }, 10);
    }

    private static updateMatchMaker(): void {
        matchMaker.processSearchTickets();
        Main.CreateRandomTestTickets(Util.getRandomArbitrary(1, 3));
    }

    private static CreateRandomTestTickets(count: number): void { //username indicates elo and realm search
        for (let i = 0; i < count; i++) {

            let newTicket = new GameSearchTicket();

            let elo = Util.getRandomArbitrary(1000, 2400)
            newTicket.elo = elo;
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

            newTicket.username = "testUser" + elo + realmIDs;//the username

            matchMaker.beginSoloGameSearch(newTicket);
        }
    }
}
export const main:Main = new Main();