// 1. 必要なライブラリを読み込む
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 2. Expressアプリを作成
const app = express();
const port = 3000;

// 3. データベースに接続
const db = new sqlite3.Database('./bluearchive.db', (err) => {
  if (err) {
    return console.error('データベース接続エラー:', err.message);
  }
  console.log('データベース [bluearchive.db] に接続しました。');
});

// --- ヘルパー関数 (Promise化) ---
const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      resolve(row);
    });
  });
};
const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      resolve(rows);
    });
  });
};

// --- (★キャラ切り替え対応) 全キャラクターのリストを取得するAPI ---
app.get('/api/characters', async (req, res) => {
  console.log('リクエスト受信: /api/characters (全キャラリスト)');
  try {
    // IDと名前だけをリストで取得
    const characters = await dbAll('SELECT id, name FROM characters ORDER BY name');
    res.json(characters);
  } catch (err) {
    console.error('キャラリスト取得エラー:', err.message);
    res.status(500).json({ error: err.message });
  }
});
// --- (★ここまで) ---


// 4. (既存) 拡張されたキャラクターAPI
app.get('/api/character/:name', async (req, res) => {
  const characterName = req.params.name;
  console.log(`リクエスト受信 (拡張API): /api/character/${characterName}`);

  try {
    // (A) キャラクター基本情報
    const character = await dbGet('SELECT * FROM characters WHERE name = ?', [characterName]);
    if (!character) {
      console.log('データが見つかりませんでした。');
      return res.status(404).json({ error: 'Character not found' });
    }
    const charId = character.id;

    const bondGearFlag = await dbGet('SELECT 1 FROM bond_gear_flags WHERE character_id = ?', [charId]);
    const hasBondGear = !!bondGearFlag; // データがあれば true, なければ false に変換

    // (B) 星ボーナス
    const starBonuses = await dbAll('SELECT * FROM star_bonuses');
    // (C) 絆ボーナス
    const kizunaBonuses = await dbAll('SELECT * FROM kizuna_bonuses WHERE character_id = ?', [charId]);
    // (D) 武器ボーナス
    const weaponBonuses = await dbAll('SELECT * FROM weapon_bonuses WHERE character_id = ?', [charId]);
    // (E) 装備ボーナス
    const equipmentBonuses = await dbAll('SELECT * FROM equipment_bonuses');

    // 5. データをまとめる
    const responseData = {
      baseStats: character,
      hasBondGear: hasBondGear,
      bonuses: {
        star: starBonuses,
        kizuna: kizunaBonuses,
        weapon: weaponBonuses,
        equipment: equipmentBonuses
      }
    };
    
    console.log('全キャラデータをJSONで送信します。');
    res.json(responseData);

  } catch (err) {
    console.error('データベース検索エラー (拡張):', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 6. (既存) 敵リストを取得するAPI
app.get('/api/enemies', async (req, res) => {
  console.log('リクエスト受信: /api/enemies (全敵リスト)');
  try {
    const enemies = await dbAll('SELECT * FROM enemies ORDER BY name');
    res.json(enemies);
  } catch (err) {
    console.error('敵リスト取得エラー:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 7. (既存) 特定キャラのスキルリストを取得するAPI
app.get('/api/skills/:characterId', async (req, res) => {
  const charId = req.params.characterId;
  console.log(`リクエスト受信: /api/skills/${charId} (特定キャラスキル)`);
  try {
    const skills = await dbAll('SELECT * FROM skills WHERE character_id = ?', [charId]);
    res.json(skills);
  } catch (err) {
    console.error('スキルリスト取得エラー:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 8. publicフォルダの中身を配信する設定
app.use(express.static(path.join(__dirname, 'public')));

// 9. サーバーを起動
app.listen(port, () => {
  console.log(`サーバーが http://localhost:${port} で起動しました`);
  console.log('APIが拡張されました (characters, enemies, skills)。');
});