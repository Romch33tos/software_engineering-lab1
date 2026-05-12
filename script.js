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
})();
