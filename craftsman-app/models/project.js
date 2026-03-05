const db = require('../config/database');

class Project {
  static async findAll() {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM projects ORDER BY created_at DESC', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static async findById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM projects WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static async create(projectData) {
    const { name, client, description, status = 'active' } = projectData;
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO projects (name, client, description, status) VALUES (?, ?, ?, ?)',
        [name, client, description, status],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, name, client, description, status });
        }
      );
    });
  }

  static async update(id, projectData) {
    const { name, client, description, status } = projectData;
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE projects SET name = ?, client = ?, description = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [name, client, description, status, id],
        function (err) {
          if (err) reject(err);
          else resolve({ id, name, client, description, status });
        }
      );
    });
  }

  static async delete(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM projects WHERE id = ?', [id], function (err) => {
        if (err) reject(err);
        else resolve({ changedRows: this.changes });
      });
    });
  }
}

module.exports = Project;