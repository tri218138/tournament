class BracketRenderer {
    constructor(tournament, container, groupStage = null) {
        this.tournament = tournament;
        this.container = container;
        this.groupStage = groupStage;
    }

    render() {
        this.container.innerHTML = '';

        if (this.groupStage) {
            // Render vòng bảng
            const groupRounds = this.createGroupRounds();
            this.container.appendChild(groupRounds);

            // Thêm connector từ vòng bảng sang vòng loại trực tiếp
            const connector = document.createElement('div');
            connector.className = 'round-connector';
            this.container.appendChild(connector);
        }

        // Render vòng loại trực tiếp
        this.tournament.matches.forEach((round, roundIndex) => {
            const roundElement = this.createRoundElement(round, roundIndex);
            this.container.appendChild(roundElement);
        });
    }

    createGroupRounds() {
        const groupRoundsElement = document.createElement('div');
        groupRoundsElement.className = 'group-rounds';

        // Tạo container cho mỗi bảng
        this.groupStage.groups.forEach(group => {
            const groupElement = document.createElement('div');
            groupElement.className = 'group-bracket';

            // Tiêu đề bảng
            const groupTitle = document.createElement('div');
            groupTitle.className = 'group-title';
            groupTitle.textContent = `Bảng ${group.name}`;
            groupElement.appendChild(groupTitle);

            // Bảng xếp hạng
            const standingsElement = this.createGroupStandings(group);
            groupElement.appendChild(standingsElement);

            // Danh sách trận đấu
            const matchesElement = this.createGroupMatches(group);
            groupElement.appendChild(matchesElement);

            groupRoundsElement.appendChild(groupElement);
        });

        return groupRoundsElement;
    }

    createGroupStandings(group) {
        const standingsElement = document.createElement('div');
        standingsElement.className = 'group-standings';

        const table = document.createElement('table');
        table.className = 'standings-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Đội</th>
                    <th>Đ</th>
                    <th>HS</th>
                </tr>
            </thead>
            <tbody>
                ${this.groupStage.standings[group.name].map(team => `
                    <tr class="${this.isTeamQualified(team, group.name) ? 'qualified' : ''}">
                        <td>${team.team}</td>
                        <td>${team.points}</td>
                        <td>${team.goalDifference}</td>
                    </tr>
                `).join('')}
            </tbody>
        `;

        standingsElement.appendChild(table);
        return standingsElement;
    }

    createGroupMatches(group) {
        const matchesElement = document.createElement('div');
        matchesElement.className = 'group-matches';

        const matches = this.groupStage.matches.find(m => m.group === group.name).matches;
        matches.forEach((match, index) => {
            const matchElement = document.createElement('div');
            matchElement.className = 'group-match';

            // Tạo container cho trận đấu
            const matchTeamsElement = document.createElement('div');
            matchTeamsElement.className = 'match-teams';

            // Team 1
            const team1Name = document.createElement('span');
            team1Name.className = 'team-name';
            team1Name.textContent = match.team1;
            matchTeamsElement.appendChild(team1Name);

            // Score 1
            const score1Input = document.createElement('input');
            score1Input.type = 'number';
            score1Input.min = '0';
            score1Input.step = '1';
            score1Input.value = match.score1 !== null ? match.score1 : '';
            score1Input.dataset.group = group.name;
            score1Input.dataset.match = index;
            score1Input.dataset.team = '1';
            if (match.team1.startsWith('Bye ')) {
                score1Input.disabled = true;
            }
            matchTeamsElement.appendChild(score1Input);

            // Separator
            const separator = document.createElement('span');
            separator.textContent = '-';
            matchTeamsElement.appendChild(separator);

            // Score 2
            const score2Input = document.createElement('input');
            score2Input.type = 'number';
            score2Input.min = '0';
            score2Input.step = '1';
            score2Input.value = match.score2 !== null ? match.score2 : '';
            score2Input.dataset.group = group.name;
            score2Input.dataset.match = index;
            score2Input.dataset.team = '2';
            if (match.team2.startsWith('Bye ')) {
                score2Input.disabled = true;
            }
            matchTeamsElement.appendChild(score2Input);

            // Team 2
            const team2Name = document.createElement('span');
            team2Name.className = 'team-name';
            team2Name.textContent = match.team2;
            matchTeamsElement.appendChild(team2Name);

            matchElement.appendChild(matchTeamsElement);

            // Add event listeners for score inputs
            const updateScores = () => {
                // Lấy giá trị từ input và chuyển đổi sang số
                let score1 = score1Input.value.trim();
                let score2 = score2Input.value.trim();

                // Chuyển đổi sang số nguyên
                score1 = score1 === '' ? 0 : parseInt(score1, 10);
                score2 = score2 === '' ? 0 : parseInt(score2, 10);

                // Kiểm tra tính hợp lệ
                if (isNaN(score1) || isNaN(score2)) {
                    return;
                }

                // Kiểm tra nếu có đội bye thì không cập nhật
                if (match.team1.startsWith('Bye ') || match.team2.startsWith('Bye ')) {
                    return;
                }

                this.groupStage.updateMatch(group.name, index, score1, score2);
                this.render();
            };

            // Sử dụng cả input và change event để đảm bảo bắt được mọi thay đổi
            [score1Input, score2Input].forEach(input => {
                input.addEventListener('input', updateScores);
                input.addEventListener('change', updateScores);
            });

            matchesElement.appendChild(matchElement);
        });

        return matchesElement;
    }

    isTeamQualified(team, groupName) {
        const standings = this.groupStage.standings[groupName];
        return standings.indexOf(team) < 2; // 2 đội đứng đầu
    }

    createRoundElement(round, roundIndex) {
        const roundElement = document.createElement('div');
        roundElement.className = 'round';
        roundElement.dataset.round = roundIndex;

        // Thêm tiêu đề cho vòng đấu
        const roundTitle = document.createElement('div');
        roundTitle.className = 'round-title';
        roundTitle.textContent = this.getRoundTitle(roundIndex);
        roundElement.appendChild(roundTitle);

        round.forEach((match, matchIndex) => {
            const matchElement = this.createMatchElement(match, roundIndex, matchIndex);
            roundElement.appendChild(matchElement);
        });

        return roundElement;
    }

    getRoundTitle(roundIndex) {
        const totalRounds = this.tournament.rounds;
        if (roundIndex === totalRounds - 1) return 'Chung kết';
        if (roundIndex === totalRounds - 2) return 'Bán kết';
        if (roundIndex === totalRounds - 3) return 'Tứ kết';
        return `Vòng ${roundIndex + 1}`;
    }

    createMatchElement(match, roundIndex, matchIndex) {
        const matchElement = document.createElement('div');
        matchElement.className = 'match';
        matchElement.dataset.matchId = match.id;

        // Team 1
        const team1Element = this.createTeamElement(match.team1, match, roundIndex, matchIndex, 1, matchElement);
        matchElement.appendChild(team1Element);

        // Team 2
        const team2Element = this.createTeamElement(match.team2, match, roundIndex, matchIndex, 2, matchElement);
        matchElement.appendChild(team2Element);

        // Connector line
        if (roundIndex < this.tournament.rounds - 1) {
            const connector = document.createElement('div');
            connector.className = 'connector';
            matchElement.appendChild(connector);
        }

        return matchElement;
    }

    createTeamElement(team, match, roundIndex, matchIndex, teamNumber, matchElement) {
        const teamElement = document.createElement('div');
        teamElement.className = 'team';
        teamElement.dataset.teamId = team.id;

        if (team.name) {
            // Thêm class bye cho các đội vô hình
            if (team.isBye) {
                teamElement.classList.add('bye');
            }

            teamElement.innerHTML = `
                <span class="team-name">${team.name}</span>
                <input type="number" class="score-input" value="${team.score || ''}" min="0" step="1" ${team.isBye ? 'disabled' : ''}>
            `;

            // Thêm các class và event listeners cho team element
            if (match.winner && match.winner.id === team.id) {
                teamElement.classList.add('winner');
            } else if (match.winner && match.winner.id !== team.id) {
                teamElement.classList.add('loser');
            }

            // Event listener cho điểm số
            const scoreInput = teamElement.querySelector('.score-input');
            const updateKnockoutScores = () => {
                if (team.isBye) return;

                const score1Input = matchElement.querySelector(`[data-team-id="${match.team1.id}"] .score-input`);
                const score2Input = matchElement.querySelector(`[data-team-id="${match.team2.id}"] .score-input`);

                let score1 = score1Input.value.trim();
                let score2 = score2Input.value.trim();

                score1 = score1 === '' ? 0 : parseInt(score1, 10);
                score2 = score2 === '' ? 0 : parseInt(score2, 10);

                if (isNaN(score1) || isNaN(score2)) {
                    return;
                }

                if (score1 !== score2) {
                    const winner = score1 > score2 ? match.team1 : match.team2;
                    if (!winner.isBye) {
                        this.tournament.updateMatch(roundIndex, matchIndex, winner, score1, score2);
                        this.render();
                    }
                }
            };

            scoreInput.addEventListener('input', updateKnockoutScores);
            scoreInput.addEventListener('change', updateKnockoutScores);

            // Event listener cho click vào team
            teamElement.addEventListener('click', (e) => {
                if (e.target.classList.contains('score-input') || team.isBye) return;
                
                const otherTeam = teamNumber === 1 ? match.team2 : match.team1;
                if (!match.winner && team.name && otherTeam.name && !team.isBye && !otherTeam.isBye) {
                    this.tournament.updateMatch(roundIndex, matchIndex, team, team.score, otherTeam.score);
                    this.render();
                }
            });
        }

        return teamElement;
    }
} 