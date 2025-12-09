<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';

interface Product {
  product_id: string;
  name: string;
  profit: number;
}
interface Resource {
  resource_id: string;
  name: string;
  stock: number;
}
interface ConsumptionMap {
  [key: string]: number;
}
interface ProductionPlan {
  [key: string]: number;
}

const products = ref<Product[]>([]);
const resources = ref<Resource[]>([]);
const consumption = ref<ConsumptionMap>({});
const productionPlan = ref<ProductionPlan>({});
const totalProfit = ref(0);
const stepLog = ref<string[]>([]);
const isLoading = ref(true);
const executionTime = ref(0);

const API_URL = 'http://localhost:3001/api';

function loadDefaultData() {
  stepLog.value.push("База даних порожня. Завантаження даних Варіанту 1...");

  const p1 = `p${Date.now() + 1}`;
  const p2 = `p${Date.now() + 2}`;
  const p3 = `p${Date.now() + 3}`;
  const p4 = `p${Date.now() + 4}`;
  const p5 = `p${Date.now() + 5}`;

  const r1 = `r${Date.now() + 1}`;
  const r2 = `r${Date.now() + 2}`;
  const r3 = `r${Date.now() + 3}`;
  const r4 = `r${Date.now() + 4}`;

  products.value = [
    { product_id: p1, name: 'A', profit: 1100 },
    { product_id: p2, name: 'B', profit: 1500 },
    { product_id: p3, name: 'C', profit: 900 },
    { product_id: p4, name: 'D', profit: 2000 },
    { product_id: p5, name: 'E', profit: 1250 },
  ];

  resources.value = [
    { resource_id: r1, name: 'Деревина', stock: 500 },
    { resource_id: r2, name: 'Тканина', stock: 400 },
    { resource_id: r3, name: 'Скло', stock: 300 },
    { resource_id: r4, name: 'Метал', stock: 360 },
  ];

  consumption.value = {
    [`${r1}_${p1}`]: 10, [`${r1}_${p2}`]: 8, [`${r1}_${p3}`]: 12, [`${r1}_${p4}`]: 15, [`${r1}_${p5}`]: 10,
    [`${r2}_${p1}`]: 0, [`${r2}_${p2}`]: 5, [`${r2}_${p3}`]: 0, [`${r2}_${p4}`]: 6, [`${r2}_${p5}`]: 8,
    [`${r3}_${p1}`]: 2, [`${r3}_${p2}`]: 0, [`${r3}_${p3}`]: 0, [`${r3}_${p4}`]: 4, [`${r3}_${p5}`]: 3,
    [`${r4}_${p1}`]: 1, [`${r4}_${p2}`]: 3, [`${r4}_${p3}`]: 2, [`${r4}_${p4}`]: 4, [`${r4}_${p5}`]: 2,
  };

  saveAllChanges(true);
}

async function clearAllData() {
  if (!confirm('Ви впевнені, що хочете видалити ВСІ дані? Ця дія незворотня.')) {
    return;
  }

  products.value = [];
  resources.value = [];
  consumption.value = {};
  stepLog.value = ["Таблицю очищено."];
  totalProfit.value = 0;
  executionTime.value = 0;
  productionPlan.value = {};

  await saveAllChanges(true);
}

async function loadData() {
  try {
    isLoading.value = true;
    const response = await axios.get(`${API_URL}/data`);

    if (response.data.products && response.data.products.length > 0) {
      products.value = response.data.products;
      resources.value = response.data.resources;
      consumption.value = response.data.consumption;
    } else {
      loadDefaultData();
    }
  } catch (error) {
    console.error("Не вдалося завантажити дані:", error);
    alert("Помилка завантаження даних. Перевірте консоль та чи запущено backend.");
  } finally {
    isLoading.value = false;
  }
}

async function saveAllChanges(silent: boolean = false) {
  try {
    isLoading.value = true;
    const payload = {
      products: products.value,
      resources: resources.value,
      consumption: consumption.value,
    };
    await axios.post(`${API_URL}/save`, payload);
    if (!silent) {
      alert('Зміни успішно збережено!');
    }
  } catch (error) {
    console.error("Не вдалося зберегти дані:", error);
    if (!silent) {
      alert("Помилка збереження даних. Перевірте консоль.");
    }
  } finally {
    isLoading.value = false;
  }
}

onMounted(loadData);

function addProduct() {
  const newId = `p${Date.now()}`;
  products.value.push({
    product_id: newId,
    name: 'Новий Виріб',
    profit: 0
  });
}

function addResource() {
  const newId = `r${Date.now()}`;
  resources.value.push({
    resource_id: newId,
    name: 'Новий Ресурс',
    stock: 0
  });
}

