import { MatchAssignment } from "./models/ExternalModels";

// Stores a list of all matches played (will want to purge this every so often).

class MatchAssignmentDatabase {
    private matchArray : MatchAssignment[] = new Array; 
    private matchCount: number = 0; 

    public registerMatch (match : MatchAssignment){
        this.matchArray.push(match); 
        this.matchCount +=1; 
        return this.matchCount; 
    }



}
export const matchAssignmentDatabase : MatchAssignmentDatabase = new MatchAssignmentDatabase; 