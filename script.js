(function () {
  'use strict';

  /* ==========================================================================
     Константы
     ========================================================================== */

  var ROLES = ['Разработчик', 'Аналитик', 'Руководитель', 'Инженер'];

  var DEFAULT_PLAN_ROWS = [
    { role: 'Разработчик',  days: 12, load: 100 },
    { role: 'Аналитик',     days: 8,  load: 100 },
    { role: 'Руководитель', days: 5,  load: 100 }
  ];

  /* ==========================================================================
     Получение настроек (DRY: единственный источник)
     ========================================================================== */

  function getSettings() {
    return {
      salDev:       parseFloat(document.getElementById('salDev').value)       || 0,
      salAnalyst:   parseFloat(document.getElementById('salAnalyst').value)   || 0,
      salPM:        parseFloat(document.getElementById('salPM').value)        || 0,
      salEng:       parseFloat(document.getElementById('salEng').value)       || 0,
      wd:           parseFloat(document.getElementById('wd').value)           || 0,
      wc:           parseFloat(document.getElementById('wc').value)           || 0,
      wn:           parseFloat(document.getElementById('wn').value)           || 0,
      workDays:     parseFloat(document.getElementById('workDaysMonth').value) || 21,
      smch:         parseFloat(document.getElementById('smch').value)         || 0,
      tariff:       parseFloat(document.getElementById('tariff').value)       || 0,
      power:        parseFloat(document.getElementById('power').value)        || 0,
      balCost:      parseFloat(document.getElementById('balCost').value)      || 0,
      tg:           parseFloat(document.getElementById('tg').value)           || 2000,
      en:           parseFloat(document.getElementById('en').value)           || 0.33,
      N:            parseFloat(document.getElementById('nVolume').value)      || 1
    };
  }

  function getSalaryMap(settings) {
    var map = {};
    map['Разработчик']  = settings.salDev;
    map['Аналитик']     = settings.salAnalyst;
    map['Руководитель'] = settings.salPM;
    map['Инженер']      = settings.salEng;
    return map;
  }

  /* ==========================================================================
     Навигация по вкладкам
     ========================================================================== */

  function initTabs() {
    var tabButtons = document.querySelectorAll('.tab-btn');
    var panels     = document.querySelectorAll('.panel');

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

  /* ==========================================================================
     Блок КТУ
     ========================================================================== */

  function createKtuRow() {
    var row = document.createElement('tr');
    row.innerHTML =
      '<td><input type="text" placeholder="Название" style="width:100%"></td>' +
      '<td><input type="number" step="0.01" value="0.20" style="width:85px"></td>' +
      '<td><input type="number" step="0.1" min="1" max="5" value="3" style="width:75px"></td>';
    return row;
  }

  function addKtuRow(tableId) {
    var tbody = document.querySelector('#' + tableId + ' tbody');
    tbody.appendChild(createKtuRow());
  }

  function initKtu() {
    document.getElementById('addKtuRowProj').addEventListener('click', function () {
      addKtuRow('ktuProjectTable');
    });
    document.getElementById('addKtuRowAnalog').addEventListener('click', function () {
      addKtuRow('ktuAnalogTable');
    });

    for (var i = 0; i < 3; i++) {
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
        var score  = parseFloat(inputs[2].value) || 1;
        sum += weight * score;
      }
    });
    return sum;
  }

  function updateKtu() {
    var jetuProject = calculateJetu('ktuProjectTable');
    var jetuAnalog  = calculateJetu('ktuAnalogTable');

    document.getElementById('jetuProj').textContent   = jetuProject.toFixed(2);
    document.getElementById('jetuAnalog').textContent = jetuAnalog.toFixed(2);

    var ak = jetuAnalog !== 0 ? jetuProject / jetuAnalog : 1;
    document.getElementById('akValue').textContent = ak.toFixed(3);
    return ak;
  }

  /* ==========================================================================
     Блок План-график
     ========================================================================== */

  function createPlanRow(role, days, loadPercent) {
    var row = document.createElement('tr');

    var roleOptions = ROLES.map(function (r) {
      var selected = r === role ? ' selected' : '';
      return '<option' + selected + '>' + r + '</option>';
    }).join('');

    row.innerHTML =
      '<td><input type="text" value="Этап" style="width:100%"></td>' +
      '<td><select>' + roleOptions + '</select></td>' +
      '<td><input type="number" value="' + days + '" style="width:65px"></td>' +
      '<td><input type="number" value="' + loadPercent + '" step="1" min="1" max="100" style="width:70px"></td>' +
      '<td class="endDate">—</td>' +
      '<td><button class="btn-outline del-row" type="button">Удалить</button></td>';

    row.querySelector('.del-row').addEventListener('click', function () {
      row.remove();
      recalcAll();
    });

    return row;
  }

  function addPlanRow(role, days, loadPercent) {
    var tbody = document.querySelector('#planTable tbody');
    tbody.appendChild(createPlanRow(role, days, loadPercent));
  }

  function initPlan() {
    document.getElementById('addPlanRow').addEventListener('click', function () {
      addPlanRow('Разработчик', 5, 100);
    });

    DEFAULT_PLAN_ROWS.forEach(function (item) {
      addPlanRow(item.role, item.days, item.load);
    });
  }

  function isWeekend(date) {
    var day = date.getDay();
    return day === 0 || day === 6;
  }

  function addWorkDays(startDate, daysToAdd) {
    var current = new Date(startDate);
    var added = 0;

    while (added < daysToAdd) {
      if (!isWeekend(current)) {
        ++added;
      }
      if (added < daysToAdd) {
        current.setDate(current.getDate() + 1);
      }
    }
    return current;
  }

  function calculatePlanDates() {
    var startInput = document.getElementById('startDate').value;
    if (!startInput) {
      document.getElementById('roleDaysSummary').textContent = '—';
      return {};
    }

    var currentDate = new Date(startInput);
    if (isNaN(currentDate.getTime())) {
      document.getElementById('roleDaysSummary').textContent = '—';
      return {};
    }

    var rows = document.querySelectorAll('#planTable tbody tr');
    var roleDays = {};

    rows.forEach(function (row) {
      var role        = row.querySelector('select').value;
      var days        = parseInt(row.querySelectorAll('input')[1].value) || 0;
      var loadPercent = parseInt(row.querySelectorAll('input')[2].value) || 100;
      var effectiveDays = Math.ceil(days * (loadPercent / 100));

      var endDate = addWorkDays(currentDate, days);
      row.querySelector('.endDate').textContent = endDate.toLocaleDateString('ru-RU');

      currentDate = new Date(endDate);
      currentDate.setDate(currentDate.getDate() + 1);

      if (!roleDays[role]) {
        roleDays[role] = 0;
      }
      roleDays[role] += effectiveDays;
    });

    var summaryParts = [];
    for (var role in roleDays) {
      if (roleDays.hasOwnProperty(role)) {
        summaryParts.push(role + ': ' + roleDays[role] + ' дн.');
      }
    }
    document.getElementById('roleDaysSummary').textContent = summaryParts.join(', ') || '—';

    return roleDays;
  }

  /* ==========================================================================
     Блок Затрат на разработку (Kп)
     ========================================================================== */

  function calculateKp() {
    var settings  = getSettings();
    var roleDays  = calculatePlanDates();
    var salaryMap = getSalaryMap(settings);

    var totalBaseSalary = 0;
    for (var role in roleDays) {
      if (roleDays.hasOwnProperty(role)) {
        var monthlySalary = salaryMap[role] || 0;
        totalBaseSalary += (monthlySalary / settings.workDays) * roleDays[role];
      }
    }

    var additionalSalary = totalBaseSalary * settings.wd;
    var taxes            = (totalBaseSalary + additionalSalary) * settings.wc;
    var overhead         = totalBaseSalary * settings.wn;
    var materialCost     = parseFloat(document.getElementById('cm').value)  || 0;
    var machineHours     = parseFloat(document.getElementById('tmv').value) || 0;
    var machineCost      = machineHours * settings.smch;

    var kpProject = totalBaseSalary + additionalSalary + taxes + overhead + materialCost + machineCost;

    var analogPrice     = parseFloat(document.getElementById('analogPrice').value)   || 0;
    var analogInstall   = parseFloat(document.getElementById('analogInstall').value) || 0;
    var analogEducation = parseFloat(document.getElementById('analogEdu').value)     || 0;
    var kpAnalog        = analogPrice + analogInstall + analogEducation;

    document.getElementById('fotOsn').textContent     = totalBaseSalary.toFixed(2);
    document.getElementById('kpProject').textContent = kpProject.toFixed(2);
    document.getElementById('kpAnalog').textContent  = kpAnalog.toFixed(2);

    return { kpProject: kpProject, kpAnalog: kpAnalog };
  }

  /* ==========================================================================
     Блок Эксплуатационных затрат (Зтек)
     ========================================================================== */

  function calculateOperational() {
    var settings  = getSettings();
    var salaryMap = getSalaryMap(settings);

    var annualFot = 0;
    for (var i = 0; i < ROLES.length; ++i) {
      annualFot += (salaryMap[ROLES[i]] || 0) * 12;
    }

    var amortization  = settings.balCost * 0.2;
    var energyCost    = settings.power * settings.tg * settings.tariff;
    var repairCost    = settings.balCost * 0.05;
    var materialCost  = settings.balCost * 0.1;

    var totalOperational = annualFot + amortization + energyCost + repairCost + materialCost;

    document.getElementById('operFot').textContent    = annualFot.toFixed(2);
    document.getElementById('operAmort').textContent  = amortization.toFixed(2);
    document.getElementById('operEnergy').textContent = energyCost.toFixed(2);
    document.getElementById('operRepair').textContent = repairCost.toFixed(2);
    document.getElementById('operMat').textContent    = materialCost.toFixed(2);
    document.getElementById('ztekTotal').textContent  = totalOperational.toFixed(2);

    return totalOperational;
  }

  /* ==========================================================================
     Блок Экономической эффективности
     ========================================================================== */

  function calculateEfficiency() {
    var settings        = getSettings();
    var ak              = updateKtu();
    var kpData          = calculateKp();
    var operationalCost = calculateOperational();

    var zProject = operationalCost + settings.en * kpData.kpProject;
    var zAnalog  = operationalCost * 1.15 + settings.en * kpData.kpAnalog;

    var annualEffect   = (zAnalog * ak - zProject) * settings.N;
    var paybackPeriod  = annualEffect > 0 ? kpData.kpProject / annualEffect : Infinity;
    var efficiencyRatio = paybackPeriod > 0 && isFinite(paybackPeriod) ? 1 / paybackPeriod : 0;

    document.getElementById('z2').textContent        = zProject.toFixed(2);
    document.getElementById('z1').textContent        = zAnalog.toFixed(2);
    document.getElementById('godEffect').textContent = annualEffect.toFixed(2);
    document.getElementById('tok').textContent       = isFinite(paybackPeriod) ? paybackPeriod.toFixed(2) : '—';
    document.getElementById('efact').textContent     = efficiencyRatio.toFixed(3);

    updateResume(ak, kpData, annualEffect, paybackPeriod, efficiencyRatio);
  }

  function updateResume(ak, kpData, annualEffect, paybackPeriod, efficiencyRatio) {
    var html = '';

    html += '<div class="resume-card">';
    html += '<span class="metric-label">A<sub>k</sub> – Коэффициент тех. уровня</span>';
    html += '<span class="metric-value blue">' + ak.toFixed(3) + '</span>';
    html += '</div>';

    html += '<div class="resume-card">';
    html += '<span class="metric-label">K<sub>п</sub> – Капитальные затраты (проект)</span>';
    html += '<span class="metric-value">' + kpData.kpProject.toFixed(0) + ' <small>руб</small></span>';
    html += '</div>';

    html += '<div class="resume-card">';
    html += '<span class="metric-label">K<sub>п</sub> – Капитальные затраты (аналог)</span>';
    html += '<span class="metric-value">' + kpData.kpAnalog.toFixed(0) + ' <small>руб</small></span>';
    html += '</div>';

    html += '<div class="resume-divider"></div>';

    html += '<div class="resume-card">';
    html += '<span class="metric-label">Э – Годовой экономический эффект</span>';
    html += '<span class="metric-value green">' + annualEffect.toFixed(0) + ' <small>руб/год</small></span>';
    html += '</div>';

    html += '<div class="resume-card">';
    html += '<span class="metric-label">T<sub>ок</sub> – Срок окупаемости</span>';
    html += '<span class="metric-value">' + (isFinite(paybackPeriod) ? paybackPeriod.toFixed(2) + ' <small>лет</small>' : '—') + '</span>';
    html += '</div>';

    html += '<div class="resume-card">';
    html += '<span class="metric-label">E<sub>ф</sub> – Фактическая эффективность</span>';
    html += '<span class="metric-value blue">' + efficiencyRatio.toFixed(3) + '</span>';
    html += '<span class="metric-desc">Норматив E<sub>н</sub> = 0.33</span>';
    html += '</div>';

    document.getElementById('resumeContent').innerHTML = html;
  }

  /* ==========================================================================
     Основная функция пересчета
     ========================================================================== */

  function recalcAll() {
    updateKtu();
    calculateKp();
    calculateOperational();
    calculateEfficiency();
  }

  /* ==========================================================================
     Инициализация приложения
     ========================================================================== */

  function initApp() {
    initTabs();
    initKtu();
    initPlan();
    recalcAll();

    document.addEventListener('input', function (event) {
      if (event.target.closest('.panel')) {
        recalcAll();
      }
    });

    document.addEventListener('change', function (event) {
      if (event.target.closest('.panel')) {
        recalcAll();
      }
    });
  }

  window.addEventListener('DOMContentLoaded', initApp);
})();