function deleteProduct(productId: string) {
  if (!confirm('Ви впевнені, що хочете видалити цей виріб?')) return;

  products.value = products.value.filter(p => p.product_id !== productId);

  const newConsumption: ConsumptionMap = {};
  for (const key in consumption.value) {
    if (!key.endsWith(`_${productId}`)) {
      newConsumption[key] = consumption.value[key];
    }
  }
  consumption.value = newConsumption;
}

function deleteResource(resourceId: string) {
  if (!confirm('Ви впевнені, що хочете видалити цей ресурс?')) return;

  resources.value = resources.value.filter(r => r.resource_id !== resourceId);

  const newConsumption: ConsumptionMap = {};
  for (const key in consumption.value) {
    if (!key.startsWith(`${resourceId}_`)) {
      newConsumption[key] = consumption.value[key];
    }
  }
  consumption.value = newConsumption;
}

function runGreedyWithLogs() {
  productionPlan.value = {};
  totalProfit.value = 0;
  stepLog.value = ["Запуск жадібного алгоритму (з логами)..."];
  executionTime.value = 0;

  let currentStock: { [key: string]: number } = Object.fromEntries(
    resources.value.map(r => [r.resource_id, r.stock])
  );
  
  const sortedProducts = [...products.value].sort((a, b) => b.profit - a.profit);
  stepLog.value.push(`Продукти відсортовано за прибутком: ${sortedProducts.map(p => p.name).join(', ')}`);

  for (const product of sortedProducts) {
    stepLog.value.push(`--- Розглядаємо продукт: ${product.name} (Прибуток: ${product.profit}) ---`);
    let maxPossibleUnits = Infinity;

    for (const resource of resources.value) {
      const key = `${resource.resource_id}_${product.product_id}`;
      const amountNeeded = consumption.value[key] || 0;
      
      if (amountNeeded > 0) {
        const possible = currentStock[resource.resource_id] / amountNeeded;
        if (possible < maxPossibleUnits) {
          maxPossibleUnits = possible;
          stepLog.value.push(`Обмеження по ресурсу ${resource.name}: можна ${Math.floor(possible)} од.`);
        }
      }
    }
    
    const unitsToProduce = Math.floor(maxPossibleUnits);

    if (unitsToProduce > 0 && unitsToProduce !== Infinity) {
      stepLog.value.push(`==> ВИРІШЕНО: Виробити ${unitsToProduce} од. продукту ${product.name}`);
      productionPlan.value[product.name] = (productionPlan.value[product.name] || 0) + unitsToProduce;
      totalProfit.value += unitsToProduce * product.profit;

      for (const resource of resources.value) {
        const key = `${resource.resource_id}_${product.product_id}`;
        const amountNeeded = consumption.value[key] || 0;
        currentStock[resource.resource_id] -= unitsToProduce * amountNeeded;
      }
    } else {
      stepLog.value.push(`Недостатньо ресурсів для продукту ${product.name}. Пропускаємо.`);
    }
  }
  stepLog.value.push(`--- Алгоритм завершено ---`);
}

function runGreedyBenchmark() {
  productionPlan.value = {};
  totalProfit.value = 0;
  stepLog.value = ["Запуск бенчмарку..."];
  const t0 = performance.now();

  let currentStock: { [key: string]: number } = Object.fromEntries(
    resources.value.map(r => [r.resource_id, r.stock])
  );
  
  const sortedProducts = [...products.value].sort((a, b) => b.profit - a.profit);

  for (const product of sortedProducts) {
    let maxPossibleUnits = Infinity;

    for (const resource of resources.value) {
      const key = `${resource.resource_id}_${product.product_id}`;
      const amountNeeded = consumption.value[key] || 0;
      
      if (amountNeeded > 0) {
        const possible = currentStock[resource.resource_id] / amountNeeded;
        if (possible < maxPossibleUnits) {
          maxPossibleUnits = possible;
        }
      }
    }
    
    const unitsToProduce = Math.floor(maxPossibleUnits);

    if (unitsToProduce > 0 && unitsToProduce !== Infinity) {
      productionPlan.value[product.name] = (productionPlan.value[product.name] || 0) + unitsToProduce;
      totalProfit.value += unitsToProduce * product.profit;

      for (const resource of resources.value) {
        const key = `${resource.resource_id}_${product.product_id}`;
        const amountNeeded = consumption.value[key] || 0;
        currentStock[resource.resource_id] -= unitsToProduce * amountNeeded;
      }
    }
  }

  const t1 = performance.now();
  executionTime.value = t1 - t0;
  stepLog.value.push(`--- Алгоритм завершено за ${executionTime.value.toFixed(4)} мс ---`);
  stepLog.value.push(`TimestampStart: ${t0}`);
  stepLog.value.push(`TimestampEnd: ${t1}`);
}
</script>

