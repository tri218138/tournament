class Tournament {
    constructor(teams) {
        this.originalTeams = teams;
        this.requiredTeams = nextPowerOfTwo(teams.length);
        this.rounds = Math.log2(this.requiredTeams);
        this.matches = this.generateTournamentStructure();
    }

    generateTournamentStructure() {
        // Tạo danh sách đội đầy đủ với các đội "bye"
        const byeTeams = generateByeTeams(this.originalTeams, this.requiredTeams);
        const allTeams = [...this.originalTeams, ...byeTeams];
        
        // Xáo trộn thứ tự các đội
        const shuffledTeams = shuffleArray([...allTeams]);
        
        // Khởi tạo cấu trúc giải đấu
        const rounds = [];
        
        // Vòng đầu tiên
        const firstRound = [];
        for (let i = 0; i < shuffledTeams.length; i += 2) {
            firstRound.push({
                id: generateMatchId(0, firstRound.length),
                team1: {
                    name: shuffledTeams[i],
                    score: 0,
                    id: generateTeamId(generateMatchId(0, firstRound.length), 1)
                },
                team2: {
                    name: shuffledTeams[i + 1],
                    score: 0,
                    id: generateTeamId(generateMatchId(0, firstRound.length), 2)
                },
                winner: null
            });
        }
        rounds.push(firstRound);

        // Các vòng tiếp theo
        for (let round = 1; round < this.rounds; round++) {
            const currentRound = [];
            const previousRound = rounds[round - 1];
            
            for (let i = 0; i < previousRound.length; i += 2) {
                currentRound.push({
                    id: generateMatchId(round, currentRound.length),
                    team1: { name: null, score: 0, id: generateTeamId(generateMatchId(round, currentRound.length), 1) },
                    team2: { name: null, score: 0, id: generateTeamId(generateMatchId(round, currentRound.length), 2) },
                    winner: null
                });
            }
            rounds.push(currentRound);
        }

        return rounds;
    }

    updateMatch(roundIndex, matchIndex, winnerTeam, team1Score, team2Score) {
        const match = this.matches[roundIndex][matchIndex];
        match.team1.score = team1Score;
        match.team2.score = team2Score;
        match.winner = winnerTeam;

        // Cập nhật trận đấu tiếp theo nếu không phải vòng cuối
        if (roundIndex < this.rounds - 1) {
            const nextRoundMatch = this.matches[roundIndex + 1][Math.floor(matchIndex / 2)];
            const isFirstTeam = matchIndex % 2 === 0;
            
            if (isFirstTeam) {
                nextRoundMatch.team1 = {
                    name: winnerTeam.name,
                    score: 0,
                    id: generateTeamId(nextRoundMatch.id, 1)
                };
            } else {
                nextRoundMatch.team2 = {
                    name: winnerTeam.name,
                    score: 0,
                    id: generateTeamId(nextRoundMatch.id, 2)
                };
            }
        }
    }
} 