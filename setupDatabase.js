const sqlite3 = require('sqlite3').verbose();


const db = new sqlite3.Database('./bluearchive.db', (err) => {
  if (err) {
    return console.error('DB接続エラー:', err.message);
  }
  console.log('[bluearchive.db] に接続しました。');


  db.serialize(() => {
    console.log('データベースのセットアップを開始します...');


    db.run(`
      CREATE TABLE IF NOT EXISTS characters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        image_path TEXT, 
        base_hp REAL NOT NULL,
        growth_hp REAL NOT NULL,
        base_atk REAL NOT NULL,
        growth_atk REAL NOT NULL,
        base_def REAL NOT NULL,
        growth_def REAL NOT NULL,
        base_heal REAL NOT NULL,
        growth_heal REAL NOT NULL
      )
    `, (err) => {
      if (err) return console.error('charactersテーブル作成エラー:', err.message);
      console.log('-> [characters] テーブル OK.');
    });

    const harukaData = [
      'ハルカ', 'Haruka_00.png', 3033, 481.6, 116, 10.59, 182, 9.1912, 1384, 27.64
      //HP 上昇率　攻撃　上昇率　防御　上昇率　治癒力　上昇率
    ];
    db.run(`
      INSERT OR IGNORE INTO characters 
      (name, image_path, base_hp, growth_hp, base_atk, growth_atk, base_def, growth_def, base_heal, growth_heal)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, harukaData, (err) => {
      if (err) return console.error('ハルカ挿入エラー:', err.message);
    });
  
    const aruData = [
      'アル', 'Aru_00.png', 2236, 173, 369, 44, 19, 1, 1408, 38
    ];
    db.run(`
      INSERT OR IGNORE INTO characters 
      (name, image_path, base_hp, growth_hp, base_atk, growth_atk, base_def, growth_def, base_heal, growth_heal)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, aruData, (err) => {
      if (err) return console.error('アル挿入エラー:', err.message);
    });

    // --- 3. star_bonuses テーブル (変更なし) ---
    db.run(`
      CREATE TABLE IF NOT EXISTS star_bonuses (
        star INTEGER PRIMARY KEY,
        hp_multiplier REAL NOT NULL,
        atk_multiplier REAL NOT NULL,
        heal_multiplier REAL NOT NULL
      )
    `, (err) => { if (err) return console.error(err.message); });
    const starData = [
      [1, 1.00, 1.00, 1.000], [2, 1.05, 1.10, 1.075], [3, 1.12, 1.22, 1.175],
      [4, 1.21, 1.36, 1.295], [5, 1.35, 1.53, 1.445]
    ];
    const starStmt = db.prepare(`INSERT OR IGNORE INTO star_bonuses VALUES (?, ?, ?, ?)`);
    for (const data of starData) { starStmt.run(data); }
    starStmt.finalize((err) => { if (err) return console.error(err.message); });


    db.run(`
      CREATE TABLE IF NOT EXISTS kizuna_bonuses (
        character_id INTEGER NOT NULL, rank INTEGER NOT NULL, bonus_atk INTEGER NOT NULL, bonus_hp INTEGER NOT NULL, PRIMARY KEY (character_id, rank)
      )
    `, (err) => { if (err) return console.error(err.message); });
    const kizunaDataHaruka = [ [1, 1, 0, 0], [1, 20, 68, 415], [1, 50, 128, 815] ];
    const kizunaStmt = db.prepare(`INSERT OR IGNORE INTO kizuna_bonuses VALUES (?, ?, ?, ?)`);
    for (const data of kizunaDataHaruka) { kizunaStmt.run(data); }
    kizunaStmt.finalize((err) => { if (err) return console.error(err.message); });
    const kizunaDataAru = [ [2, 1, 0, 0], [2, 20, 50, 300], [2, 50, 100, 600] ];
    const kizunaStmtAru = db.prepare(`INSERT OR IGNORE INTO kizuna_bonuses VALUES (?, ?, ?, ?)`);
    for (const data of kizunaDataAru) { kizunaStmtAru.run(data); }
    kizunaStmtAru.finalize((err) => { if (err) return console.error(err.message); });

    // --- 5. weapon_bonuses テーブル (変更なし) ---
    db.run(`
      CREATE TABLE IF NOT EXISTS weapon_bonuses (
        character_id INTEGER NOT NULL, star INTEGER NOT NULL, level INTEGER NOT NULL, bonus_atk INTEGER NOT NULL, bonus_hp INTEGER NOT NULL, PRIMARY KEY (character_id, star, level)
      )
    `, (err) => { if (err) return console.error(err.message); });
    // ハルカ (ID=1)
    const weaponLevels = [1, 30, 40, 50, 60];
    const weaponAtk = [59, 215, 269, 323, 377];
    const weaponHp = [1667, 6062, 7577, 9092, 10608];
    const weaponStmt = db.prepare(`INSERT OR IGNORE INTO weapon_bonuses VALUES (?, ?, ?, ?, ?)`);
    for (const star of [1, 2, 3, 4]) {
      for (let i = 0; i < weaponLevels.length; i++) {
        weaponStmt.run(1, star, weaponLevels[i], weaponAtk[i], weaponHp[i]);
      }
    }
    weaponStmt.finalize((err) => { if (err) return console.error(err.message); });
    // アル (ID=2)
    const weaponLevelsAru = [1, 30, 40, 50, 60];
    const weaponAtkAru = [162, 589, 737, 884, 1032];
    const weaponHpAru = [561, 2039, 2569, 3058, 3568];
    const weaponStmtAru = db.prepare(`INSERT OR IGNORE INTO weapon_bonuses VALUES (?, ?, ?, ?, ?)`);
    for (const star of [1, 2, 3, 4]) {
      for (let i = 0; i < weaponLevelsAru.length; i++) {
        weaponStmtAru.run(2, star, weaponLevelsAru[i], weaponAtkAru[i], weaponHpAru[i]);
      }
    }
    weaponStmtAru.finalize((err) => { if (err) return console.error(err.message); });

    db.run(`
      CREATE TABLE IF NOT EXISTS equipment_bonuses (
        equipment_type INTEGER NOT NULL, tier INTEGER NOT NULL, stat_type TEXT NOT NULL, value REAL NOT NULL, PRIMARY KEY (equipment_type, tier, stat_type)
      )
    `, (err) => { if (err) return console.error(err.message); });
    const equipData = [
      [1, 1, 'atk_multiplier', 1.04], [1, 2, 'atk_multiplier', 1.065], [1, 3, 'atk_multiplier', 1.09],
      [1, 4, 'atk_multiplier', 1.125], [1, 4, 'hp_multiplier', 1.06],
      [1, 5, 'atk_multiplier', 1.20], [1, 5, 'hp_multiplier', 1.09],
      [1, 6, 'atk_multiplier', 1.25], [1, 6, 'hp_multiplier', 1.12],
      [1, 7, 'atk_multiplier', 1.30], [1, 7, 'hp_multiplier', 1.135],
      [1, 8, 'atk_multiplier', 1.35], [1, 8, 'hp_multiplier', 1.15],
      [1, 9, 'atk_multiplier', 1.42], [1, 9, 'hp_multiplier', 1.175],
      [1, 10, 'atk_multiplier', 1.46], [1, 10, 'hp_multiplier', 1.20],
      [2, 1, 'hp_add', 600], [2, 2, 'hp_add', 975], [2, 3, 'hp_add', 1350],
      [2, 4, 'hp_add', 1875], [2, 4, 'def_add', 1000],
      [2, 5, 'hp_add', 3500], [2, 5, 'def_add', 1100],
      [2, 6, 'hp_add', 5500], [2, 6, 'def_add', 1200],
      [2, 7, 'hp_add', 7500], [2, 7, 'def_add', 1300],
      [2, 8, 'hp_add', 9500], [2, 8, 'def_add', 1400],
      [2, 9, 'hp_add', 12000], [2, 9, 'def_add', 1600], [2, 9, 'hp_multiplier', 1.05],
      [2, 10, 'hp_add', 14000], [2, 10, 'def_add', 1700], [2, 10, 'hp_multiplier', 1.05]
    ];
    const equipStmt = db.prepare(`INSERT OR IGNORE INTO equipment_bonuses VALUES (?, ?, ?, ?)`);
    for (const data of equipData) { equipStmt.run(data); }
    equipStmt.finalize((err) => { if (err) return console.error(err.message); });

    // --- 9. 愛用品所持フラグテーブル ---
    // キャラクターIDのみを保存。ここにIDがあれば「愛用品あり」とみなす
    db.run(`
      CREATE TABLE IF NOT EXISTS bond_gear_flags (
        character_id INTEGER PRIMARY KEY
      )
    `, (err) => { if (err) return console.error(err.message); });

    // アル (ID=2) に愛用品フラグを立てる
    db.run(`INSERT OR IGNORE INTO bond_gear_flags (character_id) VALUES (2)`);

// --- 7. enemies テーブル ---
    db.run(`
      CREATE TABLE IF NOT EXISTS enemies (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        name TEXT NOT NULL UNIQUE, 
        defense INTEGER NOT NULL, 
        defense_type TEXT NOT NULL, 
        environment TEXT
      )
    `, (err) => { if (err) return console.error(err.message); });

    // 敵データのリスト (名前, 防御力, 防御タイプ, 地形)
    // ※難易度Insaneを基準にしたサンプル値です
    const enemyData = [
      // --- 特殊装甲 (青) / 弱点: 神秘 ---
      ['シロ＆クロ(Insane)', 1000, '特殊装甲', '市街地'],
      ['ペロロジラ(Insane)', 7000, '特殊装甲', '屋内'],
      ['ゴズ(Insane)', 100, '特殊装甲', '屋内'],
      ['グレゴリオ(Insane)', 5000, '特殊装甲', '屋内'],

      // --- 軽装備 (赤) / 弱点: 爆発 ---
      ['ヒエロニムス(Insane)', 2900, '軽装備', '屋内'],
      ['カイトマン(Insane)', 1400, '軽装備', '市街地'],
      
      // --- 重装甲 (黄) / 弱点: 貫通 ---
      ['ビナー(Insane)', 5000, '重装甲', '野外'],
      ['ケセド(Insane・殻開)', 100, '重装甲', '野外'],
      ['ホド(Insane)', 5000, '重装甲', '市街地'],
      ['ビナー(Extreme)', 2000, '重装甲', '野外'] // 比較用
    ];

    const enemyStmt = db.prepare(`INSERT OR IGNORE INTO enemies (name, defense, defense_type, environment) VALUES (?, ?, ?, ?)`);
    for (const data of enemyData) { enemyStmt.run(data); }
    enemyStmt.finalize((err) => { if (err) return console.error(err.message); });

    // --- 8. skills テーブル ---
    db.run(`
      CREATE TABLE IF NOT EXISTS skills (
        id INTEGER PRIMARY KEY AUTOINCREMENT, character_id INTEGER NOT NULL, name TEXT NOT NULL, skill_type TEXT NOT NULL, attack_type TEXT NOT NULL, multiplier_lv1 REAL NOT NULL, multiplier_max REAL NOT NULL
      )
    `, (err) => { if (err) return console.error(err.message); });
    const skillData = [
      [1, '破滅の息吹', 'EX', '爆発', 3.5, 6.65],
      [1, '雑草魂', 'Normal', '爆発', 1.73, 3.29]
    ];
    const skillStmt = db.prepare(`INSERT OR IGNORE INTO skills VALUES (NULL, ?, ?, ?, ?, ?, ?)`);
    for (const data of skillData) { skillStmt.run(data); }
    skillStmt.finalize((err) => { if (err) return console.error(err.message); });

  }); 


  db.close((err) => {
    if (err) {
      return console.error('DB切断エラー:', err.message);
    }
    console.log('データベースのセットアップが完了しました。(image_path 追加済み)');
  });

});