<template>
  <div class="container-fluid my-4">
    <div v-if="isLoading" class="alert alert-info">Завантаження...</div>

    <header class="d-flex justify-content-between align-items-center mb-4 flex-wrap">
      <h1 class="me-3">Лабораторна робота №2</h1>
      <div class="d-flex flex-wrap gap-2">
        <button class="btn btn-info btn-sm" @click="loadDefaultData">
          ♻️ Скинути до Варіанту 1
        </button>
        <button class="btn btn-danger btn-sm" @click="clearAllData">
          🗑️ Очистити все (і зберегти)
        </button>
        <button class="btn btn-success btn-lg" @click="saveAllChanges(false)" :disabled="isLoading">
          💾 Оновити/Зберегти в БД
        </button>
      </div>
    </header>

    <div class="row g-4">
      <div class="col-lg-8">
        <section class="settings card shadow-sm">
          <div class="card-header d-flex justify-content-between align-items-center flex-wrap">
            <h2 class="h4 mb-0 me-3">⚙️ Налаштування Задачі</h2>
            <div>
              <button class="btn btn-primary btn-sm me-2" @click="addResource">
                + Додати Ресурс
              </button>
              <button class="btn btn-primary btn-sm" @click="addProduct">
                + Додати Виріб
              </button>
            </div>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-bordered table-hover align-middle">
                <thead class="table-light">
                  <tr>
                    <th class="sticky-col">Ресурс / Запас</th>
                    <th v-for="p in products" :key="p.product_id" class="text-center th-product">
                      <button class="btn-close btn-delete" title="Видалити виріб"
                              @click="deleteProduct(p.product_id)">
                      </button>
                      <input type="text" class="form-control form-control-sm mb-1" v-model="p.name">
                      <div class="input-group input-group-sm">
                        <span class="input-group-text">₴</span>
                        <input type="number" class="form-control" v-model.number="p.profit">
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="r in resources" :key="r.resource_id">
                    <td class="sticky-col td-resource">
                       <button class="btn-close btn-delete" title="Видалити ресурс"
                              @click="deleteResource(r.resource_id)">
                       </button>
                      <input type="text" class="form-control form-control-sm mb-1" v-model="r.name">
                      <div class="input-group input-group-sm">
                        <span class="input-group-text">Запас:</span>
                        <input type="number" class="form-control" v-model.number="r.stock">
                      </div>
                    </td>
                    <td v-for="p in products" :key="p.product_id" class="text-center">
                      <input 
                        type="number" 
                        class="form-control form-control-sm matrix-input"
                        v-model.number="consumption[`${r.resource_id}_${p.product_id}`]"
                        min="0"
                        placeholder="0"
                      >
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      <div class="col-lg-4">
        <section class="results card shadow-sm">
          <div class="card-header">
            <h2 class="h4 mb-0">📊 Результати</h2>
          </div>
          <div class="card-body">
            <div class="d-grid gap-2">
              <button @click="runGreedyWithLogs" class="btn btn-warning">
                🚀 Запустити "Жадібний Алгоритм" (з логами)
              </button>
              <button @click="runGreedyBenchmark" class="btn btn-outline-danger">
                ⏱️ Запустити "Бенчмарк" (для часу)
              </button>
            </div>

            <hr class="my-4">

            <h3>Час виконання: 
              <span class="text-danger fw-bold">{{ executionTime.toFixed(4) }} мс</span>
            </h3>

            <h3>Загальний прибуток: 
              <span class="text-success fw-bold">{{ totalProfit.toFixed(2) }} ₴</span>
            </h3>
            
            <h4>План виробництва:</h4>
            <ul class="list-group mb-3">
              <li v-if="Object.keys(productionPlan).length === 0" class="list-group-item">
                План ще не розраховано.
              </li>
              <li v-for="(count, name) in productionPlan" :key="name" class="list-group-item d-flex justify-content-between align-items-center">
                <strong>{{ name }}</strong>
                <span class="badge bg-primary rounded-pill">{{ count }} од.</span>
              </li>
            </ul>

            <h4>Лог виконання:</h4>
            <div class="log-box border rounded p-3 bg-light">
              <p v-for="(line, index) in stepLog" :key="index" class="mb-1"
                 :class="{
                   'text-success fw-bold': line.includes('==>'),
                   'text-muted': line.includes('---'),
                   'text-primary': line.includes('Завантаження')
                 }">
                {{ line }}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.th-product, .td-resource {
  position: relative;
  padding-top: 30px !important;
}
.btn-delete {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 8px;
  height: 8px;
  opacity: 0.3;
}
.btn-delete:hover {
  opacity: 1;
  background-color: #f8d7da;
}
.table-responsive {
  max-height: 60vh;
  overflow: auto;
}
th.sticky-col, td.sticky-col {
  position: sticky;
  left: 0;
  z-index: 2;
  background-color: #f8f9fa;
}
thead.table-light th.sticky-col {
  background-color: #e9ecef;
}
.matrix-input {
  width: 70px;
  margin: 0 auto;
}
.log-box {
  height: 350px;
  overflow-y: auto;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.9em;
}
</style>