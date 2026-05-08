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
      annualVolume: parseFloat(document.getElementById('annualVolume').value) || 1
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

  function createKtuRow() {
    const row = document.createElement('tr');
    row.innerHTML = '<td><input type="text" placeholder="Название" style="width:100%"></td>' +
      '<td><input type="number" step="0.01" value="0.2" style="width:90px"></td>' +
      '<td><input type="number" step="0.1" min="1" max="5" value="3" style="width:80px"></td>';
    return row;
  }

  function addKtuRow(tableId) {
    document.querySelector('#' + tableId + ' tbody').appendChild(createKtuRow());
  }

  function initKtu() {
    document.getElementById('addKtuRowProject').addEventListener('click', () => addKtuRow('ktuProjectTable'));
    document.getElementById('addKtuRowAnalog').addEventListener('click', () => addKtuRow('ktuAnalogTable'));
    for (let i = 0; i < 2; i++) {
      addKtuRow('ktuProjectTable');
      addKtuRow('ktuAnalogTable');
    }
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
        formattedText += `\nИтого: ${calculationLines.map((line, idx) => {
          const match = line.match(/= ([\d.]+)$/);
          return match ? match[1] : '0';
        }).join(' + ')} = ${totalSum.toFixed(2)}`;
        detailDiv.textContent = formattedText;
        detailDiv.style.whiteSpace = 'pre-line';
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
    document.getElementById('akValue').textContent = technicalLevelRatio.toFixed(3);
    const akDetailDiv = document.getElementById('akDetail');
    if (akDetailDiv) {
      akDetailDiv.textContent = `Расчет:\nA<sub>k</sub> = ${jetuProject.toFixed(2)} / ${jetuAnalog.toFixed(2)} = ${technicalLevelRatio.toFixed(3)}`;
      akDetailDiv.style.whiteSpace = 'pre-line';
    }
    return technicalLevelRatio;
  }

  function createPlanRow(role, days, loadPercent) {
    const row = document.createElement('tr');
    const roleOptions = roleNames.map(r => `<option${r === role ? ' selected' : ''}>${r}</option>`).join('');
    row.innerHTML = '<td><input value="Этап" style="width:100%"></td>' +
      '<td><select>' + roleOptions + '</select></td>' +
      '<td><input type="number" value="' + days + '" style="width:70px"></td>' +
      '<td><input type="number" value="' + loadPercent + '" step="1" style="width:80px"></td>' +
      '<td class="endDate">—</td>' +
      '<td><button class="btn-outline delete-row-button" type="button">Удалить</button></td>';
    row.querySelector('.delete-row-button').addEventListener('click', function () { row.remove(); recalcAll(); });
    return row;
  }

  function addPlanRow(role, days, loadPercent) {
    document.querySelector('#planTable tbody').appendChild(createPlanRow(role, days, loadPercent));
  }

  function initPlan() {
    document.getElementById('addPlanRow').addEventListener('click', () => addPlanRow('Разработчик', 5, 100));
    for (const role in defaultRoleDays) {
      if (defaultRoleDays.hasOwnProperty(role)) {
        addPlanRow(role, defaultRoleDays[role], 100);
      }
    }
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
      const role = row.querySelector('select').value;
      const daysCount = parseInt(row.querySelectorAll('input')[1].value) || 0;
      const loadPercent = parseInt(row.querySelectorAll('input')[2].value) || 100;
      const actualWorkDays = Math.ceil(daysCount * (loadPercent / 100));
      const endDate = addWorkDays(currentDate, daysCount);
      row.querySelector('.endDate').textContent = endDate.toLocaleDateString('ru-RU');
      planCalculationLines.push(`Этап ${stageNumber}: ${daysCount} дн. × ${loadPercent}% = ${actualWorkDays} чел-дней (${role})`);
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
      planDetailDiv.style.whiteSpace = 'pre-line';
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
      fotDetailDiv.textContent = 'Расчет:\n' + fotCalculationLines.join('\n') + 
        `\nИтого: ${fotCalculationLines.map(line => {
          const match = line.match(/= ([\d.]+)$/);
          return match ? match[1] : '0';
        }).join(' + ')} = ${totalBaseSalary.toFixed(2)}`;
      fotDetailDiv.style.whiteSpace = 'pre-line';
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
      kpDetailDiv.textContent = `Расчет:\nKп = ((1+W<sub>d</sub>)×(1+W<sub>c</sub>)+W<sub>н</sub>) × ΣЗ<sub>оi</sub> + C<sub>м</sub> + t<sub>мв</sub> × S<sub>мч</sub>\n` +
        `Kп = ((1+${settings.additionalSalaryRatio})×(1+${settings.taxRatio})+${settings.overheadRatio}) × ${totalBaseSalary.toFixed(2)} + ${materialCost} + ${machineHours}×${settings.machineHourCost}\n` +
        `Kп = ${sumMultiplier.toFixed(3)} × ${totalBaseSalary.toFixed(2)} + ${materialCost} + ${machineCost.toFixed(2)}\n` +
        `Kп = ${(sumMultiplier * totalBaseSalary).toFixed(2)} + ${materialCost} + ${machineCost.toFixed(2)} = ${capitalCostsProject.toFixed(2)}`;
      kpDetailDiv.style.whiteSpace = 'pre-line';
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
      analogDetailDiv.style.whiteSpace = 'pre-line';
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
      payrollDetailDiv.textContent = 'Расчет:\n' + payrollParts.join('\n') + 
        `\nИтого: ${payrollParts.map(p => {
          const match = p.match(/= ([\d.]+)$/);
          return match ? match[1] : '0';
        }).join(' + ')} = ${annualPayroll.toFixed(2)}`;
      payrollDetailDiv.style.whiteSpace = 'pre-line';
    }
    const depreciation = settings.balanceCost * 0.2;
    document.getElementById('depreciationCost').textContent = depreciation.toFixed(2);
    const depreciationDetail = document.getElementById('depreciationDetail');
    if (depreciationDetail) {
      depreciationDetail.textContent = `Расчет:\nАмортизация = Балансовая стоимость × 20%\n= ${settings.balanceCost.toFixed(0)} × 0.2 = ${depreciation.toFixed(2)}`;
      depreciationDetail.style.whiteSpace = 'pre-line';
    }
    const electricity = settings.equipmentPower * settings.annualTimeFund * settings.electricityTariff;
    document.getElementById('electricityCost').textContent = electricity.toFixed(2);
    const electricityDetail = document.getElementById('electricityDetail');
    if (electricityDetail) {
      electricityDetail.textContent = `Расчет:\nЭлектроэнергия = Мощность × Годовой фонд времени × Тариф\n= ${settings.equipmentPower} × ${settings.annualTimeFund} × ${settings.electricityTariff} = ${electricity.toFixed(2)}`;
      electricityDetail.style.whiteSpace = 'pre-line';
    }
    const repairCosts = settings.balanceCost * 0.05;
    document.getElementById('repairCosts').textContent = repairCosts.toFixed(2);
    const repairDetail = document.getElementById('repairDetail');
    if (repairDetail) {
      repairDetail.textContent = `Расчет:\nРемонт = Балансовая стоимость × 5%\n= ${settings.balanceCost.toFixed(0)} × 0.05 = ${repairCosts.toFixed(2)}`;
      repairDetail.style.whiteSpace = 'pre-line';
    }
    const materialsCosts = settings.balanceCost * 0.1;
    document.getElementById('materialsCostOperating').textContent = materialsCosts.toFixed(2);
    const materialsDetail = document.getElementById('materialsOperatingDetail');
    if (materialsDetail) {
      materialsDetail.textContent = `Расчет:\nМатериалы = Балансовая стоимость × 10%\n= ${settings.balanceCost.toFixed(0)} × 0.1 = ${materialsCosts.toFixed(2)}`;
      materialsDetail.style.whiteSpace = 'pre-line';
    }
    const totalOperating = annualPayroll + depreciation + electricity + repairCosts + materialsCosts;
    document.getElementById('totalOperatingCosts').textContent = totalOperating.toFixed(2);
    const totalDetail = document.getElementById('totalOperatingDetail');
    if (totalDetail) {
      totalDetail.textContent = `Расчет:\nЗ<sub>тек</sub> = ФОТ + Амортизация + Электроэнергия + Ремонт + Материалы\n` +
        `= ${annualPayroll.toFixed(2)} + ${depreciation.toFixed(2)} + ${electricity.toFixed(2)} + ${repairCosts.toFixed(2)} + ${materialsCosts.toFixed(2)}\n` +
        `= ${totalOperating.toFixed(2)}`;
      totalDetail.style.whiteSpace = 'pre-line';
    }
    return totalOperating;
  }

  function calculateEfficiency() {
    const settings = getSettings();
    const technicalLevelRatio = updateKtu();
    const capitalCosts = calculateCapitalCosts();
    const operatingCosts = calculateOperatingCosts();
    const projectReducedCosts = operatingCosts + settings.normativeEfficiency * capitalCosts.projectCosts;
    const analogReducedCosts = operatingCosts * 1.15 + settings.normativeEfficiency * capitalCosts.analogCosts;
    document.getElementById('reducedCostsProject').textContent = projectReducedCosts.toFixed(2);
    document.getElementById('reducedCostsAnalog').textContent = analogReducedCosts.toFixed(2);
    const z2Detail = document.getElementById('reducedCostsProjectDetail');
    if (z2Detail) {
      z2Detail.textContent = `Расчет:\nЗ<sub>2</sub> = З<sub>тек</sub> + E<sub>н</sub> × K<sub>п</sub>(проект)\n` +
        `= ${operatingCosts.toFixed(2)} + ${settings.normativeEfficiency} × ${capitalCosts.projectCosts.toFixed(2)}\n` +
        `= ${operatingCosts.toFixed(2)} + ${(settings.normativeEfficiency * capitalCosts.projectCosts).toFixed(2)} = ${projectReducedCosts.toFixed(2)}`;
      z2Detail.style.whiteSpace = 'pre-line';
    }
    const z1Detail = document.getElementById('reducedCostsAnalogDetail');
    if (z1Detail) {
      z1Detail.textContent = `Расчет:\nЗ<sub>1</sub> = (З<sub>тек</sub> × 1.15) + E<sub>н</sub> × K<sub>п</sub>(аналог)\n` +
        `= (${operatingCosts.toFixed(2)} × 1.15) + ${settings.normativeEfficiency} × ${capitalCosts.analogCosts.toFixed(2)}\n` +
        `= ${(operatingCosts * 1.15).toFixed(2)} + ${(settings.normativeEfficiency * capitalCosts.analogCosts).toFixed(2)} = ${analogReducedCosts.toFixed(2)}`;
      z1Detail.style.whiteSpace = 'pre-line';
    }
    const annualEffect = (analogReducedCosts * technicalLevelRatio - projectReducedCosts) * settings.annualVolume;
    document.getElementById('annualEffect').textContent = annualEffect.toFixed(2);
    const effectDetail = document.getElementById('annualEffectDetail');
    if (effectDetail) {
      effectDetail.textContent = `Расчет:\nЭ = (З<sub>1</sub> × A<sub>k</sub> - З<sub>2</sub>) × N\n` +
        `= (${analogReducedCosts.toFixed(2)} × ${technicalLevelRatio.toFixed(3)} - ${projectReducedCosts.toFixed(2)}) × ${settings.annualVolume}\n` +
        `= (${(analogReducedCosts * technicalLevelRatio).toFixed(2)} - ${projectReducedCosts.toFixed(2)}) × ${settings.annualVolume}\n` +
        `= ${(analogReducedCosts * technicalLevelRatio - projectReducedCosts).toFixed(2)} × ${settings.annualVolume} = ${annualEffect.toFixed(2)}`;
      effectDetail.style.whiteSpace = 'pre-line';
    }
    let paybackPeriodValue = (annualEffect > 0 && capitalCosts.projectCosts > 0) ? capitalCosts.projectCosts / annualEffect : Infinity;
    const actualEfficiencyValue = (paybackPeriodValue > 0 && isFinite(paybackPeriodValue)) ? 1 / paybackPeriodValue : 0;
    const displayPayback = isFinite(paybackPeriodValue) ? paybackPeriodValue.toFixed(2) : '—';
    document.getElementById('paybackPeriod').textContent = displayPayback;
    document.getElementById('actualEfficiency').textContent = actualEfficiencyValue.toFixed(3);
    const paybackDetail = document.getElementById('paybackPeriodDetail');
    if (paybackDetail && isFinite(paybackPeriodValue)) {
      paybackDetail.textContent = `Расчет:\nT<sub>ок</sub> = K<sub>п</sub>(проект) / Годовой эффект\n` +
        `= ${capitalCosts.projectCosts.toFixed(2)} / ${annualEffect.toFixed(2)} = ${paybackPeriodValue.toFixed(2)} лет`;
      paybackDetail.style.whiteSpace = 'pre-line';
    }
    const efactDetail = document.getElementById('actualEfficiencyDetail');
    if (efactDetail && isFinite(paybackPeriodValue)) {
      efactDetail.textContent = `Расчет:\nE<sub>ф</sub> = 1 / T<sub>ок</sub>\n= 1 / ${paybackPeriodValue.toFixed(2)} = ${actualEfficiencyValue.toFixed(3)}`;
      efactDetail.style.whiteSpace = 'pre-line';
    }
    updateExtendedSummary(technicalLevelRatio, capitalCosts, operatingCosts, projectReducedCosts, analogReducedCosts, annualEffect, paybackPeriodValue, actualEfficiencyValue, settings);
    updateResumeBlock(technicalLevelRatio, capitalCosts, annualEffect, paybackPeriodValue, actualEfficiencyValue);
  }

  function updateResumeBlock(ak, capitalCosts, annualEffect, paybackPeriod, actualEfficiency) {
    const displayPayback = isFinite(paybackPeriod) ? paybackPeriod.toFixed(2) + ' лет' : '> 10 лет';
    const html = `<div>Ak: ${ak.toFixed(3)} | Kп проект: ${capitalCosts.projectCosts.toFixed(0)} руб. | Аналог: ${capitalCosts.analogCosts.toFixed(0)} руб.</div>` +
      `<div>Годовой эффект: ${annualEffect.toFixed(0)} руб./год | Срок окупаемости: ${displayPayback} | Eф: ${actualEfficiency.toFixed(3)}</div>`;
    document.getElementById('resumeContent').innerHTML = html;
  }

  function updateExtendedSummary(ak, capitalCosts, operatingCosts, projectReduced, analogReduced, annualEffect, paybackPeriod, actualEfficiency, settings) {
    const analogOperatingBase = operatingCosts * 1.15;
    document.getElementById('akTableProject')?.setAttribute('colspan', '2');
    const akCell = document.getElementById('akTableProject');
    if (akCell) akCell.innerHTML = `<strong>${ak.toFixed(3)}</strong>`;
    document.getElementById('kpProjectValue').innerHTML = capitalCosts.projectCosts.toFixed(2) + ' ₽';
    document.getElementById('kpAnalogValue').innerHTML = capitalCosts.analogCosts.toFixed(2) + ' ₽';
    const kpDelta = capitalCosts.projectCosts - capitalCosts.analogCosts;
    document.getElementById('kpDeltaMessage').innerHTML = kpDelta < 0 ? `Проект дешевле на ${Math.abs(kpDelta).toFixed(0)} ₽` : (kpDelta > 0 ? `Аналог дешевле на ${kpDelta.toFixed(0)} ₽` : 'Равны');
    document.getElementById('ztekProjectValue').innerHTML = operatingCosts.toFixed(2) + ' ₽/год';
    document.getElementById('ztekAnalogValue').innerHTML = analogOperatingBase.toFixed(2) + ' ₽/год';
    const ztekDelta = operatingCosts - analogOperatingBase;
    document.getElementById('ztekDeltaMessage').innerHTML = ztekDelta < 0 ? `Проект выгоднее на ${Math.abs(ztekDelta).toFixed(0)} ₽/год` : (ztekDelta > 0 ? `Аналог экономичнее на ${ztekDelta.toFixed(0)} ₽/год` : 'Одинаковы');
    document.getElementById('zpProjectValue').innerHTML = projectReduced.toFixed(2) + ' ₽';
    document.getElementById('zpAnalogValue').innerHTML = analogReduced.toFixed(2) + ' ₽';
    const zpDelta = projectReduced - analogReduced;
    document.getElementById('zpDeltaMessage').innerHTML = zpDelta < 0 ? `Ниже на ${Math.abs(zpDelta).toFixed(0)} ₽ (проект эффективнее)` : (zpDelta > 0 ? `Аналог выгоднее на ${zpDelta.toFixed(0)} ₽` : 'Равны');
    document.getElementById('annualEffectTable').innerHTML = annualEffect.toFixed(2) + ' ₽/год';
    const effectCommentSpan = document.getElementById('effectComment');
    if (annualEffect > 0) effectCommentSpan.innerHTML = 'Положительный эффект, внедрение целесообразно';
    else if (annualEffect < 0) effectCommentSpan.innerHTML = 'Отрицательный эффект, проект невыгоден';
    else effectCommentSpan.innerHTML = 'Нулевой эффект';
    const displayPayback = isFinite(paybackPeriod) ? paybackPeriod.toFixed(2) : '> 10 лет';
    document.getElementById('paybackTable').innerHTML = displayPayback;
    document.getElementById('actualEfficiencyTable').innerHTML = actualEfficiency.toFixed(3);
    const paybackNumeric = isFinite(paybackPeriod) ? paybackPeriod : 999;
    const paybackCommentSpan = document.getElementById('paybackComment');
    if (paybackNumeric < 3) paybackCommentSpan.innerHTML = 'Отличный срок (менее 3 лет) — высокая привлекательность';
    else if (paybackNumeric <= 5) paybackCommentSpan.innerHTML = 'Приемлемый срок окупаемости (3–5 лет)';
    else paybackCommentSpan.innerHTML = 'Срок превышает нормативный (3 года), требуется анализ';
    const efficiencyCommentSpan = document.getElementById('efficiencyComment');
    if (actualEfficiency > settings.normativeEfficiency) efficiencyCommentSpan.innerHTML = `Eф = ${actualEfficiency.toFixed(3)} > Eн = ${settings.normativeEfficiency} → инвестиции эффективны`;
    else if (actualEfficiency === settings.normativeEfficiency) efficiencyCommentSpan.innerHTML = 'Эффективность на уровне норматива';
    else efficiencyCommentSpan.innerHTML = `Eф = ${actualEfficiency.toFixed(3)} < Eн = ${settings.normativeEfficiency}, проект нецелесообразен`;
    const insightDiv = document.getElementById('dynamicInsight');
    if (insightDiv) {
      let verdict = '';
      if (annualEffect > 0 && (paybackNumeric <= 3 || actualEfficiency > settings.normativeEfficiency)) {
        verdict = 'Проект демонстрирует высокую экономическую эффективность, превышает нормативные требования. Рекомендуется к реализации.';
      } else if (annualEffect > 0) {
        verdict = 'Проект прибылен, но показатели окупаемости близки к нормативным. Рекомендуется оптимизация затрат либо увеличение объема N.';
      } else {
        verdict = 'На данный момент проект не обеспечивает достаточного эффекта. Пересмотрите настройки: стоимость аналога, КТУ, план-график или эксплуатационные издержки.';
      }
      insightDiv.innerHTML = `Аналитический вывод: ${verdict} Данные пересчитаны с учетом всех параметров.`;
    }
  }

  function recalcAll() {
    calculateEfficiency();
  }

  function initApp() {
    initTabs();
    initKtu();
    initPlan();
    recalcAll();
    document.addEventListener('input', function (event) {
      if (event.target.closest('.panel')) recalcAll();
    });
    document.addEventListener('change', function (event) {
      if (event.target.closest('.panel')) recalcAll();
    });
  }

  window.addEventListener('DOMContentLoaded', initApp);
  window.recalcAll = recalcAll;
})();
