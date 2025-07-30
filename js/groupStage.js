class GroupStage {
    constructor(teams, groupCount = 4) {
        this.teams = teams;
        this.groupCount = Math.min(groupCount, teams.length);
        this.groups = this.createGroups();
        this.matches = this.generateMatches();
        this.standings = this.initializeStandings();
    }

    createGroups() {
        const groups = [];
        const teamsPerGroup = Math.ceil(this.teams.length / this.groupCount);
        
        // Tạo các bảng theo số lượng cấu hình
        for (let i = 0; i < this.groupCount; i++) {
            const groupName = String.fromCharCode(65 + i); // A, B, C, D, ...
            const startIdx = i * teamsPerGroup;
            const endIdx = Math.min(startIdx + teamsPerGroup, this.teams.length);
            const groupTeams = this.teams.slice(startIdx, endIdx);
            
            // Thêm các đội "bye" nếu số đội trong bảng chưa đủ
            while (groupTeams.length < teamsPerGroup && groupTeams.length < 4) {
                groupTeams.push(`Bye ${groupName}${groupTeams.length + 1}`);
            }
            
            groups.push({
                name: groupName,
                teams: groupTeams
            });
        }

        return groups;
    }

    generateMatches() {
        const allMatches = [];

        this.groups.forEach(group => {
            const matches = [];
            const teams = group.teams;

            // Tạo các cặp đấu vòng tròn (mỗi đội gặp tất cả đội khác một lần)
            for (let i = 0; i < teams.length; i++) {
                for (let j = i + 1; j < teams.length; j++) {
                    matches.push({
                        group: group.name,
                        team1: teams[i],
                        team2: teams[j],
                        score1: null,
                        score2: null,
                        played: false
                    });
                }
            }

            allMatches.push({
                group: group.name,
                matches: matches
            });
        });

        return allMatches;
    }

    initializeStandings() {
        const standings = {};

        this.groups.forEach(group => {
            standings[group.name] = group.teams.map(team => ({
                team: team,
                played: 0,
                won: 0,
                drawn: 0,
                lost: 0,
                goalsFor: 0,
                goalsAgainst: 0,
                goalDifference: 0,
                points: 0
            }));
        });

        return standings;
    }

    updateMatch(groupName, matchIndex, score1, score2) {
        const groupMatches = this.matches.find(g => g.group === groupName);
        if (!groupMatches) return;

        const match = groupMatches.matches[matchIndex];
        if (!match) return;

        // Nếu trận đấu đã được cập nhật trước đó, trừ lại các chỉ số cũ
        if (match.played) {
            this.updateStandingsForMatch(groupName, match, match.score1, match.score2, true);
        }

        // Cập nhật điểm số mới
        match.score1 = score1;
        match.score2 = score2;
        match.played = true;

        // Cập nhật bảng xếp hạng với điểm số mới
        this.updateStandingsForMatch(groupName, match, score1, score2, false);
    }

    updateStandingsForMatch(groupName, match, score1, score2, isReverting) {
        const groupStandings = this.standings[groupName];
        const team1Stats = groupStandings.find(s => s.team === match.team1);
        const team2Stats = groupStandings.find(s => s.team === match.team2);

        // Bỏ qua nếu một trong hai đội là bye
        if (team1Stats.team.startsWith('Bye ') || team2Stats.team.startsWith('Bye ')) {
            return;
        }

        const multiplier = isReverting ? -1 : 1;

        // Cập nhật số trận đã đấu
        team1Stats.played += 1 * multiplier;
        team2Stats.played += 1 * multiplier;

        // Cập nhật bàn thắng/bàn thua
        team1Stats.goalsFor += score1 * multiplier;
        team1Stats.goalsAgainst += score2 * multiplier;
        team2Stats.goalsFor += score2 * multiplier;
        team2Stats.goalsAgainst += score1 * multiplier;

        // Cập nhật kết quả trận đấu
        if (score1 > score2) {
            team1Stats.won += 1 * multiplier;
            team2Stats.lost += 1 * multiplier;
            team1Stats.points += 3 * multiplier;
        } else if (score1 < score2) {
            team2Stats.won += 1 * multiplier;
            team1Stats.lost += 1 * multiplier;
            team2Stats.points += 3 * multiplier;
        } else {
            team1Stats.drawn += 1 * multiplier;
            team2Stats.drawn += 1 * multiplier;
            team1Stats.points += 1 * multiplier;
        }

        // Cập nhật hiệu số bàn thắng
        team1Stats.goalDifference = team1Stats.goalsFor - team1Stats.goalsAgainst;
        team2Stats.goalDifference = team2Stats.goalsFor - team2Stats.goalsAgainst;

        // Sắp xếp bảng xếp hạng
        this.standings[groupName].sort((a, b) => {
            // Bỏ qua các đội bye
            if (a.team.startsWith('Bye ')) return 1;
            if (b.team.startsWith('Bye ')) return -1;

            if (a.points !== b.points) return b.points - a.points;
            if (a.goalDifference !== b.goalDifference) return b.goalDifference - a.goalDifference;
            return b.goalsFor - a.goalsFor;
        });
    }

    getTopTeams(count = 2) {
        const qualifiedTeams = [];
        
        // Lấy số đội yêu cầu từ mỗi bảng
        this.groups.forEach(group => {
            const groupStandings = this.standings[group.name];
            // Lọc bỏ các đội bye trước khi lấy top teams
            const realTeams = groupStandings.filter(s => !s.team.startsWith('Bye '));
            qualifiedTeams.push(...realTeams.slice(0, count).map(s => s.team));
        });

        return qualifiedTeams;
    }

    toJSON() {
        return {
            teams: this.teams,
            groupCount: this.groupCount,
            groups: this.groups,
            matches: this.matches,
            standings: this.standings
        };
    }

    static fromJSON(data) {
        const groupStage = new GroupStage(data.teams, data.groupCount);
        groupStage.groups = data.groups;
        groupStage.matches = data.matches;
        groupStage.standings = data.standings;
        return groupStage;
    }
} 