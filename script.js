(function() {
  'use strict';

  // ============================================================
  // КОНСТАНТЫ И НАСТРОЙКИ ПО УМОЛЧАНИЮ
  // ============================================================
  
  // Доступные роли сотрудников в проекте
  const roleNames = ['Разработчик', 'Аналитик', 'Руководитель', 'Инженер'];
  
  // Количество рабочих дней по умолчанию для каждой роли
  const defaultRoleDays = {
    'Разработчик': 12, // программисты обычно больше всего времени тратят на разработку
    'Аналитик': 8,     // аналитик собирает требования и проектирует систему
    'Руководитель': 5  // руководитель координирует и управляет процессом
  };

  // ============================================================
  // ПОЛУЧЕНИЕ ДАННЫХ ИЗ ФОРМЫ
  // ============================================================
  
  function getSettings() {
    const getVal = (id, fallback = 0) => {
      const el = document.getElementById(id);
      return el ? (parseFloat(el.value) || 0) : fallback;
    };
    
    return {
      // Зарплаты сотрудников (руб/мес)
      developerSalary: getVal('salaryDeveloper'),
      analystSalary: getVal('salaryAnalyst'),
      projectManagerSalary: getVal('salaryProjectManager'),
      engineerSalary: getVal('salaryEngineer'),
      
      // Коэффициенты для расчета полной стоимости
      additionalSalaryRatio: getVal('coefficientAdditionalSalary'), // дополнительная зарплата (отпускные, премии)
      taxRatio: getVal('coefficientTaxes'),                         // страховые взносы и налоги
      overheadRatio: getVal('coefficientOverhead'),                 // накладные расходы (аренда, связь, канцелярия)
      
      // Параметры рабочего времени
      workDaysPerMonth: getVal('workDaysPerMonth', 21), // рабочих дней в месяце
      
      // Стоимость машинного времени и электроэнергии
      machineHourCost: getVal('machineHourCost'),       // стоимость часа работы оборудования
      electricityTariff: getVal('electricityTariff'),   // тариф на электроэнергию (руб/кВтч)
      equipmentPower: getVal('equipmentPower'),         // мощность оборудования (кВт)
      
      // Балансовая стоимость и амортизация
      balanceCost: getVal('balanceCost'),               // балансовая стоимость оборудования
      annualTimeFund: getVal('annualTimeFund', 2000),   // годовой фонд времени работы оборудования
      normativeEfficiency: getVal('normativeEfficiency', 0.33), // нормативный коэффициент эффективности
      
      // Годовой объем внедрения
      annualVolume: getVal('annualVolumeValue', 1)
    };
  }

  // ============================================================
  // ВАЛИДАЦИЯ ВВОДА — ЗАПРЕТ ОТРИЦАТЕЛЬНЫХ ЧИСЕЛ И БУКВ
  // ============================================================
  
  // Блокировка ввода любых символов, кроме цифр и точки
  function allowOnlyPositiveNumbers(e) {
    const input = e.target;
    const oldValue = input.value;
    
    // Разрешаем: цифры, точку, Backspace, Delete, стрелки, Tab, Home, End
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End', 'Period', 'Dot'];
    const isNumberKey = (e.key >= '0' && e.key <= '9');
    
    // Разрешаем Ctrl+C, Ctrl+V, Ctrl+A, Ctrl+X, Ctrl+Z
    const isCtrlCombo = e.ctrlKey || e.metaKey;
    
    if (!isNumberKey && !allowedKeys.includes(e.key) && !isCtrlCombo) {
      e.preventDefault();
      return;
    }
    
    // Разрешаем точку только если её ещё нет в числе
    if ((e.key === '.' || e.key === 'Period' || e.key === 'Dot') && input.value.includes('.')) {
      e.preventDefault();
      return;
    }
    
    // Блокируем минус (отрицательные числа)
    if (e.key === '-' || e.key === 'Minus') {
      e.preventDefault();
      return;
    }
  }
  
  // Очистка значения при вставке (замена запятых на точки, удаление нецифровых символов кроме точки)
  function sanitizeNumberInput(e) {
    const input = e.target;
    setTimeout(() => {
      let val = input.value;
      // Заменяем запятые на точки
      val = val.replace(/,/g, '.');
      // Удаляем все символы, кроме цифр и точки
      val = val.replace(/[^0-9.]/g, '');
      // Удаляем все точки кроме первой
      const parts = val.split('.');
      if (parts.length > 2) {
        val = parts[0] + '.' + parts.slice(1).join('');
      }
      // Удаляем минусы
      val = val.replace(/-/g, '');
      input.value = val;
    }, 10);
  }
  
  // Применяем обработчики ко всем числовым полям
  function bindInputHandlers() {
    document.querySelectorAll('input[type="number"]').forEach(input => {
      // Убираем старые обработчики, чтобы не дублировать
      input.removeEventListener('keydown', allowOnlyPositiveNumbers);
      input.removeEventListener('paste', sanitizeNumberInput);
      input.removeEventListener('input', sanitizeNumberInput);
      
      // Навешиваем новые
      input.addEventListener('keydown', allowOnlyPositiveNumbers);
      input.addEventListener('paste', sanitizeNumberInput);
      input.addEventListener('input', sanitizeNumberInput);
      
      // Убираем возможность ввода стрелками в отрицательную зону
      input.min = input.min || 0;
    });
  }

  // ============================================================
  // ПРИНУДИТЕЛЬНАЯ ВАЛИДАЦИЯ ПРИ РАСЧЕТЕ
  // ============================================================
  
  function applyValidation() {
    // Валидация всех числовых полей (не даём уйти ниже min и выше max)
    document.querySelectorAll('input[type="number"]').forEach(input => {
      const val = parseFloat(input.value);
      if (input.value && !isNaN(val)) {
        const min = input.hasAttribute('min') ? parseFloat(input.min) : 0;
        const max = input.hasAttribute('max') ? parseFloat(input.max) : null;
        if (val < min) input.value = min;
        if (max !== null && val > max) input.value = max;
        // Дополнительно: запрещаем отрицательные значения
        if (val < 0) input.value = 0;
        input.classList.remove('invalid');
      }
    });
    
    // Валидация таблиц КТУ:
    // - веса (второй input): 0.01–1.0
    // - баллы (третий input): 1–5
    document.querySelectorAll('#ktuProjectTable tbody input[type="number"], #ktuAnalogTable tbody input[type="number"]').forEach(inp => {
      const val = parseFloat(inp.value);
      if (inp.step === '0.1' || inp.placeholder?.includes('балл')) {
        // Это поле баллов (1–5)
        if (isNaN(val) || val < 1) inp.value = 1;
        if (val > 5) inp.value = 5;
      } else {
        // Это поле веса (0.01–1.0)
        if (isNaN(val) || val < 0.01) inp.value = 0.01;
        if (val > 1) inp.value = 1;
      }
    });
    
    // Валидация таблицы плана:
    // - дни: минимум 1
    // - загрузка: 1–100%
    document.querySelectorAll('#planTable tbody input[type="number"]').forEach(inp => {
      const val = parseInt(inp.value);
      if (inp.style?.width === '70px' || inp.placeholder === 'Дни') {
        // Дни: минимум 1
        if (isNaN(val) || val < 1) inp.value = 1;
      } else {
        // Загрузка: 1–100%
        if (isNaN(val) || val < 1) inp.value = 1;
        if (val > 100) inp.value = 100;
      }
    });
    
    validateKtuWeights();
  }

  // ============================================================
  // ПРОВЕРКА СУММЫ ВЕСОВ КТУ (должна быть = 1.0)
  // ============================================================
  
  function validateKtuWeights() {
    ['ktuProjectTable', 'ktuAnalogTable'].forEach(tableId => {
      const rows = document.querySelectorAll(`#${tableId} tbody tr`);
      let sum = 0;
      rows.forEach(row => {
        const inp = row.querySelectorAll('input')[1]; // второй input — вес
        if (inp) sum += parseFloat(inp.value) || 0;
      });
      const warningEl = document.getElementById(
        tableId === 'ktuProjectTable' ? 'ktuProjectWeightWarning' : 'ktuAnalogWeightWarning'
      );
      if (warningEl) {
        if (Math.abs(sum - 1.0) > 0.001 && rows.length > 0) {
          warningEl.textContent = `⚠️ Сумма весов: ${sum.toFixed(2)} (должна быть 1.0). Распределите важность критериев так, чтобы в сумме получилось 1.`;
        } else {
          warningEl.textContent = '';
        }
      }
    });
  }

  // ============================================================
  // РАСЧЕТ КТУ (КОЭФФИЦИЕНТА ТЕХНИЧЕСКОГО УРОВНЯ)
  // ============================================================
  
  function calculateJetu(tableId, detailId) {
    let sum = 0;
    const lines = [];
    
    document.querySelectorAll(`#${tableId} tbody tr`).forEach((row, i) => {
      const inputs = row.querySelectorAll('input');
      const w = parseFloat(inputs[1]?.value) || 0; // вес критерия
      const s = parseFloat(inputs[2]?.value) || 1; // оценка по шкале 1–5
      const weighted = w * s;
      sum += weighted;
      lines.push(
        `${inputs[0]?.value || 'показатель'}: вес ${w.toFixed(2)} × оценка ${s.toFixed(1)} = ${weighted.toFixed(2)}`
      );
    });
    
    const detailEl = document.getElementById(detailId);
    if (detailEl) {
      detailEl.textContent = lines.length 
        ? '📊 Детализация расчета:\n' + lines.join('\n') + `\n━━━━━━━━━━━━━━━\n📌 Итого КТУ: ${sum.toFixed(2)}` 
        : 'Нет данных для расчета. Добавьте критерии оценки.';
    }
    
    return sum;
  }

  function updateKtu() {
    const jp = calculateJetu('ktuProjectTable', 'jetuProjectDetail');
    const ja = calculateJetu('ktuAnalogTable', 'jetuAnalogDetail');
    
    document.getElementById('jetuProject').textContent = jp.toFixed(2);
    document.getElementById('jetuAnalog').textContent = ja.toFixed(2);
    
    // Коэффициент эквивалентности: если аналог имеет КТУ > 0, делим проект на аналог
    const ak = ja !== 0 ? jp / ja : 1;
    return { jetuProject: jp, jetuAnalog: ja, ak: ak };
  }

  // ============================================================
  // РАСЧЕТ ДАТ И ТРУДОЗАТРАТ ПО ПЛАНУ ПРОЕКТА
  // ============================================================
  
  function calculatePlanDates() {
    const start = document.getElementById('projectStartDate').value;
    if (!start) return {};
    
    let cur = new Date(start);
    if (isNaN(cur.getTime())) return {};
    
    const roleDaysMap = {}; // сколько человеко-дней потратит каждая роль
    const lines = [];
    
    document.querySelectorAll('#planTable tbody tr').forEach((row, i) => {
      const role = row.querySelector('select')?.value;
      if (!role) return;
      
      const inputs = row.querySelectorAll('input');
      const days = parseInt(inputs[1]?.value) || 0;   // календарных дней
      const load = parseInt(inputs[2]?.value) || 100;  // загрузка в процентах
      const actualManDays = Math.ceil(days * load / 100); // реальных человеко-дней с учётом загрузки
      
      // Дата окончания этапа
      const endDate = new Date(cur);
      endDate.setDate(endDate.getDate() + days - 1);
      
      const endDateCell = row.querySelector('.endDate');
      if (endDateCell) {
        endDateCell.textContent = endDate.toLocaleDateString('ru-RU');
      }
      
      lines.push(`Этап ${i+1}: ${days} календарных дней × ${load}% загрузки = ${actualManDays} чел.-дней (роль: ${role})`);
      
      // Следующий этап начинается на следующий день после окончания текущего
      cur = new Date(endDate);
      cur.setDate(cur.getDate() + 1);
      
      // Суммируем трудозатраты по ролям
      roleDaysMap[role] = (roleDaysMap[role] || 0) + actualManDays;
    });
    
    // Обновляем сводку по ролям
    const summaryEl = document.getElementById('roleDaysSummary');
    if (summaryEl) {
      summaryEl.textContent = Object.entries(roleDaysMap)
        .map(([r, d]) => `${r}: ${d} дн.`)
        .join(', ');
    }
    
    // Детализация расчета
    const detailEl = document.getElementById('planDetail');
    if (detailEl) {
      detailEl.textContent = lines.length 
        ? '📅 Расчет трудозатрат:\n' + lines.join('\n') 
        : '';
    }
    
    return roleDaysMap;
  }

  // ============================================================
  // ГЛАВНАЯ ФУНКЦИЯ — ПОЛНЫЙ РАСЧЕТ ВСЕХ ПОКАЗАТЕЛЕЙ
  // ============================================================
  
  function calculateAll() {
    applyValidation();
    const s = getSettings();
    
    // 1. Расчет КТУ
    const { jetuProject, jetuAnalog, ak } = updateKtu();
    
    // 2. Расчет трудозатрат по ролям
    const roleDays = calculatePlanDates();
    
    // 3. Расчет фонда оплаты труда (ФОТ)
    const salaryMap = {
      'Разработчик': s.developerSalary,
      'Аналитик': s.analystSalary,
      'Руководитель': s.projectManagerSalary,
      'Инженер': s.engineerSalary
    };
    
    let fotBase = 0;
    const fotLines = [];
    
    for (const [role, days] of Object.entries(roleDays)) {
      const monthlySalary = salaryMap[role] || 0;
      const dailyRate = monthlySalary / s.workDaysPerMonth;
      const cost = dailyRate * days;
      fotBase += cost;
      fotLines.push(
        `${role}: ${monthlySalary.toFixed(0)} ₽/мес ÷ ${s.workDaysPerMonth} дн × ${days} дн = ${cost.toFixed(2)} ₽`
      );
    }
    
    const baseSalaryEl = document.getElementById('totalBaseSalary');
    const baseSalaryDetailEl = document.getElementById('totalBaseSalaryDetail');
    if (baseSalaryEl) baseSalaryEl.textContent = fotBase.toFixed(2);
    if (baseSalaryDetailEl) {
      baseSalaryDetailEl.textContent = fotLines.length 
        ? '💰 Расчет базовой зарплаты:\n' + fotLines.join('\n') + `\n━━━━━━━━━━━━━━━\n📌 Итого ФОТ: ${fotBase.toFixed(2)} ₽` 
        : '';
    }
    
    // 4. Капитальные затраты на проект
    const addSal = fotBase * s.additionalSalaryRatio;          // дополнительная зарплата
    const tax = (fotBase + addSal) * s.taxRatio;               // налоги и взносы
    const overhead = fotBase * s.overheadRatio;                // накладные расходы
    const mat = parseFloat(document.getElementById('materialCosts')?.value) || 0;     // материальные затраты
    const mh = parseFloat(document.getElementById('machineTime')?.value) || 0;        // машино-часы
    const mCost = mh * s.machineHourCost;                      // стоимость машинного времени
    const kpProject = fotBase + addSal + tax + overhead + mat + mCost;
    
    const kpProjectEl = document.getElementById('capitalCostsProject');
    if (kpProjectEl) kpProjectEl.textContent = kpProject.toFixed(2);
    
    // 5. Капитальные затраты на аналог
    const aPrice = parseFloat(document.getElementById('analogPurchasePrice')?.value) || 0;
    const aInst = parseFloat(document.getElementById('analogInstallationCost')?.value) || 0;
    const aEdu = parseFloat(document.getElementById('analogEducationCost')?.value) || 0;
    const kpAnalog = aPrice + aInst + aEdu;
    
    const kpAnalogEl = document.getElementById('capitalCostsAnalog');
    if (kpAnalogEl) kpAnalogEl.textContent = kpAnalog.toFixed(2);
    
    // 6. Годовые эксплуатационные расходы
    let annualPay = 0;
    roleNames.forEach(r => annualPay += (salaryMap[r] || 0) * 12);
    
    const depr = s.balanceCost * 0.2;                            // амортизация (20%)
    const electr = s.equipmentPower * s.annualTimeFund * s.electricityTariff; // электроэнергия
    const repair = s.balanceCost * 0.05;                         // ремонт (5%)
    const mats = s.balanceCost * 0.1;                            // материалы (10%)
    const totalOper = annualPay + depr + electr + repair + mats;
    
    updateElement('annualPayroll', annualPay.toFixed(2));
    updateElement('depreciationCost', depr.toFixed(2));
    updateElement('electricityCost', electr.toFixed(2));
    updateElement('repairCosts', repair.toFixed(2));
    updateElement('materialsCostOperating', mats.toFixed(2));
    updateElement('totalOperatingCosts', totalOper.toFixed(2));
    
    // 7. Приведенные затраты
    const z2 = totalOper + s.normativeEfficiency * kpProject;              // приведенные затраты проекта
    const z1 = totalOper * 1.15 + s.normativeEfficiency * kpAnalog;        // приведенные затраты аналога (с коэф. 1.15)
    
    updateElement('reducedCostsProject', z2.toFixed(2));
    updateElement('reducedCostsAnalog', z1.toFixed(2));
    
    // 8. Годовой экономический эффект
    const effect = (z1 * ak - z2) * s.annualVolume;
    updateElement('annualEffect', effect.toFixed(2));
    
    // 9. Срок окупаемости и коэффициент эффективности
    const paybackProject = effect > 0 && kpProject > 0 ? kpProject / effect : Infinity;
    const effProject = isFinite(paybackProject) && paybackProject > 0 ? 1 / paybackProject : 0;
    
    // 10. Заполнение сравнительной таблицы
    updateElement('akProjectValue', ak.toFixed(3));
    updateElement('akAnalogValue', '1.000');
    updateElement('akComment', 
      ak > 1 ? '✅ Проект превосходит аналог по техническому уровню' : 
      (ak < 1 ? '⚠️ Аналог имеет более высокий технический уровень' : '➡️ Технические уровни равны')
    );
    
    updateElement('kpProjectValue', kpProject.toFixed(0) + ' ₽');
    updateElement('kpAnalogValue', kpAnalog.toFixed(0) + ' ₽');
    updateElement('kpDeltaMessage', 
      kpProject < kpAnalog ? '✅ Проект требует меньше капвложений' : 
      (kpProject > kpAnalog ? '⚠️ Аналог дешевле в приобретении' : '➡️ Равные затраты')
    );
    
    updateElement('ztekProjectValue', totalOper.toFixed(0) + ' ₽/год');
    updateElement('ztekAnalogValue', (totalOper * 1.15).toFixed(0) + ' ₽/год');
    updateElement('ztekDeltaMessage', 
      totalOper < totalOper * 1.15 ? '✅ Проект экономичнее в эксплуатации' : '⚠️ Аналог экономичнее в эксплуатации'
    );
    
    updateElement('zpProjectValue', z2.toFixed(0) + ' ₽');
    updateElement('zpAnalogValue', z1.toFixed(0) + ' ₽');
    updateElement('zpDeltaMessage', 
      z2 < z1 ? '✅ Проект эффективнее по приведенным затратам' : '⚠️ Аналог выгоднее по приведенным затратам'
    );
    
    updateElement('effectProjectValue', effect.toFixed(0) + ' ₽/год');
    updateElement('effectAnalogValue', (effect * -1).toFixed(0) + ' ₽/год');
    updateElement('effectComment', 
      effect > 0 ? '✅ Проект приносит экономический эффект' : 
      (effect < 0 ? '⚠️ Аналог экономически выгоднее' : '➡️ Эффект отсутствует')
    );
    
    const dispPayP = isFinite(paybackProject) ? paybackProject.toFixed(2) : 'Не окупается';
    updateElement('paybackProjectValue', dispPayP);
    updateElement('paybackAnalogValue', '—');
    updateElement('paybackComment', 
      isFinite(paybackProject) 
        ? (paybackProject < 1 ? '✅ Очень быстрая окупаемость (менее года)' : 
           paybackProject < 3 ? '✅ Хороший срок окупаемости' : '⚠️ Длительный срок окупаемости') 
        : '❌ Проект не окупается при текущих параметрах'
    );
    
    updateElement('effProjectValue', effProject.toFixed(3));
    updateElement('effAnalogValue', '0.000');
    updateElement('efficiencyComment', 
      effProject > s.normativeEfficiency ? '✅ Коэффициент эффективности выше нормативного' : '⚠️ Эффективность ниже нормативной'
    );
    
    // 11. Итоговая сводка
    updateElement('summaryTextCell', 
      `Ak=${ak.toFixed(3)} | Эффект=${effect.toFixed(0)} руб/год | Окупаемость=${dispPayP} лет`
    );
    updateElement('dynamicInsight', 
      effect > 0 
        ? '✅ ПРОЕКТ РЕКОМЕНДУЕТСЯ К ВНЕДРЕНИЮ — положительный экономический эффект, затраты оправданы.' 
        : '⚠️ ТРЕБУЕТСЯ ПЕРЕСМОТР ПАРАМЕТРОВ — проект экономически неэффективен при текущих данных.'
    );
  }
  
  // Вспомогательная функция безопасного обновления DOM-элемента
  function updateElement(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  // ============================================================
  // ИНИЦИАЛИЗАЦИЯ ВКЛАДОК
  // ============================================================
  
  function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        // Убираем активный класс у всех кнопок и панелей
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        
        // Активируем текущую вкладку
        this.classList.add('active');
        const panelId = this.dataset.tab;
        const panel = document.getElementById(panelId);
        if (panel) {
          panel.classList.add('active');
        }
      });
    });
  }

  // ============================================================
  // ДОБАВЛЕНИЕ СТРОК В ТАБЛИЦЫ
  // ============================================================
  
  function addKtuRow(tableId) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    if (!tbody) return;
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><input placeholder="Название критерия" aria-label="Название критерия оценки"></td>
      <td><input type="number" step="0.01" value="0.2" min="0.01" max="1" aria-label="Вес критерия (0.01–1.0)"></td>
      <td><input type="number" step="0.1" min="1" max="5" value="3" aria-label="Оценка по шкале 1–5"></td>
      <td><button class="btn-outline delete-row-button" title="Удалить критерий">❌</button></td>
    `;
    
    // Кнопка удаления строки
    const deleteBtn = row.querySelector('.delete-row-button');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        row.remove();
        calculateAll();
      });
    }
    
    tbody.appendChild(row);
    
    // Привязываем валидацию к новым полям
    bindInputHandlers();
    calculateAll();
  }

  function addPlanRow(role = 'Разработчик', days = 5, load = 100) {
    const tbody = document.querySelector('#planTable tbody');
    if (!tbody) return;
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><input value="Новый этап" placeholder="Название этапа" aria-label="Название этапа проекта"></td>
      <td>
        <select aria-label="Роль исполнителя">
          ${roleNames.map(r => `<option value="${r}" ${r === role ? 'selected' : ''}>${r}</option>`).join('')}
        </select>
      </td>
      <td><input type="number" value="${days}" min="1" style="width:70px" placeholder="Дни" aria-label="Календарных дней"></td>
      <td><input type="number" value="${load}" min="1" max="100" style="width:80px" placeholder="Загрузка %" aria-label="Загрузка исполнителя в процентах"></td>
      <td class="endDate">—</td>
      <td><button class="btn-outline delete-row-button" title="Удалить этап">❌</button></td>
    `;
    
    // Кнопка удаления строки
    const deleteBtn = row.querySelector('.delete-row-button');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        row.remove();
        calculateAll();
      });
    }
    
    tbody.appendChild(row);
    
    // Привязываем валидацию к новым полям
    bindInputHandlers();
    calculateAll();
  }

  // ============================================================
  // ЗАПУСК ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
  // ============================================================
  
  window.addEventListener('DOMContentLoaded', () => {
    initTabs();
    
    // Добавляем начальные строки КТУ (по 2 критерия для проекта и аналога)
    for (let i = 0; i < 2; i++) {
      addKtuRow('ktuProjectTable');
      addKtuRow('ktuAnalogTable');
    }
    
    // Кнопки добавления критериев КТУ
    const addKtuProjectBtn = document.getElementById('addKtuRowProject');
    const addKtuAnalogBtn = document.getElementById('addKtuRowAnalog');
    if (addKtuProjectBtn) addKtuProjectBtn.addEventListener('click', () => addKtuRow('ktuProjectTable'));
    if (addKtuAnalogBtn) addKtuAnalogBtn.addEventListener('click', () => addKtuRow('ktuAnalogTable'));
    
    // Добавляем начальные этапы плана (по умолчанию для трех ролей)
    for (const [r, d] of Object.entries(defaultRoleDays)) {
      addPlanRow(r, d, 100);
    }
    
    // Кнопка добавления этапа
    const addPlanBtn = document.getElementById('addPlanRow');
    if (addPlanBtn) addPlanBtn.addEventListener('click', () => addPlanRow());
    
    // Первичная привязка валидации
    bindInputHandlers();
    
    // Первичный расчет
    calculateAll();
    
    // Автоматический пересчет при любом изменении в полях ввода
    document.addEventListener('input', e => {
      if (e.target.closest('.panel')) {
        calculateAll();
      }
      // Перепривязываем валидацию для новых полей
      bindInputHandlers();
    });
    
    // Также пересчитываем при изменении select
    document.addEventListener('change', e => {
      if (e.target.closest('.panel')) {
        calculateAll();
      }
    });
  });

})();
