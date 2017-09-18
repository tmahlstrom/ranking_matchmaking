import { GameSearchTicket } from './GameSearchTicket';
import { matchMaker } from './Matchmaker';


class MatchMakerAnalyzer{

    private allProcessedTickets: Array<GameSearchTicket> = new Array<GameSearchTicket>();
    

    public analyzeProcessedTickets(tickets: GameSearchTicket[]): void {
        this.allProcessedTickets = this.allProcessedTickets.concat(tickets); 
        var waitSum: number = 0;
        for (let ticket of this.allProcessedTickets) {
            waitSum += ticket.hadToWaitTime;
        }
        var averageWait: number = (waitSum / this.allProcessedTickets.length);
        if (averageWait > 0){
            console.log("\n" + this.allProcessedTickets.length + " games initiated\nAVERAGE WAIT TIME: " + averageWait + "\n");
        }
    }
}
export var matchMakerAnalyzer: MatchMakerAnalyzer = new MatchMakerAnalyzer();