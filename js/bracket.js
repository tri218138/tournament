class BracketRenderer {
    constructor(tournament, container) {
        this.tournament = tournament;
        this.container = container;
    }

    render() {
        this.container.innerHTML = '';
        this.tournament.matches.forEach((round, roundIndex) => {
            const roundElement = this.createRoundElement(round, roundIndex);
            this.container.appendChild(roundElement);
        });
    }

    createRoundElement(round, roundIndex) {
        const roundElement = document.createElement('div');
        roundElement.className = 'round';
        roundElement.dataset.round = roundIndex;

        round.forEach((match, matchIndex) => {
            const matchElement = this.createMatchElement(match, roundIndex, matchIndex);
            roundElement.appendChild(matchElement);
        });

        return roundElement;
    }

    createMatchElement(match, roundIndex, matchIndex) {
        const matchElement = document.createElement('div');
        matchElement.className = 'match';
        matchElement.dataset.matchId = match.id;

        // Team 1
        const team1Element = this.createTeamElement(match.team1, match, roundIndex, matchIndex, 1);
        matchElement.appendChild(team1Element);

        // Team 2
        const team2Element = this.createTeamElement(match.team2, match, roundIndex, matchIndex, 2);
        matchElement.appendChild(team2Element);

        // Connector line
        if (roundIndex < this.tournament.rounds - 1) {
            const connector = document.createElement('div');
            connector.className = 'connector';
            matchElement.appendChild(connector);
        }

        return matchElement;
    }

    createTeamElement(team, match, roundIndex, matchIndex, teamNumber) {
        const teamElement = document.createElement('div');
        teamElement.className = 'team';
        teamElement.dataset.teamId = team.id;

        if (team.name) {
            teamElement.innerHTML = `
                <span class="team-name">${team.name}</span>
                <input type="number" class="score-input" value="${team.score}" min="0">
            `;

            // Thêm các class và event listeners cho team element
            if (match.winner && match.winner.id === team.id) {
                teamElement.classList.add('winner');
            } else if (match.winner && match.winner.id !== team.id) {
                teamElement.classList.add('loser');
            }

            // Event listener cho điểm số
            const scoreInput = teamElement.querySelector('.score-input');
            scoreInput.addEventListener('change', (e) => {
                const score1 = parseInt(matchElement.querySelector(`[data-team-id="${match.team1.id}"] .score-input`).value) || 0;
                const score2 = parseInt(matchElement.querySelector(`[data-team-id="${match.team2.id}"] .score-input`).value) || 0;
                
                if (score1 !== score2) {
                    const winner = score1 > score2 ? match.team1 : match.team2;
                    this.tournament.updateMatch(roundIndex, matchIndex, winner, score1, score2);
                    this.render();
                }
            });

            // Event listener cho click vào team
            teamElement.addEventListener('click', (e) => {
                if (e.target.classList.contains('score-input')) return;
                
                const otherTeam = teamNumber === 1 ? match.team2 : match.team1;
                if (!match.winner && team.name && otherTeam.name) {
                    this.tournament.updateMatch(roundIndex, matchIndex, team, team.score, otherTeam.score);
                    this.render();
                }
            });
        }

        return teamElement;
    }
} 