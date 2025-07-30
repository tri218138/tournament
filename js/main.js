document.addEventListener('DOMContentLoaded', () => {
    const teamInput = document.getElementById('teamInput');
    const generateButton = document.getElementById('generateBracket');
    const shuffleButton = document.getElementById('shuffleTeams');
    const clearButton = document.getElementById('clearData');
    const exportButton = document.getElementById('exportData');
    const importButton = document.getElementById('importData');
    const importFile = document.getElementById('importFile');
    const bracketContainer = document.getElementById('bracketContainer');

    let tournament = null;
    let bracketRenderer = null;

    // Load saved data from localStorage
    const loadSavedData = () => {
        const savedTeams = localStorage.getItem('teams');
        const savedTournament = localStorage.getItem('tournament');
        
        if (savedTeams) {
            teamInput.value = savedTeams;
        }
        
        if (savedTournament) {
            try {
                tournament = Tournament.fromJSON(JSON.parse(savedTournament));
                bracketRenderer = new BracketRenderer(tournament, bracketContainer);
                bracketRenderer.render();
            } catch (e) {
                console.error('Error loading saved tournament:', e);
            }
        }
    };

    // Save data to localStorage
    const saveData = () => {
        localStorage.setItem('teams', teamInput.value);
        if (tournament) {
            localStorage.setItem('tournament', JSON.stringify(tournament.toJSON()));
        }
    };

    // Clear all data
    clearButton.addEventListener('click', () => {
        if (confirm('Bạn có chắc chắn muốn xóa tất cả dữ liệu?')) {
            localStorage.removeItem('teams');
            localStorage.removeItem('tournament');
            teamInput.value = '';
            tournament = null;
            bracketContainer.innerHTML = '';
        }
    });

    // Shuffle teams
    shuffleButton.addEventListener('click', () => {
        const teams = teamInput.value
            .split('\n')
            .map(team => team.trim())
            .filter(team => team.length > 0);

        if (teams.length < 2) {
            alert('Vui lòng nhập ít nhất 2 đội!');
            return;
        }

        teamInput.value = shuffleArray([...teams]).join('\n');
        saveData();
    });

    // Generate bracket
    generateButton.addEventListener('click', () => {
        const teams = teamInput.value
            .split('\n')
            .map(team => team.trim())
            .filter(team => team.length > 0);

        if (teams.length < 2) {
            alert('Vui lòng nhập ít nhất 2 đội!');
            return;
        }

        // Tạo giải đấu với thứ tự hiện tại (không xáo trộn)
        tournament = new Tournament(teams, true);
        bracketRenderer = new BracketRenderer(tournament, bracketContainer);
        bracketRenderer.render();
        saveData();
    });

    // Export tournament data
    exportButton.addEventListener('click', () => {
        if (!tournament) {
            alert('Chưa có dữ liệu giải đấu để xuất!');
            return;
        }

        const data = {
            teams: teamInput.value,
            tournament: tournament.toJSON()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tournament.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // Import tournament data
    importButton.addEventListener('click', () => {
        importFile.click();
    });

    importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                teamInput.value = data.teams;
                tournament = Tournament.fromJSON(data.tournament);
                bracketRenderer = new BracketRenderer(tournament, bracketContainer);
                bracketRenderer.render();
                saveData();
            } catch (error) {
                alert('Lỗi khi đọc file: ' + error.message);
            }
        };
        reader.readAsText(file);
        importFile.value = ''; // Reset file input
    });

    // Load saved data when page loads
    loadSavedData();
}); 