const db = require('../config/database');

class Task {
  static async findAll() {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT t.*, p.name as project_name, u.username as assigned_user
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        LEFT JOIN users u ON t.assigned_to = u.id
        ORDER BY t.created_at DESC
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static async findById(id) {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT t.*, p.name as project_name, u.username as assigned_user
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        LEFT JOIN users u ON t.assigned_to = u.id
        WHERE t.id = ?
      `, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static async findByProjectId(projectId) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT t.*, u.username as assigned_user
        FROM tasks t
        LEFT JOIN users u ON t.assigned_to = u.id
        WHERE t.project_id = ?
        ORDER BY t.created_at DESC
      `, [projectId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static async findByUserId(userId) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT t.*, p.name as project_name
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.assigned_to = ?
        ORDER BY t.created_at DESC
      `, [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static async create(taskData) {
    const { name, description, due_date, assigned_to, project_id, status = 'pending' } = taskData;
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO tasks (name, description, due_date, assigned_to, project_id, status) VALUES (?, ?, ?, ?, ?, ?)',
        [name, description, due_date, assigned_to, project_id, status],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, name, description, due_date, assigned_to, project_id, status });
        }
      );
    });
  }

  static async update(id, taskData) {
    const { name, description, due_date, assigned_to, project_id, status } = taskData;
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE tasks SET name = ?, description = ?, due_date = ?, assigned_to = ?, project_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [name, description, due_date, assigned_to, project_id, status, id],
        function (err) {
          if (err) reject(err);
          else resolve({ id, name, description, due_date, assigned_to, project_id, status });
        }
      );
    });
  }

  static async delete(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM tasks WHERE id = ?', [id], function (err) => {
        if (err) reject(err);
        else resolve({ changedRows: this.changes });
      });
    });
  }
}

module.exports = Task;