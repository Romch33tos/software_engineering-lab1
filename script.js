(function () {
    'use strict';

    const roleNames = ['Разработчик', 'Аналитик', 'Руководитель', 'Инженер'];
    const defaultRoleDays = { 'Разработчик': 12, 'Аналитик': 8, 'Руководитель': 5 };

    function getSettings() {
        return {
            developerSalary: parseFloat(document.getElementById('salaryDeveloper').value) || 0,
            analystSalary: parseFloat(document.getElementById('salaryAnalyst').value) || 0,
            projectManagerSalary: parseFloat(document.getElementById('salaryProjectManager').value) || 0,
            engineerSalary: parseFloat(document.getElementById('salaryEngineer').value) || 0,
            additionalSalaryRatio: parseFloat(document.getElementById('coefficientAdditionalSalary').value) || 0,
            taxRatio: parseFloat(document.getElementById('coefficientTaxes').value) || 0,
            overheadRatio: parseFloat(document.getElementById('coefficientOverhead').value) || 0,
            workDaysPerMonth: parseFloat(document.getElementById('workDaysPerMonth').value) || 21,
            machineHourCost: parseFloat(document.getElementById('machineHourCost').value) || 0,
            electricityTariff: parseFloat(document.getElementById('electricityTariff').value) || 0,
            equipmentPower: parseFloat(document.getElementById('equipmentPower').value) || 0,
            balanceCost: parseFloat(document.getElementById('balanceCost').value) || 0,
            annualTimeFund: parseFloat(document.getElementById('annualTimeFund').value) || 2000,
            normativeEfficiency: parseFloat(document.getElementById('normativeEfficiency').value) || 0.33,
            annualVolume: parseFloat(document.getElementById('annualVolumeValue').value) || 1
        };
    }

    function getSalaryMap(settings) {
        return {
            'Разработчик': settings.developerSalary,
            'Аналитик': settings.analystSalary,
            'Руководитель': settings.projectManagerSalary,
            'Инженер': settings.engineerSalary
        };
    }

    function initTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const panels = document.querySelectorAll('.panel');
        tabButtons.forEach(button => {
            button.addEventListener('click', function () {
                const targetId = this.getAttribute('data-tab');
                tabButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                panels.forEach(panel => panel.classList.remove('active'));
                document.getElementById(targetId).classList.add('active');
            });
        });
    }

    function createKtuRow(name, weight, score) {
        const row = document.createElement('tr');
        row.innerHTML = `<td><input type="text" placeholder="Название" value="${name || ''}" required style="width:100%" minlength="3" maxlength="100"></td>` +
            `<td><input type="number" step="0.01" min="0.01" max="1" value="${weight || 0.5}" required style="width:90px"></td>` +
            `<td><input type="number" step="0.1" min="1" max="5" value="${score || 3}" required style="width:80px"></td>`;
        return row;
    }

    function addKtuRow(tableId, name, weight, score) {
        document.querySelector('#' + tableId + ' tbody').appendChild(createKtuRow(name, weight, score));
    }

    function initKtu() {
        document.getElementById('addKtuRowProject').addEventListener('click', () => addKtuRow('ktuProjectTable', '', 0.5, 3));
        document.getElementById('addKtuRowAnalog').addEventListener('click', () => addKtuRow('ktuAnalogTable', '', 0.5, 3));

        addKtuRow('ktuProjectTable', 'Функциональность', 0.5, 5);
        addKtuRow('ktuProjectTable', 'Надежность', 0.5, 4);
        addKtuRow('ktuAnalogTable', 'Функциональность', 0.5, 4);
        addKtuRow('ktuAnalogTable', 'Надежность', 0.5, 4);
    }

    function calculateJetuWithDetail(tableId, detailElementId) {
        let totalSum = 0;
        const rows = document.querySelectorAll('#' + tableId + ' tbody tr');
        const calculationLines = [];
        let rowIndex = 1;
        rows.forEach(row => {
            const inputs = row.querySelectorAll('input');
            if (inputs.length >= 2) {
                const weight = parseFloat(inputs[1].value) || 0;
                const score = parseFloat(inputs[2].value) || 1;
                const product = weight * score;
                totalSum += product;
                const indicatorName = inputs[0].value || `показатель ${rowIndex}`;
                calculationLines.push(`${indicatorName}: ${weight.toFixed(2)} × ${score.toFixed(1)} = ${product.toFixed(2)}`);
                rowIndex++;
            }
        });
        const detailDiv = document.getElementById(detailElementId);
        if (detailDiv) {
            if (calculationLines.length) {
                let formattedText = 'Расчет:\n' + calculationLines.join('\n');
                const totals = calculationLines.map(line => {
                    const match = line.match(/= ([\d.]+)$/);
                    return match ? match[1] : '0';
                });
                formattedText += `\nИтого: ${totals.join(' + ')} = ${totalSum.toFixed(2)}`;
                detailDiv.textContent = formattedText;
            } else {
                detailDiv.textContent = 'Нет добавленных показателей';
            }
        }
        return totalSum;
    }

    function updateKtu() {
        const jetuProject = calculateJetuWithDetail('ktuProjectTable', 'jetuProjectDetail');
        const jetuAnalog = calculateJetuWithDetail('ktuAnalogTable', 'jetuAnalogDetail');
        document.getElementById('jetuProject').textContent = jetuProject.toFixed(2);
        document.getElementById('jetuAnalog').textContent = jetuAnalog.toFixed(2);
        const technicalLevelRatio = jetuAnalog !== 0 ? jetuProject / jetuAnalog : 1;
        return technicalLevelRatio;
    }
})();
