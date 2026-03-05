const db = require('../config/database');

class InventoryItem {
  static async findAll() {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT ii.*, p.name as project_name
        FROM inventory_items ii
        LEFT JOIN projects p ON ii.project_id = p.id
        ORDER BY ii.created_at DESC
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static async findById(id) {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT ii.*, p.name as project_name
        FROM inventory_items ii
        LEFT JOIN projects p ON ii.project_id = p.id
        WHERE ii.id = ?
      `, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static async findByProjectId(projectId) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM inventory_items
        WHERE project_id = ?
        ORDER BY name
      `, [projectId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static async create(inventoryData) {
    const { name, serial_number, description, status = 'available', project_id, quantity = 1, location } = inventoryData;
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO inventory_items (name, serial_number, description, status, project_id, quantity, location) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, serial_number, description, status, project_id, quantity, location],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, name, serial_number, description, status, project_id, quantity, location });
        }
      );
    });
  }

  static async update(id, inventoryData) {
    const { name, serial_number, description, status, project_id, quantity, location } = inventoryData;
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE inventory_items SET name = ?, serial_number = ?, description = ?, status = ?, project_id = ?, quantity = ?, location = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [name, serial_number, description, status, project_id, quantity, location, id],
        function (err) => {
          if (err) reject(err);
          else resolve({ id, name, serial_number, description, status, project_id, quantity, location });
        }
      );
    });
  }

  static async delete(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM inventory_items WHERE id = ?', [id], function (err) => {
        if (err) reject(err);
        else resolve({ changedRows: this.changes });
      });
    });
  }
}

module.exports = InventoryItem;