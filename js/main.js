document.addEventListener('DOMContentLoaded', () => {
    const teamInput = document.getElementById('teamInput');
    const generateButton = document.getElementById('generateBracket');
    const shuffleButton = document.getElementById('shuffleTeams');
    const clearButton = document.getElementById('clearData');
    const exportButton = document.getElementById('exportData');
    const importButton = document.getElementById('importData');
    const importFile = document.getElementById('importFile');
    const bracketContainer = document.getElementById('bracketContainer');
    const useGroupStageCheckbox = document.getElementById('useGroupStage');
    const groupStageOptions = document.getElementById('groupStageOptions');

    let tournament = null;
    let bracketRenderer = null;
    let groupStage = null;

    // Toggle group stage options
    useGroupStageCheckbox.addEventListener('change', () => {
        groupStageOptions.classList.toggle('hidden', !useGroupStageCheckbox.checked);
        previewGroups();
    });

    // Preview groups when teams change
    teamInput.addEventListener('input', () => {
        if (useGroupStageCheckbox.checked) {
            previewGroups();
        }
    });

    function previewGroups() {
        const teams = getTeamsList();
        if (teams.length < 2) return;

        const tempGroupStage = new GroupStage(teams);
        const groupList = document.querySelector('.group-list');
        groupList.innerHTML = '';

        tempGroupStage.groups.forEach(group => {
            const groupElement = document.createElement('div');
            groupElement.className = 'group';
            groupElement.innerHTML = `
                <h4>Bảng ${group.name}</h4>
                ${group.teams.map(team => `<div class="group-team">${team}</div>`).join('')}
            `;
            groupList.appendChild(groupElement);
        });
    }

    function getTeamsList() {
        return teamInput.value
            .split('\n')
            .map(team => team.trim())
            .filter(team => team.length > 0);
    }

    // Load saved data from localStorage
    const loadSavedData = () => {
        const savedData = localStorage.getItem('tournamentData');
        
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                teamInput.value = data.teams;
                
                if (data.useGroupStage) {
                    useGroupStageCheckbox.checked = true;
                    groupStageOptions.classList.remove('hidden');
                    groupStage = GroupStage.fromJSON(data.groupStage);
                }
                
                if (data.tournament) {
                    tournament = Tournament.fromJSON(data.tournament);
                    bracketRenderer = new BracketRenderer(tournament, bracketContainer, groupStage);
                    bracketRenderer.render();
                }

                if (useGroupStageCheckbox.checked) {
                    previewGroups();
                }
            } catch (e) {
                console.error('Error loading saved tournament:', e);
                localStorage.removeItem('tournamentData');
            }
        }
    };

    // Save data to localStorage
    const saveData = () => {
        const data = {
            teams: teamInput.value,
            useGroupStage: useGroupStageCheckbox.checked,
            groupStage: groupStage ? groupStage.toJSON() : null,
            tournament: tournament ? tournament.toJSON() : null
        };
        localStorage.setItem('tournamentData', JSON.stringify(data));
    };

    // Clear all data
    clearButton.addEventListener('click', () => {
        if (confirm('Bạn có chắc chắn muốn xóa tất cả dữ liệu?')) {
            localStorage.removeItem('tournamentData');
            teamInput.value = '';
            tournament = null;
            groupStage = null;
            bracketContainer.innerHTML = '';
            useGroupStageCheckbox.checked = false;
            groupStageOptions.classList.add('hidden');
        }
    });

    // Shuffle teams
    shuffleButton.addEventListener('click', () => {
        const teams = getTeamsList();
        if (teams.length < 2) {
            alert('Vui lòng nhập ít nhất 2 đội!');
            return;
        }

        teamInput.value = shuffleArray([...teams]).join('\n');
        if (useGroupStageCheckbox.checked) {
            previewGroups();
        }
        saveData();
    });

    // Generate bracket
    generateButton.addEventListener('click', () => {
        const teams = getTeamsList();
        if (teams.length < 2) {
            alert('Vui lòng nhập ít nhất 2 đội!');
            return;
        }

        if (useGroupStageCheckbox.checked) {
            // Khởi tạo vòng bảng
            groupStage = new GroupStage(teams);
            
            // Tạo giải đấu loại trực tiếp với 2 đội đứng đầu mỗi bảng
            const qualifiedTeams = groupStage.getTopTeams(2);
            tournament = new Tournament(qualifiedTeams, true);
        } else {
            // Tạo giải đấu loại trực tiếp với tất cả các đội
            groupStage = null;
            tournament = new Tournament(teams, true);
        }

        bracketRenderer = new BracketRenderer(tournament, bracketContainer, groupStage);
        bracketRenderer.render();
        saveData();
    });

    // Export tournament data
    exportButton.addEventListener('click', () => {
        if (!tournament && !groupStage) {
            alert('Chưa có dữ liệu giải đấu để xuất!');
            return;
        }

        const data = {
            teams: teamInput.value,
            useGroupStage: useGroupStageCheckbox.checked,
            groupStage: groupStage ? groupStage.toJSON() : null,
            tournament: tournament ? tournament.toJSON() : null
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
                
                if (data.useGroupStage) {
                    useGroupStageCheckbox.checked = true;
                    groupStageOptions.classList.remove('hidden');
                    groupStage = GroupStage.fromJSON(data.groupStage);
                } else {
                    useGroupStageCheckbox.checked = false;
                    groupStageOptions.classList.add('hidden');
                    groupStage = null;
                }

                if (data.tournament) {
                    tournament = Tournament.fromJSON(data.tournament);
                    bracketRenderer = new BracketRenderer(tournament, bracketContainer, groupStage);
                    bracketRenderer.render();
                }

                if (useGroupStageCheckbox.checked) {
                    previewGroups();
                }

                saveData();
            } catch (error) {
                alert('Lỗi khi đọc file: ' + error.message);
            }
        };
        reader.readAsText(file);
        importFile.value = ''; // Reset file input
    });

    // Auto-save when bracket is updated
    const observer = new MutationObserver(saveData);
    observer.observe(bracketContainer, { 
        childList: true, 
        subtree: true, 
        attributes: true, 
        characterData: true 
    });

    // Load saved data when page loads
    loadSavedData();
}); 