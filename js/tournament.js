class Tournament {
    constructor(teams, preserveOrder = false) {
        this.originalTeams = teams;
        this.requiredTeams = nextPowerOfTwo(teams.length);
        this.rounds = Math.log2(this.requiredTeams);
        this.matches = this.generateTournamentStructure(preserveOrder);
    }

    generateTournamentStructure(preserveOrder = false) {
        // Tạo danh sách đội đầy đủ với các đội "bye"
        const byeTeams = generateByeTeams(this.originalTeams, this.requiredTeams);
        const allTeams = [...this.originalTeams, ...byeTeams];
        
        // Xáo trộn thứ tự các đội nếu không yêu cầu giữ nguyên thứ tự
        const finalTeams = preserveOrder ? allTeams : shuffleArray([...allTeams]);
        
        // Khởi tạo cấu trúc giải đấu
        const rounds = [];
        
        // Vòng đầu tiên
        const firstRound = [];
        for (let i = 0; i < finalTeams.length; i += 2) {
            const team1 = {
                name: finalTeams[i],
                score: 0,
                id: generateTeamId(generateMatchId(0, firstRound.length), 1),
                isBye: finalTeams[i].startsWith('Bye ')
            };
            
            const team2 = {
                name: finalTeams[i + 1],
                score: 0,
                id: generateTeamId(generateMatchId(0, firstRound.length), 2),
                isBye: finalTeams[i + 1].startsWith('Bye ')
            };

            // Nếu một trong hai đội là bye, đội còn lại tự động thắng
            let winner = null;
            if (team1.isBye && !team2.isBye) {
                winner = team2;
            } else if (!team1.isBye && team2.isBye) {
                winner = team1;
            }

            firstRound.push({
                id: generateMatchId(0, firstRound.length),
                team1,
                team2,
                winner
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

            // Cập nhật các trận có đội thắng từ vòng trước do có bye
            for (let i = 0; i < previousRound.length; i += 2) {
                const match1 = previousRound[i];
                const match2 = previousRound[i + 1];
                const nextMatch = currentRound[Math.floor(i / 2)];

                if (match1.winner) {
                    nextMatch.team1 = {
                        name: match1.winner.name,
                        score: 0,
                        id: generateTeamId(nextMatch.id, 1),
                        isBye: match1.winner.isBye
                    };
                }
                if (match2.winner) {
                    nextMatch.team2 = {
                        name: match2.winner.name,
                        score: 0,
                        id: generateTeamId(nextMatch.id, 2),
                        isBye: match2.winner.isBye
                    };
                }
            }
        }

        return rounds;
    }

    updateMatch(roundIndex, matchIndex, winnerTeam, team1Score, team2Score) {
        const match = this.matches[roundIndex][matchIndex];
        
        // Không cho phép chọn đội bye làm đội thắng
        if (winnerTeam.isBye) {
            return;
        }

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
                    id: generateTeamId(nextRoundMatch.id, 1),
                    isBye: winnerTeam.isBye
                };
            } else {
                nextRoundMatch.team2 = {
                    name: winnerTeam.name,
                    score: 0,
                    id: generateTeamId(nextRoundMatch.id, 2),
                    isBye: winnerTeam.isBye
                };
            }
        }
    }

    toJSON() {
        return {
            originalTeams: this.originalTeams,
            matches: this.matches
        };
    }

    static fromJSON(data) {
        const tournament = new Tournament(data.originalTeams, true);
        tournament.matches = data.matches;
        return tournament;
    }
} 