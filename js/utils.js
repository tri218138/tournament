// Hàm tìm số mũ của 2 gần nhất và lớn hơn hoặc bằng n
function nextPowerOfTwo(n) {
    return Math.pow(2, Math.ceil(Math.log2(n)));
}

// Hàm tạo danh sách đội "bye" để đủ 2^k đội
function generateByeTeams(actualTeams, requiredTeams) {
    const byeTeams = [];
    for (let i = actualTeams.length + 1; i <= requiredTeams; i++) {
        byeTeams.push(`Bye ${i}`);
    }
    return byeTeams;
}

// Hàm xáo trộn mảng (Fisher-Yates shuffle)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Hàm tạo ID duy nhất cho mỗi trận đấu
function generateMatchId(roundIndex, matchIndex) {
    return `match-${roundIndex}-${matchIndex}`;
}

// Hàm tạo ID duy nhất cho mỗi đội trong một trận đấu
function generateTeamId(matchId, position) {
    return `${matchId}-team-${position}`;
} 