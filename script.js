(function () {
  'use strict';

  var ROLES = ['Разработчик', 'Аналитик', 'Руководитель', 'Инженер'];
  var DEFAULT_ROLE_DAYS = {
    'Разработчик': 12,
    'Аналитик': 8,
    'Руководитель': 5
  };

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
    return {
      'Разработчик': settings.salDev,
      'Аналитик': settings.salAnalyst,
      'Руководитель': settings.salPM,
      'Инженер': settings.salEng
    };
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

  function addKtuRow(tableId) {
    var tbody = document.querySelector('#' + tableId + ' tbody');
    tbody.appendChild(createKtuRow());
  }

  function initKtu() {
    document.getElementById('addKtuRowProj').addEventListener('click', function () { addKtuRow('ktuProjectTable'); });
    document.getElementById('addKtuRowAnalog').addEventListener('click', function () { addKtuRow('ktuAnalogTable'); });
    for (var i = 0; i < 2; i++) {
      addKtuRow('ktuProjectTable');
      addKtuRow('ktuAnalogTable');
    }
  }

  function calculateJetu(tableId) {
    var sum = 0;
    var rows = document.querySelectorAll('#' + tableId + ' tbody tr');
    rows.forEach(function (row) {
      var inputs = row.querySelectorAll('input');
      if (inputs.length >= 2) {
        var weight = parseFloat(inputs[1].value) || 0;
        var score = parseFloat(inputs[2].value) || 1;
        sum += weight * score;
      }
    });
    return sum;
  }

  function updateKtu() {
    var jetuProject = calculateJetu('ktuProjectTable');
    var jetuAnalog = calculateJetu('ktuAnalogTable');
    document.getElementById('jetuProj').textContent = jetuProject.toFixed(2);
    document.getElementById('jetuAnalog').textContent = jetuAnalog.toFixed(2);
    var ak = jetuAnalog !== 0 ? jetuProject / jetuAnalog : 1;
    document.getElementById('akValue').textContent = ak.toFixed(3);
    return ak;
  }

  function createPlanRow(role, days, loadPercent) {
    var row = document.createElement('tr');
    var roleOptions = ROLES.map(function (r) {
      var selected = r === role ? ' selected' : '';
      return '<option' + selected + '>' + r + '</option>';
    }).join('');
    row.innerHTML = '<td><input value="Этап" style="width:100%"></td>' +
      '<td><select>' + roleOptions + '</select></td>' +
      '<td><input type="number" value="' + days + '" style="width:70px"></td>' +
      '<td><input type="number" value="' + loadPercent + '" step="1" style="width:80px"></td>' +
      '<td class="endDate">—</td>' +
      '<td><button class="btn-outline del-row" type="button">Удалить</button></td>';
    row.querySelector('.del-row').addEventListener('click', function () { row.remove(); recalcAll(); });
    return row;
  }

  function addPlanRow(role, days, loadPercent) {
    var tbody = document.querySelector('#planTable tbody');
    tbody.appendChild(createPlanRow(role, days, loadPercent));
  }

  function initPlan() {
    document.getElementById('addPlanRow').addEventListener('click', function () { addPlanRow('Разработчик', 5, 100); });
    for (var role in DEFAULT_ROLE_DAYS) {
      if (DEFAULT_ROLE_DAYS.hasOwnProperty(role)) {
        addPlanRow(role, DEFAULT_ROLE_DAYS[role], 100);
      }
    }
  }

  function isWeekend(date) {
    var day = date.getDay();
    return day === 0 || day === 6;
  }

  function addWorkDays(startDate, daysToAdd) {
    var current = new Date(startDate);
    var added = 0;
    while (added < daysToAdd) {
      if (!isWeekend(current)) added++;
      if (added < daysToAdd) current.setDate(current.getDate() + 1);
    }
    return current;
  }

  function calculatePlanDates() {
    var startInput = document.getElementById('startDate').value;
    if (!startInput) return {};
    var currentDate = new Date(startInput);
    if (isNaN(currentDate.getTime())) return {};
    var rows = document.querySelectorAll('#planTable tbody tr');
    var roleDays = {};
    rows.forEach(function (row) {
      var role = row.querySelector('select').value;
      var days = parseInt(row.querySelectorAll('input')[1].value) || 0;
      var loadPercent = parseInt(row.querySelectorAll('input')[2].value) || 100;
      var workDaysNeeded = Math.ceil(days * (loadPercent / 100));
      var endDate = addWorkDays(currentDate, days);
      row.querySelector('.endDate').textContent = endDate.toLocaleDateString('ru-RU');
      currentDate = new Date(endDate);
      currentDate.setDate(currentDate.getDate() + 1);
      if (!roleDays[role]) roleDays[role] = 0;
      roleDays[role] += workDaysNeeded;
    });
    var summaryParts = [];
    for (var role in roleDays) {
      if (roleDays.hasOwnProperty(role)) summaryParts.push(role + ': ' + roleDays[role] + ' дн.');
    }
    document.getElementById('roleDaysSummary').textContent = summaryParts.join(', ');
    return roleDays;
  }

  function calculateKp() {
    var settings = getSettings();
    var roleDays = calculatePlanDates();
    var salaryMap = getSalaryMap(settings);
    var totalBaseSalary = 0;
    for (var role in roleDays) {
      if (roleDays.hasOwnProperty(role)) {
        var monthlySalary = salaryMap[role] || 0;
        totalBaseSalary += (monthlySalary / settings.workDays) * roleDays[role];
      }
    }
    var additionalSalary = totalBaseSalary * settings.wd;
    var taxes = (totalBaseSalary + additionalSalary) * settings.wc;
    var overhead = totalBaseSalary * settings.wn;
    var materialCost = parseFloat(document.getElementById('cm').value) || 0;
    var machineHours = parseFloat(document.getElementById('tmv').value) || 0;
    var machineCost = machineHours * settings.smch;
    var kpProject = totalBaseSalary + additionalSalary + taxes + overhead + materialCost + machineCost;
    var analogPrice = parseFloat(document.getElementById('analogPrice').value) || 0;
    var analogInstall = parseFloat(document.getElementById('analogInstall').value) || 0;
    var analogEducation = parseFloat(document.getElementById('analogEdu').value) || 0;
    var kpAnalog = analogPrice + analogInstall + analogEducation;
    document.getElementById('fotOsn').textContent = totalBaseSalary.toFixed(2);
    document.getElementById('kpProject').textContent = kpProject.toFixed(2);
    document.getElementById('kpAnalog').textContent = kpAnalog.toFixed(2);
    return { kpProject: kpProject, kpAnalog: kpAnalog };
  }

  function calculateOperational() {
    var settings = getSettings();
    var salaryMap = getSalaryMap(settings);
    var annualFot = 0;
    for (var i = 0; i < ROLES.length; i++) annualFot += (salaryMap[ROLES[i]] || 0) * 12;
    var amortization = settings.balCost * 0.2;
    var energyCost = settings.power * settings.tg * settings.tariff;
    var repairCost = settings.balCost * 0.05;
    var materialCost = settings.balCost * 0.1;
    var totalOperational = annualFot + amortization + energyCost + repairCost + materialCost;
    document.getElementById('operFot').textContent = annualFot.toFixed(2);
    document.getElementById('operAmort').textContent = amortization.toFixed(2);
    document.getElementById('operEnergy').textContent = energyCost.toFixed(2);
    document.getElementById('operRepair').textContent = repairCost.toFixed(2);
    document.getElementById('operMat').textContent = materialCost.toFixed(2);
    document.getElementById('ztekTotal').textContent = totalOperational.toFixed(2);
    return totalOperational;
  }

  function calculateEfficiency() {
    var settings = getSettings();
    var ak = updateKtu();
    var kpData = calculateKp();
    var operationalCost = calculateOperational();
    var zProject = operationalCost + settings.en * kpData.kpProject;
    var zAnalog = operationalCost * 1.15 + settings.en * kpData.kpAnalog;
    var annualEffect = (zAnalog * ak - zProject) * settings.N;
    var paybackPeriod = annualEffect > 0 ? kpData.kpProject / annualEffect : Infinity;
    var efficiencyRatio = paybackPeriod > 0 && isFinite(paybackPeriod) ? 1 / paybackPeriod : 0;
    document.getElementById('z2').textContent = zProject.toFixed(2);
    document.getElementById('z1').textContent = zAnalog.toFixed(2);
    document.getElementById('godEffect').textContent = annualEffect.toFixed(2);
    document.getElementById('tok').textContent = isFinite(paybackPeriod) ? paybackPeriod.toFixed(2) : '—';
    document.getElementById('efact').textContent = efficiencyRatio.toFixed(3);
    updateResume(ak, kpData, annualEffect, paybackPeriod, efficiencyRatio);
  }

  function updateResume(ak, kpData, annualEffect, paybackPeriod, efficiencyRatio) {
    var html = '<div>Ak: ' + ak.toFixed(3) + ' | Kп проект: ' + kpData.kpProject.toFixed(0) + ' руб. | Аналог: ' + kpData.kpAnalog.toFixed(0) + ' руб.</div>' +
      '<div>Годовой эффект: ' + annualEffect.toFixed(0) + ' руб./год | Срок окупаемости: ' + (isFinite(paybackPeriod) ? paybackPeriod.toFixed(2) + ' лет' : '> 10 лет') + ' | Eф: ' + efficiencyRatio.toFixed(3) + '</div>';
    document.getElementById('resumeContent').innerHTML = html;
  }

  function recalcAll() {
    updateKtu();
    calculateKp();
    calculateOperational();
    calculateEfficiency();
    updateExtendedSummary();
  }

  function updateExtendedSummary() {
    var akElem = document.getElementById('akValue');
    var ak = akElem ? parseFloat(akElem.textContent) : 1;
    var kpProjElem = document.getElementById('kpProject');
    var kpAnalogElem = document.getElementById('kpAnalog');
    var kpProject = kpProjElem ? parseFloat(kpProjElem.textContent) : 0;
    var kpAnalog = kpAnalogElem ? parseFloat(kpAnalogElem.textContent) : 0;
    var ztekTotalElem = document.getElementById('ztekTotal');
    var ztekOper = ztekTotalElem ? parseFloat(ztekTotalElem.textContent) : 0;
    var settings = (function () {
      try {
        return { en: parseFloat(document.getElementById('en').value) || 0.33, N: parseFloat(document.getElementById('nVolume').value) || 1 };
      } catch (e) { return { en: 0.33, N: 1 }; }
    })();
    var ztekAnalogBase = ztekOper * 1.15;
    var en = settings.en;
    var N = settings.N;
    var zpProject = ztekOper + en * kpProject;
    var zpAnalog = ztekAnalogBase + en * kpAnalog;
    var annualEffect = (zpAnalog * ak - zpProject) * N;
    if (isNaN(annualEffect)) annualEffect = 0;
    var paybackPeriod = (annualEffect > 0 && kpProject > 0) ? kpProject / annualEffect : Infinity;
    var efficiencyRatio = (paybackPeriod > 0 && isFinite(paybackPeriod)) ? 1 / paybackPeriod : 0;
    document.getElementById('akTableProj')?.setAttribute('colspan', '2');
    var akCell = document.getElementById('akTableProj');
    if (akCell) akCell.innerHTML = '<strong>' + ak.toFixed(3) + '</strong> (отношение Jэту)';
    document.getElementById('kpProjectVal').innerHTML = kpProject.toFixed(2) + ' ₽';
    document.getElementById('kpAnalogVal').innerHTML = kpAnalog.toFixed(2) + ' ₽';
    var kpDelta = kpProject - kpAnalog;
    document.getElementById('kpDeltaMsg').innerHTML = kpDelta < 0 ? 'Проект дешевле на ' + Math.abs(kpDelta).toFixed(0) + ' ₽' : (kpDelta > 0 ? 'Аналог дешевле на ' + kpDelta.toFixed(0) + ' ₽' : 'Равны');
    document.getElementById('ztekProjectVal').innerHTML = ztekOper.toFixed(2) + ' ₽/год';
    document.getElementById('ztekAnalogVal').innerHTML = ztekAnalogBase.toFixed(2) + ' ₽/год';
    var ztekDelta = ztekOper - ztekAnalogBase;
    document.getElementById('ztekDeltaMsg').innerHTML = ztekDelta < 0 ? 'Проект выгоднее в эксплуатации на ' + Math.abs(ztekDelta).toFixed(0) + ' ₽/год' : (ztekDelta > 0 ? 'Аналог экономичнее на ' + ztekDelta.toFixed(0) + ' ₽/год' : 'Одинаковы');
    document.getElementById('zpProjectVal').innerHTML = zpProject.toFixed(2) + ' ₽';
    document.getElementById('zpAnalogVal').innerHTML = zpAnalog.toFixed(2) + ' ₽';
    var zpDelta = zpProject - zpAnalog;
    document.getElementById('zpDeltaMsg').innerHTML = zpDelta < 0 ? 'Ниже на ' + Math.abs(zpDelta).toFixed(0) + ' ₽ (проект эффективнее)' : (zpDelta > 0 ? 'Аналог выгоднее на ' + zpDelta.toFixed(0) + ' ₽' : 'Равны');
    var godEffectElem = document.getElementById('godEffect');
    var godEffectValue = godEffectElem ? parseFloat(godEffectElem.textContent) : annualEffect;
    document.getElementById('godEffectTable').innerHTML = godEffectValue.toFixed(2) + ' ₽/год';
    var effectCommentSpan = document.getElementById('effectComment');
    if (godEffectValue > 0) effectCommentSpan.innerHTML = 'Положительный эффект, внедрение целесообразно';
    else if (godEffectValue < 0) effectCommentSpan.innerHTML = 'Отрицательный эффект, проект экономически невыгоден';
    else effectCommentSpan.innerHTML = 'Нулевой эффект';
    var tokElem = document.getElementById('tok');
    var tokValue = tokElem ? tokElem.textContent : (isFinite(paybackPeriod) ? paybackPeriod.toFixed(2) : '—');
    if (tokValue === '—' || tokValue === 'Infinity') tokValue = '> 10 лет';
    document.getElementById('tokTable').innerHTML = tokValue;
    var efactElem = document.getElementById('efact');
    var efactValue = efactElem ? efactElem.textContent : efficiencyRatio.toFixed(3);
    document.getElementById('efactTable').innerHTML = efactValue;
    var tokNum = (typeof tokValue === 'string' && tokValue.includes('>')) ? 999 : parseFloat(tokValue);
    var tokCommentSpan = document.getElementById('tokComment');
    if (!isNaN(tokNum) && tokNum < 3) tokCommentSpan.innerHTML = 'Отличный срок (менее 3 лет) — высокая привлекательность';
    else if (!isNaN(tokNum) && tokNum <= 5) tokCommentSpan.innerHTML = 'Приемлемый срок окупаемости (3–5 лет)';
    else tokCommentSpan.innerHTML = 'Срок окупаемости превышает нормативный (3 года), требуется анализ рисков';
    var efactNum = parseFloat(efactValue);
    var efactCommentSpan = document.getElementById('efactComment');
    if (!isNaN(efactNum) && efactNum > en) efactCommentSpan.innerHTML = 'Eф = ' + efactValue + ' > Eн = ' + en + ' → инвестиции эффективны';
    else if (!isNaN(efactNum) && efactNum === en) efactCommentSpan.innerHTML = 'Эффективность на уровне норматива (Eф = ' + en + ')';
    else efactCommentSpan.innerHTML = 'Eф = ' + efactValue + ' < Eн = ' + en + ', проект нецелесообразен';
    var resumeDiv = document.getElementById('resumeContent');
    if (resumeDiv) {
      resumeDiv.innerHTML = '<div style="display:flex; flex-direction: column; gap:0.5rem;">' +
        '<div><span class="inline-highlight">Коэффициент технического уровня (A<sub>k</sub>):</span> ' + ak.toFixed(3) + '</div>' +
        '<div><span class="inline-highlight">Капитальные затраты (K<sub>п</sub>):</span> Проект = ' + kpProject.toFixed(0) + ' руб. | Аналог = ' + kpAnalog.toFixed(0) + ' руб.</div>' +
        '<div><span class="inline-highlight">Годовые эксплуатационные затраты (З<sub>тек</sub>):</span> Проект = ' + ztekOper.toFixed(0) + ' руб. | Аналог = ' + ztekAnalogBase.toFixed(0) + ' руб.</div>' +
        '<div><span class="inline-highlight">Приведенные затраты (З):</span> Проект = ' + zpProject.toFixed(0) + ' руб. | Аналог = ' + zpAnalog.toFixed(0) + ' руб.</div>' +
        '<div><span class="inline-highlight">Годовой экономический эффект:</span> <strong>' + godEffectValue.toFixed(0) + ' руб./год</strong></div>' +
        '<div><span class="inline-highlight">Срок окупаемости:</span> ' + tokValue + ' &nbsp;|&nbsp; <span class="inline-highlight">E<sub>ф</sub>:</span> ' + efactValue + '</div></div>';
    }
    var insightDiv = document.getElementById('dynamicInsight');
    if (insightDiv) {
      var verdict = '';
      if (godEffectValue > 0 && ((isFinite(paybackPeriod) && paybackPeriod <= 3) || efactNum > en)) verdict = 'Проект демонстрирует высокую экономическую эффективность, превышает нормативные требования. Рекомендуется к реализации.';
      else if (godEffectValue > 0) verdict = 'Проект прибылен, но показатели окупаемости близки к нормативным. Рекомендуется оптимизация затрат либо увеличение объема N.';
      else verdict = 'На данный момент проект не обеспечивает достаточного эффекта. Пересмотрите настройки: стоимость аналога, KTU, план-график или эксплуатационные издержки.';
      insightDiv.innerHTML = 'Аналитический вывод: ' + verdict + '<br><small>Данные пересчитаны с учетом всех параметров (оклады, КТУ, план-график, затраты).</small>';
    }
  }

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
