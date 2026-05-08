(function() {
  'use strict';
  const roleNames = ['Разработчик','Аналитик','Руководитель','Инженер'];
  const defaultRoleDays = {'Разработчик':12,'Аналитик':8,'Руководитель':5};

  function getSettings() {
    const getVal = (id, fallback = 0) => { const el = document.getElementById(id); return el ? (parseFloat(el.value) || 0) : fallback; };
    return {
      developerSalary: getVal('salaryDeveloper'), analystSalary: getVal('salaryAnalyst'),
      projectManagerSalary: getVal('salaryProjectManager'), engineerSalary: getVal('salaryEngineer'),
      additionalSalaryRatio: getVal('coefficientAdditionalSalary'), taxRatio: getVal('coefficientTaxes'),
      overheadRatio: getVal('coefficientOverhead'), workDaysPerMonth: getVal('workDaysPerMonth',21),
      machineHourCost: getVal('machineHourCost'), electricityTariff: getVal('electricityTariff'),
      equipmentPower: getVal('equipmentPower'), balanceCost: getVal('balanceCost'),
      annualTimeFund: getVal('annualTimeFund',2000), normativeEfficiency: getVal('normativeEfficiency',0.33),
      annualVolume: getVal('annualVolumeValue',1)
    };
  }

  function applyValidation() {
    document.querySelectorAll('input[type="number"]').forEach(input => {
      const val = parseFloat(input.value);
      if (input.value && !isNaN(val)) {
        const min = input.hasAttribute('min') ? parseFloat(input.min) : null;
        const max = input.hasAttribute('max') ? parseFloat(input.max) : null;
        if (min !== null && val < min) input.value = min;
        if (max !== null && val > max) input.value = max;
        input.classList.remove('invalid');
      }
    });
    document.querySelectorAll('#ktuProjectTable tbody input[type="number"], #ktuAnalogTable tbody input[type="number"]').forEach(inp => {
      const val = parseFloat(inp.value);
      if (inp.placeholder.includes('1-5') || inp.step === '0.1') {
        if (val < 1) inp.value = 1;
        if (val > 5) inp.value = 5;
      } else {
        if (val < 0.01) inp.value = 0.01;
        if (val > 1) inp.value = 1;
      }
    });
    document.querySelectorAll('#planTable tbody input[type="number"]').forEach(inp => {
      const val = parseInt(inp.value);
      if (inp.placeholder === 'Дни' || inp.style.width === '70px') { if (val < 1) inp.value = 1; }
      else { if (val < 1) inp.value = 1; if (val > 100) inp.value = 100; }
    });
    validateKtuWeights();
  }

  function validateKtuWeights() {
    ['ktuProjectTable','ktuAnalogTable'].forEach(tableId => {
      const rows = document.querySelectorAll(`#${tableId} tbody tr`);
      let sum = 0;
      rows.forEach(row => { const inp = row.querySelectorAll('input')[1]; if (inp) sum += parseFloat(inp.value) || 0; });
      const warningEl = document.getElementById(tableId === 'ktuProjectTable' ? 'ktuProjectWeightWarning' : 'ktuAnalogWeightWarning');
      if (warningEl) {
        if (Math.abs(sum - 1.0) > 0.001 && rows.length > 0) warningEl.textContent = `Сумма весов: ${sum.toFixed(2)} (должна быть 1.0)`;
        else warningEl.textContent = '';
      }
    });
  }

  function calculateJetu(tableId, detailId) {
    let sum = 0; const lines = [];
    document.querySelectorAll(`#${tableId} tbody tr`).forEach((row,i) => {
      const inputs = row.querySelectorAll('input');
      const w = parseFloat(inputs[1]?.value) || 0;
      const s = parseFloat(inputs[2]?.value) || 1;
      sum += w * s;
      lines.push(`${inputs[0]?.value || 'показатель'}: ${w.toFixed(2)}×${s.toFixed(1)}=${(w*s).toFixed(2)}`);
    });
    document.getElementById(detailId).textContent = lines.length ? 'Расчет:\n'+lines.join('\n')+`\nИтого: ${sum.toFixed(2)}` : '';
    return sum;
  }

  function updateKtu() {
    const jp = calculateJetu('ktuProjectTable','jetuProjectDetail');
    const ja = calculateJetu('ktuAnalogTable','jetuAnalogDetail');
    document.getElementById('jetuProject').textContent = jp.toFixed(2);
    document.getElementById('jetuAnalog').textContent = ja.toFixed(2);
    return { jetuProject: jp, jetuAnalog: ja, ak: ja !== 0 ? jp / ja : 1 };
  }

  function calculatePlanDates() {
    const start = document.getElementById('projectStartDate').value;
    if (!start) return {};
    let cur = new Date(start); if (isNaN(cur)) return {};
    const map = {}, lines = [];
    document.querySelectorAll('#planTable tbody tr').forEach((row,i) => {
      const role = row.querySelector('select')?.value;
      const days = parseInt(row.querySelectorAll('input')[1]?.value) || 0;
      const load = parseInt(row.querySelectorAll('input')[2]?.value) || 100;
      const actual = Math.ceil(days * load / 100);
      const end = new Date(cur); end.setDate(end.getDate() + days - 1);
      row.querySelector('.endDate').textContent = end.toLocaleDateString('ru-RU');
      lines.push(`Этап ${i+1}: ${days}дн×${load}%=${actual} чел-дн (${role})`);
      cur = new Date(end); cur.setDate(cur.getDate()+1);
      map[role] = (map[role]||0) + actual;
    });
    document.getElementById('roleDaysSummary').textContent = Object.entries(map).map(([r,d])=>`${r}: ${d} дн.`).join(', ');
    document.getElementById('planDetail').textContent = lines.length ? 'Расчет:\n'+lines.join('\n') : '';
    return map;
  }

  function calculateAll() {
    applyValidation();
    const s = getSettings();
    const { jetuProject, jetuAnalog, ak } = updateKtu();
    const roleDays = calculatePlanDates();
    const salaryMap = {'Разработчик':s.developerSalary,'Аналитик':s.analystSalary,'Руководитель':s.projectManagerSalary,'Инженер':s.engineerSalary};
    
    let fotBase = 0, fotLines = [];
    for (const [role, days] of Object.entries(roleDays)) {
      const daily = (salaryMap[role]||0) / s.workDaysPerMonth;
      const cost = daily * days; fotBase += cost;
      fotLines.push(`${role}: ${salaryMap[role]}/ ${s.workDaysPerMonth} × ${days} = ${cost.toFixed(2)}`);
    }
    document.getElementById('totalBaseSalary').textContent = fotBase.toFixed(2);
    document.getElementById('totalBaseSalaryDetail').textContent = fotLines.length ? 'Расчет:\n'+fotLines.join('\n')+`\nИтого: ${fotBase.toFixed(2)}` : '';

    const addSal = fotBase * s.additionalSalaryRatio;
    const tax = (fotBase + addSal) * s.taxRatio;
    const overhead = fotBase * s.overheadRatio;
    const mat = parseFloat(document.getElementById('materialCosts').value)||0;
    const mh = parseFloat(document.getElementById('machineTime').value)||0;
    const mCost = mh * s.machineHourCost;
    const kpProject = fotBase + addSal + tax + overhead + mat + mCost;
    document.getElementById('capitalCostsProject').textContent = kpProject.toFixed(2);
    
    const aPrice = parseFloat(document.getElementById('analogPurchasePrice').value)||0;
    const aInst = parseFloat(document.getElementById('analogInstallationCost').value)||0;
    const aEdu = parseFloat(document.getElementById('analogEducationCost').value)||0;
    const kpAnalog = aPrice + aInst + aEdu;
    document.getElementById('capitalCostsAnalog').textContent = kpAnalog.toFixed(2);

    let annualPay = 0;
    roleNames.forEach(r => annualPay += (salaryMap[r]||0)*12);
    document.getElementById('annualPayroll').textContent = annualPay.toFixed(2);
    const depr = s.balanceCost * 0.2;
    document.getElementById('depreciationCost').textContent = depr.toFixed(2);
    const electr = s.equipmentPower * s.annualTimeFund * s.electricityTariff;
    document.getElementById('electricityCost').textContent = electr.toFixed(2);
    const repair = s.balanceCost * 0.05;
    document.getElementById('repairCosts').textContent = repair.toFixed(2);
    const mats = s.balanceCost * 0.1;
    document.getElementById('materialsCostOperating').textContent = mats.toFixed(2);
    const totalOper = annualPay + depr + electr + repair + mats;
    document.getElementById('totalOperatingCosts').textContent = totalOper.toFixed(2);

    const z2 = totalOper + s.normativeEfficiency * kpProject;
    const z1 = totalOper * 1.15 + s.normativeEfficiency * kpAnalog;
    document.getElementById('reducedCostsProject').textContent = z2.toFixed(2);
    document.getElementById('reducedCostsAnalog').textContent = z1.toFixed(2);

    const effect = (z1 * ak - z2) * s.annualVolume;
    document.getElementById('annualEffect').textContent = effect.toFixed(2);
    const effectProject = effect;
    const effectAnalog = effect * -1;

    const paybackProject = effect > 0 && kpProject > 0 ? kpProject / effect : Infinity;
    const paybackAnalog = Infinity;
    const effProject = isFinite(paybackProject) && paybackProject > 0 ? 1/paybackProject : 0;
    const effAnalog = 0;

    document.getElementById('akProjectValue').textContent = ak.toFixed(3);
    document.getElementById('akAnalogValue').textContent = '1.000';
    document.getElementById('akComment').textContent = ak > 1 ? 'Проект превосходит аналог' : (ak < 1 ? 'Аналог имеет выше КТУ' : 'Равны');

    document.getElementById('kpProjectValue').textContent = kpProject.toFixed(0)+' ₽';
    document.getElementById('kpAnalogValue').textContent = kpAnalog.toFixed(0)+' ₽';
    document.getElementById('kpDeltaMessage').textContent = kpProject < kpAnalog ? 'Проект дешевле' : (kpProject > kpAnalog ? 'Аналог дешевле' : 'Равны');

    document.getElementById('ztekProjectValue').textContent = totalOper.toFixed(0)+' ₽/год';
    document.getElementById('ztekAnalogValue').textContent = (totalOper*1.15).toFixed(0)+' ₽/год';
    document.getElementById('ztekDeltaMessage').textContent = totalOper < totalOper*1.15 ? 'Проект экономичнее' : 'Аналог экономичнее';

    document.getElementById('zpProjectValue').textContent = z2.toFixed(0)+' ₽';
    document.getElementById('zpAnalogValue').textContent = z1.toFixed(0)+' ₽';
    document.getElementById('zpDeltaMessage').textContent = z2 < z1 ? 'Проект эффективнее' : 'Аналог выгоднее';

    document.getElementById('effectProjectValue').textContent = effectProject.toFixed(0)+' ₽/год';
    document.getElementById('effectAnalogValue').textContent = effectAnalog.toFixed(0)+' ₽/год';
    document.getElementById('effectComment').textContent = effect > 0 ? 'Проект выгоден' : (effect < 0 ? 'Аналог выгоднее' : 'Равны');

    const dispPayP = isFinite(paybackProject) ? paybackProject.toFixed(2) : 'Не окупается';
    document.getElementById('paybackProjectValue').textContent = dispPayP;
    document.getElementById('paybackAnalogValue').textContent = '—';
    document.getElementById('paybackComment').textContent = isFinite(paybackProject) ? (paybackProject<3?'Отличный срок':'Приемлемо') : 'Проект не окупается';

    document.getElementById('effProjectValue').textContent = effProject.toFixed(3);
    document.getElementById('effAnalogValue').textContent = '0';
    document.getElementById('efficiencyComment').textContent = effProject > s.normativeEfficiency ? 'Эффективен' : 'Ниже норматива';

    document.getElementById('summaryTextCell').innerHTML = `Ak=${ak.toFixed(3)} | Эффект=${effect.toFixed(0)} руб/год | Окупаемость=${dispPayP} лет`;
    document.getElementById('dynamicInsight').innerHTML = effect > 0 ? '✅ Проект рекомендуется к внедрению.' : '⚠️ Требуется пересмотр параметров.';
  }

  function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', function() {
      document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
      this.classList.add('active');
      document.getElementById(this.dataset.tab).classList.add('active');
    }));
  }

  function addKtuRow(tableId) {
    const row = document.createElement('tr');
    row.innerHTML = `<td><input placeholder="Название"></td><td><input type="number" step="0.01" value="0.2" min="0.01" max="1"></td><td><input type="number" step="0.1" min="1" max="5" value="3"></tr>`;
    document.querySelector(`#${tableId} tbody`).appendChild(row);
  }

  function addPlanRow(role='Разработчик', days=5, load=100) {
    const row = document.createElement('tr');
    row.innerHTML = `<td><input value="Этап"></td><td><select>${roleNames.map(r=>`<option ${r===role?'selected':''}>${r}</option>`).join('')}</select></td><td><input type="number" value="${days}" min="1" style="width:70px"></td><td><input type="number" value="${load}" min="1" max="100" style="width:80px"></td><td class="endDate">—</td><td><button class="btn-outline delete-row-button">Удалить</button></td>`;
    row.querySelector('.delete-row-button').addEventListener('click', ()=>{ row.remove(); calculateAll(); });
    document.querySelector('#planTable tbody').appendChild(row);
  }

  window.addEventListener('DOMContentLoaded', () => {
    initTabs();
    for(let i=0;i<2;i++){ addKtuRow('ktuProjectTable'); addKtuRow('ktuAnalogTable'); }
    document.getElementById('addKtuRowProject').addEventListener('click', ()=>addKtuRow('ktuProjectTable'));
    document.getElementById('addKtuRowAnalog').addEventListener('click', ()=>addKtuRow('ktuAnalogTable'));
    for(const [r,d] of Object.entries(defaultRoleDays)) addPlanRow(r,d,100);
    document.getElementById('addPlanRow').addEventListener('click', ()=>addPlanRow());
    calculateAll();
    document.addEventListener('input', e => { if (e.target.closest('.panel')) calculateAll(); });
  });
})();
