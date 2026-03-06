const db = require('../config/database');

class User {
  static async findAll() {
    return new Promise((resolve, reject) => {
      db.all('SELECT id, username, role, created_at, updated_at FROM users', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static async findById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT id, username, role, created_at, updated_at FROM users WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static async findByUsername(username) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static async create(userData) {
    const { username, password_hash, role = 'user' } = userData;
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
        [username, password_hash, role],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, username, role });
        }
      );
    });
  }

  static async update(id, userData) {
    const { username, password_hash, role } = userData;
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET username = ?, password_hash = ?, role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [username, password_hash, role, id],
        function (err) {
          if (err) reject(err);
          else resolve({ id, username, role });
        }
      );
    });
  }

  static async delete(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM users WHERE id = ?', [id], function (err) {
        if (err) reject(err);
        else resolve({ changedRows: this.changes });
      });
    });
  }
}

module.exports = User;