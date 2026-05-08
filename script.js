(function () {
  'use strict';

  var ROLES = ['Разработчик', 'Аналитик', 'Руководитель', 'Инженер'];
  var DEFAULT_ROLE_DAYS = { 'Разработчик': 12, 'Аналитик': 8, 'Руководитель': 5 };

  function getSettings() {
    return {
      salDev: parseFloat(document.getElementById('salDev').value) || 0,
      salAnalyst: parseFloat(document.getElementById('salAnalyst').value) || 0,
      salPM: parseFloat(document.getElementById('salPM').value) || 0,
      salEng: parseFloat(document.getElementById('salEng').value) || 0,
      wd: parseFloat(document.getElementById('wd').value) || 0,
      wc: parseFloat(document.getElementById('wc').value) || 0,
      wn: parseFloat(document.getElementById('wn').value) || 0,
      workDays: parseFloat(document.getElementById('workDaysMonth').value) || 21,
      smch: parseFloat(document.getElementById('smch').value) || 0,
      tariff: parseFloat(document.getElementById('tariff').value) || 0,
      power: parseFloat(document.getElementById('power').value) || 0,
      balCost: parseFloat(document.getElementById('balCost').value) || 0,
      tg: parseFloat(document.getElementById('tg').value) || 2000,
      en: parseFloat(document.getElementById('en').value) || 0.33,
      N: parseFloat(document.getElementById('nVolume').value) || 1
    };
  }

  function getSalaryMap(settings) {
    return { 'Разработчик': settings.salDev, 'Аналитик': settings.salAnalyst, 'Руководитель': settings.salPM, 'Инженер': settings.salEng };
  }

  function initTabs() {
    var tabButtons = document.querySelectorAll('.tab-btn');
    var panels = document.querySelectorAll('.panel');
    tabButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var targetId = this.getAttribute('data-tab');
        tabButtons.forEach(function (b) { b.classList.remove('active'); });
        this.classList.add('active');
        panels.forEach(function (p) { p.classList.remove('active'); });
        document.getElementById(targetId).classList.add('active');
      });
    });
  }

  function createKtuRow() {
    var row = document.createElement('tr');
    row.innerHTML = '<td><input type="text" placeholder="Название" style="width:100%"></td>' +
      '<td><input type="number" step="0.01" value="0.2" style="width:90px"></td>' +
      '<td><input type="number" step="0.1" min="1" max="5" value="3" style="width:80px"></td>';
    return row;
  }

  function addKtuRow(tableId) { document.querySelector('#' + tableId + ' tbody').appendChild(createKtuRow()); }

  function initKtu() {
    document.getElementById('addKtuRowProj').addEventListener('click', function () { addKtuRow('ktuProjectTable'); });
    document.getElementById('addKtuRowAnalog').addEventListener('click', function () { addKtuRow('ktuAnalogTable'); });
    for (var i = 0; i < 2; i++) { addKtuRow('ktuProjectTable'); addKtuRow('ktuAnalogTable'); }
  }

  function calculateJetuWithDetail(tableId, detailElementId) {
    var sum = 0;
    var rows = document.querySelectorAll('#' + tableId + ' tbody tr');
    var terms = [];
    rows.forEach(function (row) {
      var inputs = row.querySelectorAll('input');
      if (inputs.length >= 2) {
        var weight = parseFloat(inputs[1].value) || 0;
        var score = parseFloat(inputs[2].value) || 1;
        var product = weight * score;
        sum += product;
        var name = inputs[0].value || 'показатель';
        terms.push(name + ': ' + weight.toFixed(2) + ' × ' + score.toFixed(1) + ' = ' + product.toFixed(2));
      }
    });
    var detailDiv = document.getElementById(detailElementId);
    if (detailDiv && terms.length) detailDiv.innerHTML = 'Расчет: ' + terms.join(' + ') + ' = ' + sum.toFixed(2);
    else if (detailDiv) detailDiv.innerHTML = 'Нет добавленных показателей';
    return sum;
  }

  function updateKtu() {
    var jetuProject = calculateJetuWithDetail('ktuProjectTable', 'jetuProjDetail');
    var jetuAnalog = calculateJetuWithDetail('ktuAnalogTable', 'jetuAnalogDetail');
    document.getElementById('jetuProj').textContent = jetuProject.toFixed(2);
    document.getElementById('jetuAnalog').textContent = jetuAnalog.toFixed(2);
    var ak = jetuAnalog !== 0 ? jetuProject / jetuAnalog : 1;
    document.getElementById('akValue').textContent = ak.toFixed(3);
    var akDetail = document.getElementById('akDetail');
    if (akDetail) akDetail.innerHTML = 'A<sub>k</sub> = ' + jetuProject.toFixed(2) + ' / ' + jetuAnalog.toFixed(2) + ' = ' + ak.toFixed(3);
    return ak;
  }

  function createPlanRow(role, days, loadPercent) {
    var row = document.createElement('tr');
    var roleOptions = ROLES.map(function (r) { return '<option' + (r === role ? ' selected' : '') + '>' + r + '</option>'; }).join('');
    row.innerHTML = '<td><input value="Этап" style="width:100%"></td><td><select>' + roleOptions + '</select></td>' +
      '<td><input type="number" value="' + days + '" style="width:70px"></td><td><input type="number" value="' + loadPercent + '" step="1" style="width:80px"></td>' +
      '<td class="endDate">—</td><td><button class="btn-outline del-row" type="button">Удалить</button></td>';
    row.querySelector('.del-row').addEventListener('click', function () { row.remove(); recalcAll(); });
    return row;
  }

  function addPlanRow(role, days, loadPercent) { document.querySelector('#planTable tbody').appendChild(createPlanRow(role, days, loadPercent)); }

  function initPlan() {
    document.getElementById('addPlanRow').addEventListener('click', function () { addPlanRow('Разработчик', 5, 100); });
    for (var role in DEFAULT_ROLE_DAYS) { if (DEFAULT_ROLE_DAYS.hasOwnProperty(role)) addPlanRow(role, DEFAULT_ROLE_DAYS[role], 100); }
  }

  function isWeekend(date) { var day = date.getDay(); return day === 0 || day === 6; }

  function addWorkDays(startDate, daysToAdd) {
    var current = new Date(startDate);
    var added = 0;
    while (added < daysToAdd) { if (!isWeekend(current)) added++; if (added < daysToAdd) current.setDate(current.getDate() + 1); }
    return current;
  }

  function calculatePlanDates() {
    var startInput = document.getElementById('startDate').value;
    if (!startInput) return {};
    var currentDate = new Date(startInput);
    if (isNaN(currentDate.getTime())) return {};
    var rows = document.querySelectorAll('#planTable tbody tr');
    var roleDays = {};
    var planDetails = [];
    rows.forEach(function (row, idx) {
      var role = row.querySelector('select').value;
      var days = parseInt(row.querySelectorAll('input')[1].value) || 0;
      var loadPercent = parseInt(row.querySelectorAll('input')[2].value) || 100;
      var workDaysNeeded = Math.ceil(days * (loadPercent / 100));
      var endDate = addWorkDays(currentDate, days);
      row.querySelector('.endDate').textContent = endDate.toLocaleDateString('ru-RU');
      planDetails.push('Этап ' + (idx+1) + ': ' + days + ' дн. × ' + loadPercent + '% = ' + workDaysNeeded + ' чел-дней (' + role + ')');
      currentDate = new Date(endDate);
      currentDate.setDate(currentDate.getDate() + 1);
      if (!roleDays[role]) roleDays[role] = 0;
      roleDays[role] += workDaysNeeded;
    });
    var summaryParts = [];
    for (var role in roleDays) { if (roleDays.hasOwnProperty(role)) summaryParts.push(role + ': ' + roleDays[role] + ' дн.'); }
    document.getElementById('roleDaysSummary').textContent = summaryParts.join(', ');
    var planDetailDiv = document.getElementById('planDetail');
    if (planDetailDiv && planDetails.length) planDetailDiv.innerHTML = planDetails.join('; ');
    return roleDays;
  }

  function calculateKp() {
    var settings = getSettings();
    var roleDays = calculatePlanDates();
    var salaryMap = getSalaryMap(settings);
    var totalBaseSalary = 0;
    var fotDetails = [];
    for (var role in roleDays) {
      if (roleDays.hasOwnProperty(role)) {
        var monthlySalary = salaryMap[role] || 0;
        var dailyRate = monthlySalary / settings.workDays;
        var roleCost = dailyRate * roleDays[role];
        totalBaseSalary += roleCost;
        fotDetails.push(role + ': ' + monthlySalary.toFixed(0) + ' / ' + settings.workDays + ' × ' + roleDays[role] + ' = ' + roleCost.toFixed(2));
      }
    }
    document.getElementById('fotOsn').textContent = totalBaseSalary.toFixed(2);
    var fotDetailDiv = document.getElementById('fotOsnDetail');
    if (fotDetailDiv && fotDetails.length) fotDetailDiv.innerHTML = fotDetails.join(' + ') + ' = ' + totalBaseSalary.toFixed(2);

    var additionalSalary = totalBaseSalary * settings.wd;
    var taxes = (totalBaseSalary + additionalSalary) * settings.wc;
    var overhead = totalBaseSalary * settings.wn;
    var materialCost = parseFloat(document.getElementById('cm').value) || 0;
    var machineHours = parseFloat(document.getElementById('tmv').value) || 0;
    var machineCost = machineHours * settings.smch;
    var kpProject = totalBaseSalary + additionalSalary + taxes + overhead + materialCost + machineCost;

    var kpDetailDiv = document.getElementById('kpProjectDetail');
    if (kpDetailDiv) {
      kpDetailDiv.innerHTML = 'Kп = ((1+' + settings.wd + ')×(1+' + settings.wc + ')+' + settings.wn + ')×' + totalBaseSalary.toFixed(2) +
        ' + ' + materialCost + ' + ' + machineHours + '×' + settings.smch + ' = ' +
        ((1+settings.wd)*(1+settings.wc)+settings.wn).toFixed(3) + '×' + totalBaseSalary.toFixed(2) + ' + ' + materialCost + ' + ' + machineCost +
        ' = ' + kpProject.toFixed(2);
    }

    var analogPrice = parseFloat(document.getElementById('analogPrice').value) || 0;
    var analogInstall = parseFloat(document.getElementById('analogInstall').value) || 0;
    var analogEducation = parseFloat(document.getElementById('analogEdu').value) || 0;
    var kpAnalog = analogPrice + analogInstall + analogEducation;
    document.getElementById('kpProject').textContent = kpProject.toFixed(2);
    document.getElementById('kpAnalog').textContent = kpAnalog.toFixed(2);
    var analogDetail = document.getElementById('kpAnalogDetail');
    if (analogDetail) analogDetail.innerHTML = analogPrice.toFixed(0) + ' + ' + analogInstall.toFixed(0) + ' + ' + analogEducation.toFixed(0) + ' = ' + kpAnalog.toFixed(2);
    return { kpProject: kpProject, kpAnalog: kpAnalog };
  }

  function calculateOperational() {
    var settings = getSettings();
    var salaryMap = getSalaryMap(settings);
    var fotParts = [];
    var annualFot = 0;
    for (var i = 0; i < ROLES.length; i++) {
      var salary = salaryMap[ROLES[i]] || 0;
      var yearCost = salary * 12;
      annualFot += yearCost;
      fotParts.push(ROLES[i] + ': ' + salary.toFixed(0) + ' × 12 = ' + yearCost.toFixed(0));
    }
    document.getElementById('operFot').textContent = annualFot.toFixed(2);
    var fotDetail = document.getElementById('operFotDetail');
    if (fotDetail) fotDetail.innerHTML = fotParts.join(' + ') + ' = ' + annualFot.toFixed(2);

    var amortization = settings.balCost * 0.2;
    document.getElementById('operAmort').textContent = amortization.toFixed(2);
    var amortDetail = document.getElementById('operAmortDetail');
    if (amortDetail) amortDetail.innerHTML = settings.balCost.toFixed(0) + ' × 0.2 = ' + amortization.toFixed(2);

    var energyCost = settings.power * settings.tg * settings.tariff;
    document.getElementById('operEnergy').textContent = energyCost.toFixed(2);
    var energyDetail = document.getElementById('operEnergyDetail');
    if (energyDetail) energyDetail.innerHTML = settings.power + ' × ' + settings.tg + ' × ' + settings.tariff + ' = ' + energyCost.toFixed(2);

    var repairCost = settings.balCost * 0.05;
    document.getElementById('operRepair').textContent = repairCost.toFixed(2);
    var repairDetail = document.getElementById('operRepairDetail');
    if (repairDetail) repairDetail.innerHTML = settings.balCost.toFixed(0) + ' × 0.05 = ' + repairCost.toFixed(2);

    var materialCost = settings.balCost * 0.1;
    document.getElementById('operMat').textContent = materialCost.toFixed(2);
    var matDetail = document.getElementById('operMatDetail');
    if (matDetail) matDetail.innerHTML = settings.balCost.toFixed(0) + ' × 0.1 = ' + materialCost.toFixed(2);

    var totalOperational = annualFot + amortization + energyCost + repairCost + materialCost;
    document.getElementById('ztekTotal').textContent = totalOperational.toFixed(2);
    var totalDetail = document.getElementById('ztekTotalDetail');
    if (totalDetail) totalDetail.innerHTML = annualFot.toFixed(2) + ' + ' + amortization.toFixed(2) + ' + ' + energyCost.toFixed(2) + ' + ' + repairCost.toFixed(2) + ' + ' + materialCost.toFixed(2) + ' = ' + totalOperational.toFixed(2);
    return totalOperational;
  }

  function calculateEfficiency() {
    var settings = getSettings();
    var ak = updateKtu();
    var kpData = calculateKp();
    var operationalCost = calculateOperational();
    var zProject = operationalCost + settings.en * kpData.kpProject;
    var zAnalog = operationalCost * 1.15 + settings.en * kpData.kpAnalog;
    document.getElementById('z2').textContent = zProject.toFixed(2);
    document.getElementById('z1').textContent = zAnalog.toFixed(2);
    var z2Detail = document.getElementById('z2Detail');
    if (z2Detail) z2Detail.innerHTML = operationalCost.toFixed(2) + ' + ' + settings.en + ' × ' + kpData.kpProject.toFixed(2) + ' = ' + zProject.toFixed(2);
    var z1Detail = document.getElementById('z1Detail');
    if (z1Detail) z1Detail.innerHTML = '(' + operationalCost.toFixed(2) + ' × 1.15) + ' + settings.en + ' × ' + kpData.kpAnalog.toFixed(2) + ' = ' + (operationalCost * 1.15).toFixed(2) + ' + ' + (settings.en * kpData.kpAnalog).toFixed(2) + ' = ' + zAnalog.toFixed(2);
    var annualEffect = (zAnalog * ak - zProject) * settings.N;
    document.getElementById('godEffect').textContent = annualEffect.toFixed(2);
    var effectDetail = document.getElementById('godEffectDetail');
    if (effectDetail) effectDetail.innerHTML = '(' + zAnalog.toFixed(2) + ' × ' + ak.toFixed(3) + ' - ' + zProject.toFixed(2) + ') × ' + settings.N + ' = ' + annualEffect.toFixed(2);
    var paybackPeriod = (annualEffect > 0 && kpData.kpProject > 0) ? kpData.kpProject / annualEffect : Infinity;
    var efficiencyRatio = (paybackPeriod > 0 && isFinite(paybackPeriod)) ? 1 / paybackPeriod : 0;
    document.getElementById('tok').textContent = isFinite(paybackPeriod) ? paybackPeriod.toFixed(2) : '—';
    document.getElementById('efact').textContent = efficiencyRatio.toFixed(3);
    var tokDetail = document.getElementById('tokDetail');
    if (tokDetail && isFinite(paybackPeriod)) tokDetail.innerHTML = kpData.kpProject.toFixed(2) + ' / ' + annualEffect.toFixed(2) + ' = ' + paybackPeriod.toFixed(2);
    var efactDetail = document.getElementById('efactDetail');
    if (efactDetail && isFinite(paybackPeriod)) efactDetail.innerHTML = '1 / ' + paybackPeriod.toFixed(2) + ' = ' + efficiencyRatio.toFixed(3);
    updateExtendedSummary(ak, kpData, operationalCost, zProject, zAnalog, annualEffect, paybackPeriod, efficiencyRatio, settings);
    updateResume(ak, kpData, annualEffect, paybackPeriod, efficiencyRatio);
  }

  function updateResume(ak, kpData, annualEffect, paybackPeriod, efficiencyRatio) {
    var html = '<div>Ak: ' + ak.toFixed(3) + ' | Kп проект: ' + kpData.kpProject.toFixed(0) + ' руб. | Аналог: ' + kpData.kpAnalog.toFixed(0) + ' руб.</div>' +
      '<div>Годовой эффект: ' + annualEffect.toFixed(0) + ' руб./год | Срок окупаемости: ' + (isFinite(paybackPeriod) ? paybackPeriod.toFixed(2) + ' лет' : '> 10 лет') + ' | Eф: ' + efficiencyRatio.toFixed(3) + '</div>';
    document.getElementById('resumeContent').innerHTML = html;
  }

  function updateExtendedSummary(ak, kpData, operationalCost, zProject, zAnalog, annualEffect, paybackPeriod, efficiencyRatio, settings) {
    var ztekAnalogBase = operationalCost * 1.15;
    document.getElementById('akTableProj')?.setAttribute('colspan', '2');
    var akCell = document.getElementById('akTableProj');
    if (akCell) akCell.innerHTML = '<strong>' + ak.toFixed(3) + '</strong>';
    document.getElementById('kpProjectVal').innerHTML = kpData.kpProject.toFixed(2) + ' ₽';
    document.getElementById('kpAnalogVal').innerHTML = kpData.kpAnalog.toFixed(2) + ' ₽';
    var kpDelta = kpData.kpProject - kpData.kpAnalog;
    document.getElementById('kpDeltaMsg').innerHTML = kpDelta < 0 ? 'Проект дешевле на ' + Math.abs(kpDelta).toFixed(0) + ' ₽' : (kpDelta > 0 ? 'Аналог дешевле на ' + kpDelta.toFixed(0) + ' ₽' : 'Равны');
    document.getElementById('ztekProjectVal').innerHTML = operationalCost.toFixed(2) + ' ₽/год';
    document.getElementById('ztekAnalogVal').innerHTML = ztekAnalogBase.toFixed(2) + ' ₽/год';
    var ztekDelta = operationalCost - ztekAnalogBase;
    document.getElementById('ztekDeltaMsg').innerHTML = ztekDelta < 0 ? 'Проект выгоднее на ' + Math.abs(ztekDelta).toFixed(0) + ' ₽/год' : (ztekDelta > 0 ? 'Аналог экономичнее на ' + ztekDelta.toFixed(0) + ' ₽/год' : 'Одинаковы');
    document.getElementById('zpProjectVal').innerHTML = zProject.toFixed(2) + ' ₽';
    document.getElementById('zpAnalogVal').innerHTML = zAnalog.toFixed(2) + ' ₽';
    var zpDelta = zProject - zAnalog;
    document.getElementById('zpDeltaMsg').innerHTML = zpDelta < 0 ? 'Ниже на ' + Math.abs(zpDelta).toFixed(0) + ' ₽ (проект эффективнее)' : (zpDelta > 0 ? 'Аналог выгоднее на ' + zpDelta.toFixed(0) + ' ₽' : 'Равны');
    document.getElementById('godEffectTable').innerHTML = annualEffect.toFixed(2) + ' ₽/год';
    var effectCommentSpan = document.getElementById('effectComment');
    if (annualEffect > 0) effectCommentSpan.innerHTML = 'Положительный эффект, внедрение целесообразно';
    else if (annualEffect < 0) effectCommentSpan.innerHTML = 'Отрицательный эффект, проект невыгоден';
    else effectCommentSpan.innerHTML = 'Нулевой эффект';
    var tokValue = isFinite(paybackPeriod) ? paybackPeriod.toFixed(2) : '> 10 лет';
    if (tokValue === 'Infinity') tokValue = '> 10 лет';
    document.getElementById('tokTable').innerHTML = tokValue;
    document.getElementById('efactTable').innerHTML = efficiencyRatio.toFixed(3);
    var tokNum = isFinite(paybackPeriod) ? paybackPeriod : 999;
    var tokCommentSpan = document.getElementById('tokComment');
    if (tokNum < 3) tokCommentSpan.innerHTML = 'Отличный срок (менее 3 лет) — высокая привлекательность';
    else if (tokNum <= 5) tokCommentSpan.innerHTML = 'Приемлемый срок окупаемости (3–5 лет)';
    else tokCommentSpan.innerHTML = 'Срок превышает нормативный (3 года), требуется анализ';
    var efactNum = efficiencyRatio;
    var efactCommentSpan = document.getElementById('efactComment');
    if (efactNum > settings.en) efactCommentSpan.innerHTML = 'Eф = ' + efficiencyRatio.toFixed(3) + ' > Eн = ' + settings.en + ' → инвестиции эффективны';
    else if (efactNum === settings.en) efactCommentSpan.innerHTML = 'Эффективность на уровне норматива';
    else efactCommentSpan.innerHTML = 'Eф = ' + efficiencyRatio.toFixed(3) + ' < Eн = ' + settings.en + ', проект нецелесообразен';
    var insightDiv = document.getElementById('dynamicInsight');
    if (insightDiv) {
      var verdict = '';
      if (annualEffect > 0 && (tokNum <= 3 || efactNum > settings.en)) verdict = 'Проект демонстрирует высокую экономическую эффективность, превышает нормативные требования. Рекомендуется к реализации.';
      else if (annualEffect > 0) verdict = 'Проект прибылен, но показатели окупаемости близки к нормативным. Рекомендуется оптимизация затрат либо увеличение объема N.';
      else verdict = 'На данный момент проект не обеспечивает достаточного эффекта. Пересмотрите настройки: стоимость аналога, KTU, план-график или эксплуатационные издержки.';
      insightDiv.innerHTML = 'Аналитический вывод: ' + verdict + '<br><small>Данные пересчитаны с учетом всех параметров.</small>';
    }
  }

  function recalcAll() { calculateEfficiency(); }

  function initApp() {
    initTabs();
    initKtu();
    initPlan();
    recalcAll();
    document.addEventListener('input', function (event) { if (event.target.closest('.panel')) recalcAll(); });
    document.addEventListener('change', function (event) { if (event.target.closest('.panel')) recalcAll(); });
  }

  window.addEventListener('DOMContentLoaded', initApp);
  window.recalcAll = recalcAll;
})();
