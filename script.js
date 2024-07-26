let totalRowCount = 0;
let selectedTableData;

function parseMarkdownTable(markdown) {
    const lines = markdown.split('\n');
    const tableStart = lines.findIndex(line => line.trim().startsWith('| Nr. |'));
    if (tableStart === -1) return null;

    const tableLines = lines.slice(tableStart);
    const tableEnd = tableLines.findIndex(line => !line.trim().startsWith('|'));
    const table = tableLines.slice(0, tableEnd === -1 ? undefined : tableEnd);

    const parsedTable = table
        .filter((line, index) => index !== 1) // Entfernt die Trennzeile
        .map(line => 
            line.split('|')
                .slice(1, -1)
                .map(cell => cell.trim())
        );
    
    totalRowCount = parsedTable.length - 1; // Subtract 1 to exclude header row
    return parsedTable;
}

function displayTable(tableData, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    const table = document.createElement('table');
    
    tableData.forEach((row, index) => {
        const tr = document.createElement('tr');
        row.forEach(cell => {
            const td = document.createElement(index === 0 ? 'th' : 'td');
            td.textContent = cell;
            tr.appendChild(td);
        });
        table.appendChild(tr);
    });
    
    container.appendChild(table);
}

// see https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#Modern_method
function selectRandomRows(tableData, count) {
    const dataRows = tableData.slice(1);
    const shuffled = [...dataRows];
    
    // Durstenfeld's algorithm
    for (let i = shuffled.length - 1; i > 0; i--) {
        // random number
        const j = Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / (0xffffffff + 1) * (i + 1));
        // swap
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    const selectedRows = shuffled.slice(0, count);
    const selectedRowNumbers = selectedRows.map(row => parseInt(row[0]));

    return {
        selectedTable: [tableData[0], ...selectedRows],
        selectedRowNumbers: selectedRowNumbers
    };
}

function createDice(number, position) {
    const dice = document.createElement('div');
    dice.className = 'dice';
    dice.textContent = number;
    dice.style.left = `${position}%`;
    return dice;
}

function animateDice(rowNumbers) {
    const diceContainer = document.getElementById('diceContainer');
    diceContainer.innerHTML = '';
    
    const totalDice = rowNumbers.length;
    const spacing = 100 / (totalDice + 1);

    rowNumbers.forEach((number, index) => {
        setTimeout(() => {
            const position = spacing * (index + 1);
            const dice = createDice(number, position);
            diceContainer.appendChild(dice);
            
            dice.addEventListener('animationend', () => {
                dice.style.top = 'calc(100% - 44px)';
                dice.style.animation = 'none';
            });
        }, index * 200);
    });
}

function tableToText(tableData) {
    return tableData.slice(1).map(row => row.join(' | ')).join('\n- ');
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        const copyButton = document.getElementById('copyButton');
        const originalText = copyButton.textContent;
        copyButton.textContent = 'Copied!';
        copyButton.disabled = true;
        setTimeout(() => {
            copyButton.textContent = originalText;
            copyButton.disabled = false;
        }, 2000);
    }, (err) => {
        console.error('Error when Copying: ', err);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const customFileButton = document.getElementById('customFileButton');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    let tableData;

    customFileButton.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            fileNameDisplay.textContent = file.name;
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                tableData = parseMarkdownTable(content);
                if (tableData) {
                    displayTable(tableData, 'tableContainer');
                } else {
                    document.getElementById('tableContainer').textContent = 'No valid table found in the Markdown file';
                }
            };
            reader.readAsText(file);
        }
    });

    const rollButton = document.getElementById('rollButton');
    const rowCountInput = document.getElementById('rowCount');
    const errorMessage = document.getElementById('errorMessage');
    const copyButton = document.getElementById('copyButton');

    rollButton.addEventListener('click', () => {
        const count = parseInt(rowCountInput.value);
        if (isNaN(count) || count < 1 || count > totalRowCount) {
            errorMessage.textContent = `Please enter a valid number of rows between 1 and ${totalRowCount}`;
            return;
        }
        errorMessage.textContent = '';
        
        if (tableData) {
            const { selectedTable, selectedRowNumbers } = selectRandomRows(tableData, count);
            
            // Store the selected table data for copying
            selectedTableData = selectedTable;

            // Clear previous dice
            document.getElementById('diceContainer').innerHTML = '';
            
            // Animate dice with selected row numbers
            animateDice(selectedRowNumbers);
            
            setTimeout(() => {
                displayTable(selectedTable, 'selectedBooks');
            }, count * 200 + 1000); // Wait for animation to complete
        } else {
            errorMessage.textContent = 'Please upload a table first';
        }
    });

    copyButton.addEventListener('click', () => {
        if (selectedTableData) {
            const textToCopy = '- ' + tableToText(selectedTableData);
            copyToClipboard(textToCopy);
        } else {
            errorMessage.textContent = 'Please select books first.';
        }
    });
});