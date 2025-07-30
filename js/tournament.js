class Tournament {
    constructor(teams, preserveOrder = false, savedMatches = null) {
        this.originalTeams = teams;
        this.requiredTeams = nextPowerOfTwo(teams.length);
        this.rounds = Math.log2(this.requiredTeams);
        
        if (savedMatches) {
            // Khôi phục trạng thái từ dữ liệu đã lưu
            this.matches = this.restoreMatches(savedMatches);
        } else {
            // Tạo mới cấu trúc giải đấu
            this.matches = this.generateTournamentStructure(preserveOrder);
        }
    }

    restoreMatches(savedMatches) {
        // Khôi phục ID và trạng thái cho mỗi trận đấu
        return savedMatches.map((round, roundIndex) => {
            return round.map((match, matchIndex) => {
                const restoredMatch = {
                    id: match.id || generateMatchId(roundIndex, matchIndex),
                    team1: this.restoreTeam(match.team1, roundIndex, matchIndex, 1),
                    team2: this.restoreTeam(match.team2, roundIndex, matchIndex, 2),
                    winner: null
                };

                // Khôi phục đội thắng nếu có
                if (match.winner) {
                    restoredMatch.winner = restoredMatch.team1.id === match.winner.id 
                        ? restoredMatch.team1 
                        : restoredMatch.team2;
                }

                return restoredMatch;
            });
        });
    }

    restoreTeam(team, roundIndex, matchIndex, teamNumber) {
        if (!team || !team.name) {
            return {
                name: null,
                score: 0,
                id: generateTeamId(generateMatchId(roundIndex, matchIndex), teamNumber)
            };
        }

        return {
            name: team.name,
            score: team.score || 0,
            id: team.id || generateTeamId(generateMatchId(roundIndex, matchIndex), teamNumber),
            isBye: team.isBye || team.name.startsWith('Bye ')
        };
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
            requiredTeams: this.requiredTeams,
            rounds: this.rounds,
            matches: this.matches.map(round => 
                round.map(match => ({
                    id: match.id,
                    team1: {
                        name: match.team1.name,
                        score: match.team1.score || 0,
                        id: match.team1.id,
                        isBye: match.team1.isBye || false
                    },
                    team2: {
                        name: match.team2.name,
                        score: match.team2.score || 0,
                        id: match.team2.id,
                        isBye: match.team2.isBye || false
                    },
                    winner: match.winner ? {
                        name: match.winner.name,
                        score: match.winner.score || 0,
                        id: match.winner.id,
                        isBye: match.winner.isBye || false
                    } : null
                }))
            )
        };
    }

    static fromJSON(data) {
        const tournament = new Tournament(data.originalTeams, true);
        tournament.requiredTeams = data.requiredTeams;
        tournament.rounds = data.rounds;
        tournament.matches = data.matches.map(round =>
            round.map(match => ({
                id: match.id,
                team1: {
                    name: match.team1.name,
                    score: match.team1.score || 0,
                    id: match.team1.id,
                    isBye: match.team1.isBye || false
                },
                team2: {
                    name: match.team2.name,
                    score: match.team2.score || 0,
                    id: match.team2.id,
                    isBye: match.team2.isBye || false
                },
                winner: match.winner ? {
                    name: match.winner.name,
                    score: match.winner.score || 0,
                    id: match.winner.id,
                    isBye: match.winner.isBye || false
                } : null
            }))
        );
        return tournament;
    }
} 