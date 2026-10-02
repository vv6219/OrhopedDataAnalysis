const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../db/orthopedic_data_center.sqlite');
const db = new sqlite3.Database(dbPath);

async function getAll(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function run() {
  const operations = await getAll('SELECT * FROM operations');
  const materials = await getAll('SELECT * FROM materials_catalog');
  
  let insertedCount = 0;
  
  db.run("BEGIN TRANSACTION");
  const insertStmt = db.prepare("INSERT INTO operation_materials (operation_id, material_id, quantity) VALUES (?, ?, ?)");

  // Helper to find a material by keyword
  const findMat = (keyword) => {
    return materials.find(m => m.material_name.toLowerCase().includes(keyword.toLowerCase()));
  };

  for (const op of operations) {
    const opName = op.name.toLowerCase();
    const toAdd = []; // array of { matId, qty }

    // 1. Injections (Внутрисуставная, блокада, введение)
    if (opName.includes('внутрисуставная') || opName.includes('блокада') || opName.includes('введение')) {
      const syringe = findMat('шприц') || materials[0];
      const alcohol = findMat('спирт.салф') || findMat('спиртовые') || findMat('спирт');
      const gloves = findMat('перчатки');
      const plaster = findMat('пластырь') || findMat('повязка');
      
      if (syringe) toAdd.push({ matId: syringe.id, qty: 1 });
      if (alcohol) toAdd.push({ matId: alcohol.id, qty: 2 });
      if (gloves) toAdd.push({ matId: gloves.id, qty: 1 });
      if (plaster) toAdd.push({ matId: plaster.id, qty: 1 });
    }

    // 2. PRP
    if (opName.includes('prp') || opName.includes('плазмолифтинг')) {
      const prpTube = findMat('prp') || findMat('пробирка') || findMat('пробирки');
      const syringe = findMat('шприц');
      const needle = findMat('бабочк') || findMat('игла');
      
      if (prpTube) toAdd.push({ matId: prpTube.id, qty: opName.includes('2') ? 2 : 1 });
      if (syringe) toAdd.push({ matId: syringe.id, qty: 1 });
      if (needle) toAdd.push({ matId: needle.id, qty: 1 });
    }

    // 3. SVF
    if (opName.includes('svf')) {
      const svf = findMat('svf');
      if (svf) toAdd.push({ matId: svf.id, qty: 1 });
    }

    // 4. Стельки
    if (opName.includes('стельк')) {
      let specificInsole = null;
      if (opName.includes('джуниор') || opName.includes('юниор')) specificInsole = findMat('джуниор') || findMat('юниор');
      else if (opName.includes('kids') || opName.includes('детск')) specificInsole = findMat('kids');
      else if (opName.includes('взросл')) specificInsole = findMat('стельки m') || findMat('стельки l'); // fallback
      else specificInsole = findMat('стельки');
      
      if (specificInsole) toAdd.push({ matId: specificInsole.id, qty: 1 });
    }

    // 5. Перевязка / Снятие швов
    if (opName.includes('перевязк') || opName.includes('швов')) {
      const gauze = findMat('марлев') || findMat('салфетк');
      const alcohol = findMat('спирт');
      const plaster = findMat('пластырь');
      const gloves = findMat('перчатки');
      
      if (gauze) toAdd.push({ matId: gauze.id, qty: opName.includes('сложн') ? 3 : 1 });
      if (alcohol) toAdd.push({ matId: alcohol.id, qty: 2 });
      if (plaster) toAdd.push({ matId: plaster.id, qty: 1 });
      if (gloves) toAdd.push({ matId: gloves.id, qty: 1 });
    }

    // 6. Гипс / Турбокаст / Иммобилизация
    if (opName.includes('гипс') || opName.includes('турбокаст') || opName.includes('иммобилиз')) {
      const cast = findMat('турбокаст') || findMat('гипс');
      const bandage = findMat('бинт');
      
      if (cast) toAdd.push({ matId: cast.id, qty: 1 });
      if (bandage) toAdd.push({ matId: bandage.id, qty: 1 });
    }
    
    // 7. Фиксация (Бандаж / Ортез)
    if (opName.includes('фиксац') || opName.includes('бандаж') || opName.includes('реклинатор')) {
      // Try to find the exact match from materials by part of the name
      // e.g. "т-8506"
      const tMatch = op.name.match(/[ТT]\s*[-]?\s*(\d+)/i);
      if (tMatch) {
        const exact = findMat(tMatch[1]);
        if (exact) toAdd.push({ matId: exact.id, qty: 1 });
      } else {
         const general = findMat('бандаж') || findMat('реклинатор');
         if (general) toAdd.push({ matId: general.id, qty: 1 });
      }
    }

    // Deduplicate and filter out empty
    const uniqueMap = new Map();
    for (const item of toAdd) {
      if (item && item.matId) {
        if (!uniqueMap.has(item.matId)) {
          uniqueMap.set(item.matId, item);
        }
      }
    }

    // Insert to DB
    for (const item of uniqueMap.values()) {
      // Check if already exists to avoid duplication
      const existing = await getAll('SELECT * FROM operation_materials WHERE operation_id = ? AND material_id = ?', [op.id, item.matId]);
      if (existing.length === 0) {
        insertStmt.run([op.id, item.matId, item.qty]);
        insertedCount++;
      }
    }
  }

  insertStmt.finalize();
  db.run("COMMIT", () => {
    console.log(`Successfully mapped and inserted ${insertedCount} new materials into operations.`);
    db.close();
  });
}

run();
