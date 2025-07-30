document.addEventListener('DOMContentLoaded', () => {
    const teamInput = document.getElementById('teamInput');
    const generateButton = document.getElementById('generateBracket');
    const bracketContainer = document.getElementById('bracketContainer');

    let tournament = null;
    let bracketRenderer = null;

    generateButton.addEventListener('click', () => {
        // Lấy danh sách đội từ textarea
        const teams = teamInput.value
            .split('\n')
            .map(team => team.trim())
            .filter(team => team.length > 0);

        if (teams.length < 2) {
            alert('Vui lòng nhập ít nhất 2 đội!');
            return;
        }

        // Khởi tạo giải đấu và renderer
        tournament = new Tournament(teams);
        bracketRenderer = new BracketRenderer(tournament, bracketContainer);
        
        // Render sơ đồ thi đấu
        bracketRenderer.render();
    });
}); 