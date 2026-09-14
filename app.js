const form = document.querySelector('#calculator-form');
const serviceTabs = document.querySelector('#service-tabs');
const activitySearch = document.querySelector('#activity-search');
const activityList = document.querySelector('#activity-list');
const teamSize = document.querySelector('#team-size');
const totalOutput = document.querySelector('#manday-total');
const baseOutput = document.querySelector('#base-output');
const activityOutput = document.querySelector('#activity-output');
const teamOutput = document.querySelector('#team-output');
const captionOutput = document.querySelector('#result-caption');
const formulaOutput = document.querySelector('#formula');
const selectedCount = document.querySelector('#selected-count');
const clearSelection = document.querySelector('#clear-selection');
const resetButton = document.querySelector('#reset-button');
const serviceTotals = document.querySelector('#service-totals');
if (!catalog.some((entry) => entry.service === 'JNC (New)' && entry.item === 'Account Item Group')) {
  catalog.push({ service: 'JNC (New)', item: 'Account Item Group', mandays: 0.07 });
}
const quantities = new Map();
let activeService = '';
const entryKey = (entry) => `${entry.service}::${entry.item}`;
const excludedServices = new Set(['CPC', 'JNC', 'CIC']);
const availableCatalog = catalog.filter((entry) => !excludedServices.has(entry.service));

const services = ['All services', ...new Set(availableCatalog.map((entry) => entry.service))];
services.forEach((service) => {
  const tab = document.createElement('button');
  const serviceValue = service === 'All services' ? '' : service;
  tab.type = 'button';
  tab.className = 'service-tab';
  tab.textContent = service;
  tab.setAttribute('role', 'tab');
  tab.setAttribute('aria-selected', String(serviceValue === activeService));
  tab.tabIndex = serviceValue === activeService ? 0 : -1;
  tab.addEventListener('click', () => {
    activeService = serviceValue;
    renderServiceTabs();
    renderActivities();
  });
  serviceTabs.append(tab);
});

const renderServiceTabs = () => {
  serviceTabs.querySelectorAll('.service-tab').forEach((tab) => {
    const selected = tab.textContent === (activeService || 'All services');
    tab.classList.toggle('is-active', selected);
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
};

const filteredCatalog = () => {
  const query = activitySearch.value.trim().toLowerCase();
  return availableCatalog.filter((entry) => (!activeService || entry.service === activeService) && (!query || entry.item.toLowerCase().includes(query)));
};

const renderActivities = () => {
  activityList.replaceChildren();
  const entries = filteredCatalog();
  if (!entries.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'No activities match your search.';
    activityList.append(empty);
    return;
  }
  entries.forEach((entry) => {
    const row = document.createElement('div');
    row.className = 'activity-row';
    const details = document.createElement('div');
    details.className = 'activity-details';
    const sourceLabel = entry.service === 'CPC (New)' ? 'Mandays' : 'Mandays';
    const configItem = configItems[entryKey(entry)] || 'Config item not specified';
    const configBreakdown = configItemBreakdowns[entryKey(entry)] || configItem;
    details.innerHTML = `<div class="activity-main" role="button" tabindex="0" aria-expanded="false"><strong>${entry.item}</strong><span>${entry.mandays.toFixed(3)} ${sourceLabel}</span></div><span class="config-label" hidden>${configBreakdown}</span>`;
    const activityMain = details.querySelector('.activity-main');
    const configLabel = details.querySelector('.config-label');
    const toggleConfig = () => {
      const expanded = activityMain.getAttribute('aria-expanded') === 'true';
      activityMain.setAttribute('aria-expanded', String(!expanded));
      configLabel.hidden = expanded;
    };
    activityMain.addEventListener('click', toggleConfig);
    activityMain.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleConfig();
      }
    });
    const quantity = document.createElement('input');
    quantity.type = 'number';
    quantity.min = '0';
    quantity.step = '1';
    quantity.value = quantities.get(entryKey(entry)) || 0;
    quantity.setAttribute('aria-label', `Quantity for ${entry.item}`);
    quantity.addEventListener('input', () => {
      const value = Math.max(0, Math.floor(Number(quantity.value) || 0));
      quantity.value = value;
      if (value) quantities.set(entryKey(entry), value);
      else quantities.delete(entryKey(entry));
      update();
    });
    row.append(details, quantity);
    activityList.append(row);
  });
};

const update = () => {
  const people = Math.max(1, Math.floor(Number(teamSize.value) || 1));
  const selected = availableCatalog.filter((entry) => quantities.has(entryKey(entry)));
  const baseMandays = selected.reduce((sum, entry) => sum + entry.mandays * quantities.get(entryKey(entry)), 0);
  const totalMandays = baseMandays * people;
  const count = [...quantities.values()].reduce((sum, quantity) => sum + quantity, 0);
  const byService = selected.reduce((totals, entry) => {
    totals[entry.service] = (totals[entry.service] || 0) + entry.mandays * quantities.get(entryKey(entry)) * people;
    return totals;
  }, {});
  totalOutput.textContent = totalMandays.toFixed(2);
  baseOutput.textContent = baseMandays.toFixed(2);
  activityOutput.textContent = count;
  teamOutput.textContent = people;
  captionOutput.textContent = count ? `${count} catalog ${count === 1 ? 'activity' : 'activities'} for ${people} ${people === 1 ? 'person' : 'people'}` : 'Select activities to begin';
  formulaOutput.textContent = `Mandays × ${people} ${people === 1 ? 'person' : 'people'}`;
  selectedCount.textContent = `${count} ${count === 1 ? 'activity' : 'activities'} selected`;
  serviceTotals.replaceChildren();
  const serviceEntries = Object.entries(byService);
  if (!serviceEntries.length) {
    const empty = document.createElement('p');
    empty.className = 'service-empty';
    empty.textContent = 'Select activities to see the service split.';
    serviceTotals.append(empty);
  } else {
    serviceEntries.forEach(([service, mandays]) => {
      const row = document.createElement('div');
      row.className = 'service-total-row';
      row.innerHTML = `<span>${service}</span><strong>${mandays.toFixed(2)}</strong>`;
      serviceTotals.append(row);
    });
  }
};

form.addEventListener('input', update);
activitySearch.addEventListener('input', renderActivities);
document.querySelectorAll('.stepper').forEach((button) => {
  button.addEventListener('click', () => {
    const direction = button.dataset.action === 'increase' ? 1 : -1;
    teamSize.value = Math.min(999, Math.max(1, Number(teamSize.value) + direction));
    update();
  });
});
clearSelection.addEventListener('click', () => {
  quantities.clear();
  renderActivities();
  update();
});
resetButton.addEventListener('click', () => {
  quantities.clear();
  teamSize.value = 1;
  activeService = '';
  activitySearch.value = '';
  renderServiceTabs();
  renderActivities();
  update();
});

renderActivities();
update();
