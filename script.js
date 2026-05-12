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

    function createPlanRow(stageName, role, days, loadPercent) {
        const row = document.createElement('tr');
        const roleOptions = roleNames.map(r => `<option${r === role ? ' selected' : ''}>${r}</option>`).join('');
        row.innerHTML = '<td><input value="' + (stageName || '') + '" required style="width:100%" minlength="3" maxlength="100" placeholder="Название этапа"></td>' +
            '<td><select>' + roleOptions + '</select></td>' +
            '<td><input type="number" min="1" max="365" value="' + days + '" required style="width:70px"></td>' +
            '<td><input type="number" min="1" max="100" value="' + loadPercent + '" step="1" required style="width:80px"></td>' +
            '<td class="endDate">—</td>' +
            '<td><button class="btn-outline delete-row-button" type="button">Удалить</button></td>';
        row.querySelector('.delete-row-button').addEventListener('click', function () { row.remove(); recalcAll(); });

        const inputs = row.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', function() {
                calculatePlanDates();
            });
            input.addEventListener('change', function() {
                calculatePlanDates();
            });
        });

        const select = row.querySelector('select');
        if (select) {
            select.addEventListener('change', function() {
                calculatePlanDates();
            });
        }

        return row;
    }

    function addPlanRow(role, days, loadPercent) {
        document.querySelector('#planTable tbody').appendChild(createPlanRow('', role, days, loadPercent));
    }

    function initPlan() {
        document.getElementById('addPlanRow').addEventListener('click', () => addPlanRow('Разработчик', 5, 100));

        const initialStages = [
            { name: 'Анализ требований', role: 'Аналитик', days: 8, load: 100 },
            { name: 'Проектирование архитектуры', role: 'Разработчик', days: 12, load: 100 },
            { name: 'Управление проектом', role: 'Руководитель', days: 5, load: 100 }
        ];

        initialStages.forEach(stage => {
            document.querySelector('#planTable tbody').appendChild(
                createPlanRow(stage.name, stage.role, stage.days, stage.load)
            );
        });
    }

    function isWeekend(date) {
        const dayOfWeek = date.getDay();
        return dayOfWeek === 0 || dayOfWeek === 6;
    }

    function addWorkDays(startDate, daysToAdd) {
        let currentDate = new Date(startDate);
        let addedDays = 0;
        while (addedDays < daysToAdd) {
            if (!isWeekend(currentDate)) addedDays++;
            if (addedDays < daysToAdd) currentDate.setDate(currentDate.getDate() + 1);
        }
        return currentDate;
    }

    function calculatePlanDates() {
        const startDateInput = document.getElementById('projectStartDate').value;
        if (!startDateInput) return {};
        let currentDate = new Date(startDateInput);
        if (isNaN(currentDate.getTime())) return {};
        const planRows = document.querySelectorAll('#planTable tbody tr');
        const roleDaysMap = {};
        const planCalculationLines = [];
        let stageNumber = 1;
        planRows.forEach(row => {
            const inputs = row.querySelectorAll('input');
            const stageName = inputs[0].value || `Этап ${stageNumber}`;
            const role = row.querySelector('select').value;
            const daysCount = parseInt(inputs[1].value) || 0;
            const loadPercent = parseInt(inputs[2].value) || 100;
            const actualWorkDays = Math.ceil(daysCount * (loadPercent / 100));
            const endDate = addWorkDays(currentDate, daysCount);
            row.querySelector('.endDate').textContent = endDate.toLocaleDateString('ru-RU');
            planCalculationLines.push(`${stageName}: ${daysCount} дн. × ${loadPercent}% = ${actualWorkDays} чел-дней (${role})`);
            currentDate = new Date(endDate);
            currentDate.setDate(currentDate.getDate() + 1);
            if (!roleDaysMap[role]) roleDaysMap[role] = 0;
            roleDaysMap[role] += actualWorkDays;
            stageNumber++;
        });
        const summaryParts = [];
        for (const role in roleDaysMap) {
            if (roleDaysMap.hasOwnProperty(role)) {
                summaryParts.push(role + ': ' + roleDaysMap[role] + ' дн.');
            }
        }
        document.getElementById('roleDaysSummary').textContent = summaryParts.join(', ');
        const planDetailDiv = document.getElementById('planDetail');
        if (planDetailDiv && planCalculationLines.length) {
            planDetailDiv.textContent = 'Расчет:\n' + planCalculationLines.join('\n');
        }
        return roleDaysMap;
    }
})();
