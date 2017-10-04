import { MatchProcessingTicket } from './models/MatchProcessingTicket';
import { matchmaker } from './Matchmaker';


class MatchmakerAnalyzer {

    private allProcessedTickets: Array<MatchProcessingTicket> = new Array<MatchProcessingTicket>();

    public addProcessTickets(tickets: MatchProcessingTicket[]): void {
        this.allProcessedTickets = this.allProcessedTickets.concat(tickets);
    }

    public analyzeProcessedTickets() {
        var onesTickets = this.allProcessedTickets.filter((ticket) => ticket.gameType == 1);
        var twosRTTickets = this.allProcessedTickets.filter((ticket) => ticket.gameType == 2);
        var twosATTickets = this.allProcessedTickets.filter((ticket) => ticket.gameType == 3);
        var foursTickets = this.allProcessedTickets.filter((ticket) => ticket.gameType == 4);

        var waitSum1: number = 0;
        for (let ticket of onesTickets) {
            waitSum1 += ticket.hadToWaitTime;
        }
        var waitSum2RT: number = 0;
        for (let ticket of twosRTTickets) {
            waitSum2RT += ticket.hadToWaitTime;
        }
        var waitSum2AT: number = 0;
        for (let ticket of twosATTickets) {
            waitSum2AT += ticket.hadToWaitTime;
        }
        var waitSum4: number = 0;
        for (let ticket of foursTickets) {
            waitSum4 += ticket.hadToWaitTime;
        }
        var averageWait1: number = (waitSum1 / onesTickets.length);
        var averageWait2RT: number = (waitSum2RT / twosRTTickets.length);
        var averageWait2AT: number = (waitSum2AT / twosATTickets.length);
        var averageWait4: number = (waitSum4 / foursTickets.length);
        if (averageWait1 > 0) {
            console.log("\n" + onesTickets.length / 2 + " solo games initiated\nAVERAGE WAIT TIME: " + averageWait1.toFixed(1) + "\n");
        }
        if (averageWait2RT > 0) {
            console.log("\n" + (twosRTTickets.length + twosATTickets.length * 2) / 4 + " 2v2 games initiated\nAVERAGE WAIT TIME: " + averageWait2RT.toFixed(1) + "\n");
        }
        if (averageWait2AT > 0) {
            console.log("\n" + twosATTickets.length + " 2v2AT pairs enetered a game\nAVERAGE WAIT TIME: " + averageWait2AT.toFixed(1) + "\n");
        }
        if (averageWait4 > 0) {
            console.log("\n" + foursTickets.length / 8 + " 4v4 games initiated\nAVERAGE WAIT TIME: " + averageWait4.toFixed(1) + "\n");
        }
    }
}
export var matchmakerAnalyzer: MatchmakerAnalyzer = new MatchmakerAnalyzer();
