const db = require('../config/database');

class TimeEntry {
  static async findAll() {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT te.*, p.name as project_name, u.username as user_name
        FROM time_entries te
        LEFT JOIN projects p ON te.project_id = p.id
        LEFT JOIN users u ON te.user_id = u.id
        ORDER BY te.created_at DESC
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static async findById(id) {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT te.*, p.name as project_name, u.username as user_name
        FROM time_entries te
        LEFT JOIN projects p ON te.project_id = p.id
        LEFT JOIN users u ON te.user_id = u.id
        WHERE te.id = ?
      `, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static async findByUserId(userId) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT te.*, p.name as project_name
        FROM time_entries te
        LEFT JOIN projects p ON te.project_id = p.id
        WHERE te.user_id = ?
        ORDER BY te.start_date DESC
      `, [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static async findByProjectId(projectId) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT te.*, u.username as user_name
        FROM time_entries te
        LEFT JOIN users u ON te.user_id = u.id
        WHERE te.project_id = ?
        ORDER BY te.start_date DESC
      `, [projectId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static async create(timeEntryData) {
    const { project_id, user_id, start_date, end_date, task_description } = timeEntryData;
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO time_entries (project_id, user_id, start_date, end_date, task_description) VALUES (?, ?, ?, ?, ?)',
        [project_id, user_id, start_date, end_date, task_description],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, project_id, user_id, start_date, end_date, task_description });
        }
      );
    });
  }

  static async update(id, timeEntryData) {
    const { project_id, user_id, start_date, end_date, task_description } = timeEntryData;
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE time_entries SET project_id = ?, user_id = ?, start_date = ?, end_date = ?, task_description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [project_id, user_id, start_date, end_date, task_description, id],
        function (err) {
          if (err) reject(err);
          else resolve({ id, project_id, user_id, start_date, end_date, task_description });
        }
      );
    });
  }

  static async delete(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM time_entries WHERE id = ?', [id], function (err) => {
        if (err) reject(err);
        else resolve({ changedRows: this.changes });
      });
    });
  }
}

module.exports = TimeEntry;