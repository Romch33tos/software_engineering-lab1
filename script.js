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

    function calculateCapitalCosts() {
        const settings = getSettings();
        const roleDays = calculatePlanDates();
        const salaryMap = getSalaryMap(settings);
        let totalBaseSalary = 0;
        const fotCalculationLines = [];
        for (const role in roleDays) {
            if (roleDays.hasOwnProperty(role)) {
                const monthlySalary = salaryMap[role] || 0;
                const dailyRate = monthlySalary / settings.workDaysPerMonth;
                const roleCost = dailyRate * roleDays[role];
                totalBaseSalary += roleCost;
                fotCalculationLines.push(`${role}: ${monthlySalary.toFixed(0)} / ${settings.workDaysPerMonth} × ${roleDays[role]} = ${roleCost.toFixed(2)}`);
            }
        }
        document.getElementById('totalBaseSalary').textContent = totalBaseSalary.toFixed(2);
        const fotDetailDiv = document.getElementById('totalBaseSalaryDetail');
        if (fotDetailDiv && fotCalculationLines.length) {
            const totals = fotCalculationLines.map(line => {
                const match = line.match(/= ([\d.]+)$/);
                return match ? match[1] : '0';
            });
            fotDetailDiv.textContent = 'Расчет:\n' + fotCalculationLines.join('\n') +
                `\nИтого: ${totals.join(' + ')} = ${totalBaseSalary.toFixed(2)}`;
        }
        const additionalSalary = totalBaseSalary * settings.additionalSalaryRatio;
        const taxesAmount = (totalBaseSalary + additionalSalary) * settings.taxRatio;
        const overheadAmount = totalBaseSalary * settings.overheadRatio;
        const materialCost = parseFloat(document.getElementById('materialCosts').value) || 0;
        const machineHours = parseFloat(document.getElementById('machineTime').value) || 0;
        const machineCost = machineHours * settings.machineHourCost;
        const capitalCostsProject = totalBaseSalary + additionalSalary + taxesAmount + overheadAmount + materialCost + machineCost;
        const sumMultiplier = (1 + settings.additionalSalaryRatio) * (1 + settings.taxRatio) + settings.overheadRatio;
        const kpDetailDiv = document.getElementById('capitalCostsProjectDetail');
        if (kpDetailDiv) {
            kpDetailDiv.textContent = `Расчет:\nKп = ((1+Wd)×(1+Wc)+Wн) × ΣЗоi + Cм + tмв × Sмч\n` +
                `Kп = ((1+${settings.additionalSalaryRatio})×(1+${settings.taxRatio})+${settings.overheadRatio}) × ${totalBaseSalary.toFixed(2)} + ${materialCost} + ${machineHours}×${settings.machineHourCost}\n` +
                `Kп = ${sumMultiplier.toFixed(3)} × ${totalBaseSalary.toFixed(2)} + ${materialCost} + ${machineCost.toFixed(2)}\n` +
                `Kп = ${(sumMultiplier * totalBaseSalary).toFixed(2)} + ${materialCost} + ${machineCost.toFixed(2)} = ${capitalCostsProject.toFixed(2)}`;
        }
        const analogPrice = parseFloat(document.getElementById('analogPurchasePrice').value) || 0;
        const analogInstall = parseFloat(document.getElementById('analogInstallationCost').value) || 0;
        const analogEducation = parseFloat(document.getElementById('analogEducationCost').value) || 0;
        const capitalCostsAnalog = analogPrice + analogInstall + analogEducation;
        document.getElementById('capitalCostsProject').textContent = capitalCostsProject.toFixed(2);
        document.getElementById('capitalCostsAnalog').textContent = capitalCostsAnalog.toFixed(2);
        const analogDetailDiv = document.getElementById('capitalCostsAnalogDetail');
        if (analogDetailDiv) {
            analogDetailDiv.textContent = `Расчет:\nKп (аналог) = Цена покупки + Установка + Обучение\n` +
                `= ${analogPrice.toFixed(0)} + ${analogInstall.toFixed(0)} + ${analogEducation.toFixed(0)} = ${capitalCostsAnalog.toFixed(2)}`;
        }
        return { projectCosts: capitalCostsProject, analogCosts: capitalCostsAnalog };
    }

    function calculateOperatingCosts() {
        const settings = getSettings();
        const salaryMap = getSalaryMap(settings);
        const payrollParts = [];
        let annualPayroll = 0;
        for (let i = 0; i < roleNames.length; i++) {
            const monthlySalary = salaryMap[roleNames[i]] || 0;
            const yearlyCost = monthlySalary * 12;
            annualPayroll += yearlyCost;
            payrollParts.push(`${roleNames[i]}: ${monthlySalary.toFixed(0)} × 12 = ${yearlyCost.toFixed(0)}`);
        }
        document.getElementById('annualPayroll').textContent = annualPayroll.toFixed(2);
        const payrollDetailDiv = document.getElementById('annualPayrollDetail');
        if (payrollDetailDiv) {
            const totals = payrollParts.map(p => {
                const match = p.match(/= ([\d.]+)$/);
                return match ? match[1] : '0';
            });
            payrollDetailDiv.textContent = 'Расчет:\n' + payrollParts.join('\n') +
                `\nИтого: ${totals.join(' + ')} = ${annualPayroll.toFixed(2)}`;
        }
        const depreciation = settings.balanceCost * 0.2;
        document.getElementById('depreciationCost').textContent = depreciation.toFixed(2);
        const depreciationDetail = document.getElementById('depreciationDetail');
        if (depreciationDetail) {
            depreciationDetail.textContent = `Расчет:\nАмортизация = Балансовая стоимость × 20%\n= ${settings.balanceCost.toFixed(0)} × 0.2 = ${depreciation.toFixed(2)}`;
        }
        const electricity = settings.equipmentPower * settings.annualTimeFund * settings.electricityTariff;
        document.getElementById('electricityCost').textContent = electricity.toFixed(2);
        const electricityDetail = document.getElementById('electricityDetail');
        if (electricityDetail) {
            electricityDetail.textContent = `Расчет:\nЭлектроэнергия = Мощность × Годовой фонд времени × Тариф\n= ${settings.equipmentPower} × ${settings.annualTimeFund} × ${settings.electricityTariff} = ${electricity.toFixed(2)}`;
        }
        const repairCosts = settings.balanceCost * 0.05;
        document.getElementById('repairCosts').textContent = repairCosts.toFixed(2);
        const repairDetail = document.getElementById('repairDetail');
        if (repairDetail) {
            repairDetail.textContent = `Расчет:\nРемонт = Балансовая стоимость × 5%\n= ${settings.balanceCost.toFixed(0)} × 0.05 = ${repairCosts.toFixed(2)}`;
        }
        const materialsCosts = settings.balanceCost * 0.1;
        document.getElementById('materialsCostOperating').textContent = materialsCosts.toFixed(2);
        const materialsDetail = document.getElementById('materialsOperatingDetail');
        if (materialsDetail) {
            materialsDetail.textContent = `Расчет:\nМатериалы = Балансовая стоимость × 10%\n= ${settings.balanceCost.toFixed(0)} × 0.1 = ${materialsCosts.toFixed(2)}`;
        }
        const totalOperating = annualPayroll + depreciation + electricity + repairCosts + materialsCosts;
        document.getElementById('totalOperatingCosts').textContent = totalOperating.toFixed(2);
        const totalDetail = document.getElementById('totalOperatingDetail');
        if (totalDetail) {
            totalDetail.textContent = `Расчет:\nЗтек = ФОТ + Амортизация + Электроэнергия + Ремонт + Материалы\n` +
                `= ${annualPayroll.toFixed(2)} + ${depreciation.toFixed(2)} + ${electricity.toFixed(2)} + ${repairCosts.toFixed(2)} + ${materialsCosts.toFixed(2)}\n` +
                `= ${totalOperating.toFixed(2)}`;
        }
        return totalOperating;
    }

    function calculateEfficiency() {
        const settings = getSettings();
        const technicalLevelRatio = updateKtu();
        const capitalCosts = calculateCapitalCosts();
        const operatingCosts = calculateOperatingCosts();

        const akCell = document.getElementById('akValueCell');
        if (akCell) {
            akCell.innerHTML = `<strong>${technicalLevelRatio.toFixed(3)}</strong>`;
        }

        const projectReducedCosts = operatingCosts + settings.normativeEfficiency * capitalCosts.projectCosts;
        const analogReducedCosts = operatingCosts * 1.15 + settings.normativeEfficiency * capitalCosts.analogCosts;

        document.getElementById('reducedCostsProject').textContent = projectReducedCosts.toFixed(2);
        document.getElementById('reducedCostsAnalog').textContent = analogReducedCosts.toFixed(2);

        const z2Detail = document.getElementById('reducedCostsProjectDetail');
        if (z2Detail) {
            z2Detail.textContent = `Расчет:\nЗ2 = Зтек + Eн × Kп(проект)\n` +
                `= ${operatingCosts.toFixed(2)} + ${settings.normativeEfficiency} × ${capitalCosts.projectCosts.toFixed(2)}\n` +
                `= ${operatingCosts.toFixed(2)} + ${(settings.normativeEfficiency * capitalCosts.projectCosts).toFixed(2)} = ${projectReducedCosts.toFixed(2)}`;
        }

        const z1Detail = document.getElementById('reducedCostsAnalogDetail');
        if (z1Detail) {
            z1Detail.textContent = `Расчет:\nЗ1 = (Зтек × 1.15) + Eн × Kп(аналог)\n` +
                `= (${operatingCosts.toFixed(2)} × 1.15) + ${settings.normativeEfficiency} × ${capitalCosts.analogCosts.toFixed(2)}\n` +
                `= ${(operatingCosts * 1.15).toFixed(2)} + ${(settings.normativeEfficiency * capitalCosts.analogCosts).toFixed(2)} = ${analogReducedCosts.toFixed(2)}`;
        }

        const annualEffect = (analogReducedCosts * technicalLevelRatio - projectReducedCosts) * settings.annualVolume;
        document.getElementById('annualEffect').textContent = annualEffect.toFixed(2);

        const effectDetail = document.getElementById('annualEffectDetail');
        if (effectDetail) {
            effectDetail.textContent = `Расчет:\nЭ = (З1 × Ak - З2) × N\n` +
                `= (${analogReducedCosts.toFixed(2)} × ${technicalLevelRatio.toFixed(3)} - ${projectReducedCosts.toFixed(2)}) × ${settings.annualVolume}\n` +
                `= (${(analogReducedCosts * technicalLevelRatio).toFixed(2)} - ${projectReducedCosts.toFixed(2)}) × ${settings.annualVolume}\n` +
                `= ${(analogReducedCosts * technicalLevelRatio - projectReducedCosts).toFixed(2)} × ${settings.annualVolume} = ${annualEffect.toFixed(2)}`;
        }

        let paybackPeriodValue = (annualEffect > 0 && capitalCosts.projectCosts > 0) ? capitalCosts.projectCosts / annualEffect : Infinity;
        const actualEfficiencyValue = (paybackPeriodValue > 0 && isFinite(paybackPeriodValue)) ? 1 / paybackPeriodValue : 0;

        updateTableSummary(technicalLevelRatio, capitalCosts, operatingCosts, projectReducedCosts, analogReducedCosts, annualEffect, paybackPeriodValue, actualEfficiencyValue, settings);
    }

    function updateTableSummary(ak, capitalCosts, operatingCosts, projectReduced, analogReduced, annualEffect, paybackPeriod, actualEfficiency, settings) {
        const analogOperatingBase = operatingCosts * 1.15;

        let akCommentText = `Техническое решение `;
        if (Math.abs(ak - 1.0) < 0.01) {
            akCommentText += `полностью соответствует современному эталонному аналогу, обеспечивая необходимую производительность.`;
        } else if (ak > 1.0) {
            const percent = ((ak - 1.0) * 100).toFixed(1);
            akCommentText += `превосходит аналог на ${percent}% по интегральному показателю качества, что гарантирует более высокую производительность и функциональность.`;
        } else {
            const percent = ((1.0 - ak) * 100).toFixed(1);
            akCommentText += `уступает аналогу на ${percent}%, однако это может быть компенсировано значительным снижением затрат на внедрение и эксплуатацию.`;
        }
        document.getElementById('akComment').textContent = akCommentText;

        document.getElementById('kpProjectValue').innerHTML = capitalCosts.projectCosts.toFixed(2) + ' ₽';
        const kpDelta = capitalCosts.projectCosts - capitalCosts.analogCosts;
        let kpComment = '';
        if (kpDelta < 0) {
            const savingPercent = (Math.abs(kpDelta) / capitalCosts.analogCosts * 100).toFixed(1);
            kpComment += `Инвестиционный порог на ${savingPercent}% ниже рыночного аналога (экономия ${Math.abs(kpDelta).toFixed(0)} ₽), что существенно снижает финансовую нагрузку на старте.`;
        } else if (kpDelta > 0) {
            const excessPercent = (kpDelta / capitalCosts.analogCosts * 100).toFixed(1);
            kpComment += `Капитальные затраты проекта превышают стоимость аналога на ${excessPercent}% (перерасход ${kpDelta.toFixed(0)} ₽), что требует дополнительного обоснования окупаемости.`;
        } else {
            kpComment += `Капитальные затраты идентичны рыночному предложению — конкурентное преимущество отсутствует.`;
        }
        document.getElementById('kpComment').textContent = kpComment;

        document.getElementById('ztekProjectValue').innerHTML = operatingCosts.toFixed(2) + ' ₽/год';
        const ztekDelta = operatingCosts - analogOperatingBase;
        let ztekComment = '';
        if (ztekDelta < 0) {
            const savingPercent = (Math.abs(ztekDelta) / analogOperatingBase * 100).toFixed(1);
            ztekComment += `Снижение операционных расходов на ${savingPercent}% относительно аналога обеспечивает долгосрочную экономию ресурсов предприятия.`;
        } else {
            const excessPercent = (ztekDelta / analogOperatingBase * 100).toFixed(1);
            ztekComment += `Эксплуатационные издержки проекта выше на ${excessPercent}%, что может негативно сказаться на совокупной стоимости владения.`;
        }
        document.getElementById('ztekComment').textContent = ztekComment;

        document.getElementById('zpProjectValue').innerHTML = projectReduced.toFixed(2) + ' ₽';
        const zpDelta = projectReduced - analogReduced;
        let zpComment = '';
        if (zpDelta < 0) {
            zpComment += `Интегральный показатель подтверждает суммарную выгоду в ${Math.abs(zpDelta).toFixed(0)} ₽. Проект минимизирует совокупную стоимость владения.`;
        } else {
            zpComment += `Интегральный показатель аналога выгоднее на ${zpDelta.toFixed(0)} ₽. Проект нуждается в оптимизации затратной части.`;
        }
        document.getElementById('zpComment').textContent = zpComment;

        document.getElementById('annualEffectTable').innerHTML = annualEffect.toFixed(2) + ' ₽/год';
        const effectCommentSpan = document.getElementById('effectComment');
        if (annualEffect > 0) {
            effectCommentSpan.textContent = 'Высокий положительный эффект подтверждает стратегическую целесообразность выделения бюджета на реализацию данного решения.';
        } else if (annualEffect < 0) {
            effectCommentSpan.textContent = 'Отрицательный эффект сигнализирует об убыточности проекта — пересмотрите технические или стоимостные параметры.';
        } else {
            effectCommentSpan.textContent = 'Нулевой эффект: проект находится на границе безубыточности, требуется анализ чувствительности.';
        }

        const displayPayback = isFinite(paybackPeriod) ? paybackPeriod.toFixed(2) : '> 10 лет';
        document.getElementById('paybackTable').textContent = displayPayback;
        const paybackNumeric = isFinite(paybackPeriod) ? paybackPeriod : 999;
        const paybackCommentSpan = document.getElementById('paybackComment');
        if (paybackNumeric < 1) {
            paybackCommentSpan.textContent = `Экстремально короткий срок возврата инвестиций (менее 12 месяцев) при нормативе до 3 лет гарантирует высокую ликвидность проекта.`;
        } else if (paybackNumeric < 3) {
            paybackCommentSpan.textContent = `Отличный срок окупаемости (${displayPayback} года) — проект быстро возвращает вложенные средства.`;
        } else if (paybackNumeric <= 5) {
            paybackCommentSpan.textContent = `Приемлемый срок окупаемости (${displayPayback} лет), укладывается в горизонт среднесрочного планирования.`;
        } else {
            paybackCommentSpan.textContent = `Срок возврата инвестиций (${displayPayback} лет) превышает норматив в 3 года, что создает риски потери капитала.`;
        }

        document.getElementById('actualEfficiencyTable').textContent = actualEfficiency.toFixed(3);
        const efficiencyCommentSpan = document.getElementById('efficiencyComment');
        if (actualEfficiency > settings.normativeEfficiency) {
            const times = (actualEfficiency / settings.normativeEfficiency).toFixed(1);
            efficiencyCommentSpan.textContent = `Рентабельность инвестиций в ${times} раз превышает нормативное значение (Eн = ${settings.normativeEfficiency}), что свидетельствует о сверхнормативной эффективности.`;
        } else {
            efficiencyCommentSpan.textContent = `Фактическая эффективность ниже норматива (Eн = ${settings.normativeEfficiency}). Рекомендуется пересмотреть бюджет или сроки реализации.`;
        }

        const insightDiv = document.getElementById('dynamicInsight');
        if (insightDiv) {
            let verdict = '';
            if (annualEffect > 0 && (paybackNumeric <= 3 || actualEfficiency > settings.normativeEfficiency)) {
                verdict = 'Проведенный расчет подтверждает высокую инвестиционную привлекательность и финансовую устойчивость проекта. Благодаря сочетанию низких капитальных вложений и сокращения ежегодных эксплуатационных затрат, проект демонстрирует показатели эффективности, значительно превышающие среднеотраслевые нормативы. Минимальный срок окупаемости минимизирует риски потери капитала. Проект полностью готов к внедрению и рекомендуется к реализации в текущем финансовом периоде.';
            } else if (annualEffect > 0) {
                verdict = 'Проект прибылен, но показатели окупаемости близки к нормативным. Рекомендуется провести оптимизацию капитальных затрат или пересмотреть план-график для улучшения инвестиционных метрик.';
            } else {
                verdict = 'Проект не обеспечивает достаточного экономического эффекта. Необходимо пересмотреть параметры технического уровня, капитальных вложений или оценить возможность использования альтернативных решений.';
            }
            insightDiv.textContent = `Аналитический вывод: ${verdict}`;
        }
    }

    function validateAllInputs() {
        const errors = [];

        const numericFields = [
            { id: 'salaryDeveloper', label: 'Оклад разработчика', min: 30000, max: 1000000, type: 'number' },
            { id: 'salaryAnalyst', label: 'Оклад аналитика', min: 30000, max: 1000000, type: 'number' },
            { id: 'salaryProjectManager', label: 'Оклад руководителя', min: 30000, max: 1000000, type: 'number' },
            { id: 'salaryEngineer', label: 'Оклад инженера', min: 30000, max: 1000000, type: 'number' },
        ];

        numericFields.forEach(field => {
            const el = document.getElementById(field.id);
            if (!el) return;
            const val = el.value.trim();
            if (val === '') {
                errors.push({ fieldId: field.id, message: `Поле «${field.label}» не может быть пустым` });
            } else {
                const numVal = parseFloat(val);
                if (isNaN(numVal) || numVal < field.min || numVal > field.max) {
                    errors.push({ fieldId: field.id, message: `Поле «${field.label}» должно быть числом в диапазоне от ${field.min.toLocaleString('ru-RU')} до ${field.max.toLocaleString('ru-RU')}` });
                }
            }
        });

        const rangeFields = [
            { id: 'coefficientAdditionalSalary', label: 'Коэффициент дополнительной зарплаты', min: 0, max: 1 },
            { id: 'coefficientTaxes', label: 'Коэффициент налогов', min: 0, max: 1 },
            { id: 'normativeEfficiency', label: 'Нормативный коэффициент', min: 0.001, max: 1 },
        ];

        rangeFields.forEach(field => {
            const el = document.getElementById(field.id);
            if (!el) return;
            const val = el.value.trim();
            if (val === '') {
                errors.push({ fieldId: field.id, message: `Поле «${field.label}» не может быть пустым` });
            } else {
                const numVal = parseFloat(val);
                if (isNaN(numVal) || numVal < field.min || numVal > field.max) {
                    errors.push({ fieldId: field.id, message: `Параметр «${field.label}» должен находиться в диапазоне от ${field.min} до ${field.max}` });
                }
            }
        });

        const overheadEl = document.getElementById('coefficientOverhead');
        if (overheadEl) {
            const val = overheadEl.value.trim();
            if (val === '') {
                errors.push({ fieldId: 'coefficientOverhead', message: 'Поле «Коэффициент накладных расходов» не может быть пустым' });
            } else {
                const numVal = parseFloat(val);
                if (isNaN(numVal) || numVal < 0 || numVal > 5) {
                    errors.push({ fieldId: 'coefficientOverhead', message: 'Параметр «Коэффициент накладных расходов» должен находиться в диапазоне от 0 до 5' });
                }
            }
        }

        const positiveIntFields = [
            { id: 'workDaysPerMonth', label: 'Количество рабочих дней в месяце', min: 1, max: 31 },
            { id: 'annualTimeFund', label: 'Годовой фонд рабочего времени', min: 100, max: 8760 },
            { id: 'annualVolumeValue', label: 'Годовой объем внедрения', min: 1, max: 10000 },
        ];

        positiveIntFields.forEach(field => {
            const el = document.getElementById(field.id);
            if (!el) return;
            const val = el.value.trim();
            if (val === '') {
                errors.push({ fieldId: field.id, message: `Поле «${field.label}» не может быть пустым` });
            } else {
                const numVal = parseInt(val, 10);
                if (isNaN(numVal) || numVal < field.min || numVal > field.max) {
                    errors.push({ fieldId: field.id, message: `Поле «${field.label}» — введите целое число от ${field.min} до ${field.max}` });
                }
            }
        });

        const positiveFloatFields = [
            { id: 'machineHourCost', label: 'Стоимость машино-часа', min: 10, max: 50000 },
            { id: 'electricityTariff', label: 'Тариф на электроэнергию', min: 1, max: 50 },
            { id: 'equipmentPower', label: 'Мощность оборудования', min: 0.01, max: 500 },
        ];

        positiveFloatFields.forEach(field => {
            const el = document.getElementById(field.id);
            if (!el) return;
            const val = el.value.trim();
            if (val === '') {
                errors.push({ fieldId: field.id, message: `Поле «${field.label}» не может быть пустым` });
            } else {
                const numVal = parseFloat(val);
                if (isNaN(numVal) || numVal < field.min || numVal > field.max) {
                    errors.push({ fieldId: field.id, message: `Поле «${field.label}» должно быть числом в диапазоне от ${field.min} до ${field.max}` });
                }
            }
        });

        const balanceCostEl = document.getElementById('balanceCost');
        if (balanceCostEl) {
            const val = balanceCostEl.value.trim();
            if (val === '') {
                errors.push({ fieldId: 'balanceCost', message: 'Поле «Балансовая стоимость» не может быть пустым' });
            } else {
                const numVal = parseFloat(val);
                if (isNaN(numVal) || numVal < 0 || numVal > 100000000) {
                    errors.push({ fieldId: 'balanceCost', message: 'Поле «Балансовая стоимость» должно быть числом в диапазоне от 0 до 100 000 000' });
                }
            }
        }

        const materialCostsEl = document.getElementById('materialCosts');
        if (materialCostsEl) {
            const val = materialCostsEl.value.trim();
            if (val === '') {
                errors.push({ fieldId: 'materialCosts', message: 'Поле «Затраты на материалы» не может быть пустым' });
            } else {
                const numVal = parseFloat(val);
                if (isNaN(numVal) || numVal < 0 || numVal > 10000000) {
                    errors.push({ fieldId: 'materialCosts', message: 'Поле «Затраты на материалы» должно быть числом от 0 до 10 000 000' });
                }
            }
        }

        const machineTimeEl = document.getElementById('machineTime');
        if (machineTimeEl) {
            const val = machineTimeEl.value.trim();
            if (val === '') {
                errors.push({ fieldId: 'machineTime', message: 'Поле «Машинное время» не может быть пустым' });
            } else {
                const numVal = parseInt(val, 10);
                if (isNaN(numVal) || numVal < 0 || numVal > 5000) {
                    errors.push({ fieldId: 'machineTime', message: 'Поле «Машинное время» — введите целое число от 0 до 5 000 часов' });
                }
            }
        }

        const analogPriceEl = document.getElementById('analogPurchasePrice');
        if (analogPriceEl) {
            const val = analogPriceEl.value.trim();
            if (val === '') {
                errors.push({ fieldId: 'analogPurchasePrice', message: 'Поле «Цена покупки аналога» не может быть пустым' });
            } else {
                const numVal = parseFloat(val);
                if (isNaN(numVal) || numVal < 1 || numVal > 100000000) {
                    errors.push({ fieldId: 'analogPurchasePrice', message: 'Поле «Цена покупки аналога» должно быть числом от 1 до 100 000 000' });
                }
            }
        }

        const analogInstallEl = document.getElementById('analogInstallationCost');
        if (analogInstallEl) {
            const val = analogInstallEl.value.trim();
            if (val === '') {
                errors.push({ fieldId: 'analogInstallationCost', message: 'Поле «Стоимость установки аналога» не может быть пустым' });
            } else {
                const numVal = parseFloat(val);
                if (isNaN(numVal) || numVal < 0 || numVal > 10000000) {
                    errors.push({ fieldId: 'analogInstallationCost', message: 'Поле «Стоимость установки аналога» должно быть числом от 0 до 10 000 000' });
                }
            }
        }

        const analogEducationEl = document.getElementById('analogEducationCost');
        if (analogEducationEl) {
            const val = analogEducationEl.value.trim();
            if (val === '') {
                errors.push({ fieldId: 'analogEducationCost', message: 'Поле «Стоимость обучения персонала» не может быть пустым' });
            } else {
                const numVal = parseFloat(val);
                if (isNaN(numVal) || numVal < 0 || numVal > 10000000) {
                    errors.push({ fieldId: 'analogEducationCost', message: 'Поле «Стоимость обучения персонала» должно быть числом от 0 до 10 000 000' });
                }
            }
        }

        const ktuTables = [
            { tableId: 'ktuProjectTable', label: 'Проект' },
            { tableId: 'ktuAnalogTable', label: 'Аналог' }
        ];

        ktuTables.forEach(tableInfo => {
            const rows = document.querySelectorAll(`#${tableInfo.tableId} tbody tr`);
            if (rows.length === 0) {
                errors.push({ fieldId: tableInfo.tableId, message: `В таблице «${tableInfo.label}» добавьте хотя бы один показатель` });
                return;
            }
            let weightSum = 0;
            rows.forEach((row, index) => {
                const inputs = row.querySelectorAll('input');
                if (inputs.length >= 2) {
                    const nameVal = inputs[0].value.trim();
                    const weightVal = inputs[1].value.trim();
                    const scoreVal = inputs[2].value.trim();

                    if (!nameVal) {
                        errors.push({ fieldId: inputs[0], message: `${tableInfo.label}, строка ${index + 1}: название показателя не может быть пустым` });
                    } else if (nameVal.length < 3) {
                        errors.push({ fieldId: inputs[0], message: `${tableInfo.label}, строка ${index + 1}: название показателя должно содержать не менее 3 символов` });
                    } else if (nameVal.length > 100) {
                        errors.push({ fieldId: inputs[0], message: `${tableInfo.label}, строка ${index + 1}: название показателя не должно превышать 100 символов` });
                    }

                    if (!weightVal) {
                        errors.push({ fieldId: inputs[1], message: `${tableInfo.label}, строка ${index + 1}: вес не может быть пустым` });
                    } else {
                        const weight = parseFloat(weightVal);
                        if (isNaN(weight) || weight < 0.01 || weight > 1) {
                            errors.push({ fieldId: inputs[1], message: `${tableInfo.label}, строка ${index + 1}: вес должен находиться в пределах от 0,01 до 1` });
                        } else {
                            weightSum += weight;
                        }
                    }

                    if (!scoreVal) {
                        errors.push({ fieldId: inputs[2], message: `${tableInfo.label}, строка ${index + 1}: оценка не может быть пустой` });
                    } else {
                        const score = parseFloat(scoreVal);
                        if (isNaN(score) || score < 1 || score > 5) {
                            errors.push({ fieldId: inputs[2], message: `${tableInfo.label}, строка ${index + 1}: оценка должна быть от 1 до 5` });
                        }
                    }
                }
            });

            if (rows.length > 0 && Math.abs(weightSum - 1.0) > 0.01) {
                errors.push({ fieldId: tableInfo.tableId, message: `${tableInfo.label}: сумма весов составляет ${weightSum.toFixed(3)}, а должна равняться 1,0` });
            }
        });

        const startDateEl = document.getElementById('projectStartDate');
        if (startDateEl) {
            const dateVal = startDateEl.value.trim();
            if (!dateVal) {
                errors.push({ fieldId: 'projectStartDate', message: 'Укажите дату начала проекта' });
            } else {
                const selectedDate = new Date(dateVal);
                const oneYearAgo = new Date();
                oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                oneYearAgo.setHours(0, 0, 0, 0);
                if (selectedDate < oneYearAgo) {
                    errors.push({ fieldId: 'projectStartDate', message: 'Дата начала проекта не может быть раньше, чем год назад от текущей даты' });
                }
            }
        }

        const planRows = document.querySelectorAll('#planTable tbody tr');
        planRows.forEach((row, index) => {
            const inputs = row.querySelectorAll('input');
            if (inputs.length >= 3) {
                const stageName = inputs[0].value.trim();
                const daysVal = inputs[1].value.trim();
                const loadVal = inputs[2].value.trim();

                if (!stageName) {
                    errors.push({ fieldId: inputs[0], message: `План, строка ${index + 1}: название этапа не может быть пустым` });
                } else if (stageName.length < 3) {
                    errors.push({ fieldId: inputs[0], message: `План, строка ${index + 1}: название этапа должно содержать не менее 3 символов` });
                } else if (stageName.length > 100) {
                    errors.push({ fieldId: inputs[0], message: `План, строка ${index + 1}: название этапа не должно превышать 100 символов` });
                }

                if (!daysVal) {
                    errors.push({ fieldId: inputs[1], message: `План, строка ${index + 1}: количество дней не может быть пустым` });
                } else {
                    const days = parseInt(daysVal, 10);
                    if (isNaN(days) || days < 1 || days > 365) {
                        errors.push({ fieldId: inputs[1], message: `План, строка ${index + 1}: введите целое количество дней от 1 до 365` });
                    }
                }

                if (!loadVal) {
                    errors.push({ fieldId: inputs[2], message: `План, строка ${index + 1}: процент загрузки не может быть пустым` });
                } else {
                    const load = parseInt(loadVal, 10);
                    if (isNaN(load) || load < 1 || load > 100) {
                        errors.push({ fieldId: inputs[2], message: `План, строка ${index + 1}: процент загрузки должен быть от 1 до 100` });
                    }
                }
            }
        });

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    function displayValidationErrors(errors) {
        document.querySelectorAll('.field-error, .field-warning').forEach(el => {
            el.classList.remove('field-error', 'field-warning');
        });

        const container = document.getElementById('validation-errors-container');
        if (!container) return;
        container.innerHTML = '';

        if (!errors || errors.length === 0) {
            container.style.display = 'none';
            return;
        }

        errors.forEach(error => {
            let targetEl = null;

            if (error.fieldId instanceof Element) {
                targetEl = error.fieldId;
            } else if (typeof error.fieldId === 'string') {
                targetEl = document.getElementById(error.fieldId);
            }

            if (targetEl) {
                targetEl.classList.add('field-error');
            }

            const errorDiv = document.createElement('div');
            errorDiv.className = 'validation-error-item';
            errorDiv.textContent = error.message;

            if (targetEl) {
                errorDiv.addEventListener('click', function() {
                    if (targetEl) {
                        targetEl.focus();
                        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                });
            } else if (typeof error.fieldId === 'string') {
                errorDiv.dataset.fieldId = error.fieldId;
                errorDiv.addEventListener('click', function() {
                    const panelEl = document.getElementById(this.dataset.fieldId);
                    if (panelEl) {
                        panelEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                });
            }

            container.appendChild(errorDiv);
        });

        container.style.display = 'block';

        const firstError = errors[0];
        if (firstError) {
            let targetEl = null;
            if (firstError.fieldId instanceof Element) {
                targetEl = firstError.fieldId;
            } else if (typeof firstError.fieldId === 'string') {
                targetEl = document.getElementById(firstError.fieldId);
            }

            if (targetEl) {
                const panel = targetEl.closest('.panel');
                if (panel) {
                    const panelId = panel.id;
                    const tabBtn = document.querySelector(`.tab-btn[data-tab="${panelId}"]`);
                    if (tabBtn) {
                        tabBtn.click();
                    }
                }
            } else if (firstError.fieldId === 'ktuProjectTable' || firstError.fieldId === 'ktuAnalogTable') {
                const tabBtn = document.querySelector('.tab-btn[data-tab="ktu"]');
                if (tabBtn) tabBtn.click();
            } else if (firstError.fieldId === 'planTable' || firstError.fieldId === 'projectStartDate') {
                const tabBtn = document.querySelector('.tab-btn[data-tab="plan"]');
                if (tabBtn) tabBtn.click();
            }
        }

        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
})();
