const { Pool } = require('pg');
const format = require('pg-format');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'test2',
  password: 'p232kv20',
  port: 5432,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

class School{

    static getStudentsByLessonId(lessonIds) {
        const sql = `
            select LS.lesson_id, LS.student_id, S.name, LS.visit from lesson_students as LS 
            join students as S
            on LS.student_id = S.id
            where lesson_id in (${lessonIds})
        `;
        return pool.query(sql);
    }


    static getTeachersByLessonId(lessonIds) {
        const sql = `
            select LT.lesson_id, LT.teacher_id, T.name from lesson_teachers as LT 
            join teachers as T
            on LT.teacher_id = T.id
            where LT.lesson_id in (${lessonIds})
        `;
        return pool.query(sql);
    }


    static getLessonsByteacherIds(teacherIds) {
        const sqlGetLessonsByteacherIds = `select *from lesson_teachers where teacher_id in (${teacherIds})`;
        return pool.query(sqlGetLessonsByteacherIds);
    }


    static getTeachersById(teacherIds) {
        const sql = `select array(select id from teachers where id in (${teacherIds}))`;
        return pool.query(sql);
    }


    static async getLessons(params, count, offset) {
        let sql = "select id, title, to_char(date, 'YYYY-MM-DD') as date, status from lessons";
        let flagSQLAnd = false;

        if(Object.keys(params)) {
            sql += " where ";
            

            if(params.hasOwnProperty("arrLessonsId")) {
                sql += `id in (${params.arrLessonsId})`
                flagSQLAnd = true;
            }

            if(params.hasOwnProperty("status")) {
                if(flagSQLAnd) {
                    sql += " and ";
                }
                sql += ` status = ${params.status}`;
                flagSQLAnd = true;
            }

            if(params.hasOwnProperty("date")) {
                if(flagSQLAnd) {
                    sql += " and ";
                }

                if(params.date.length === 1) {
                    sql += `date = '${params.date[0]}'`;
                } else {
                    sql += `date between '${params.date[0]}' and '${params.date[1]}'`;
                }
            }
        }

        sql += ` offset ${offset} limit ${count}`;

        return pool.query(sql);
    }

    static async addLessons(lessons, teacherIds) {
        const queryData = lessons.map((item) => [item.date, item.title])
        const sql = format(`insert into lessons(date, title) values %L RETURNING id`, queryData);

        try {
            await pool.query('BEGIN');
            const idsOfAddLessons = (await pool.query(sql)).rows;

            const objIdLessonIdTeacher = idsOfAddLessons.reduce((arr, objId) => {
                teacherIds.forEach( id => {
                    let obj = {
                        lesson_id: objId.id,
                        teacher_id: id
                    }

                    arr.push(obj)
                });
            
                return arr;
            }, []);

            const queryData2 = objIdLessonIdTeacher.map((item) => [item.lesson_id, item.teacher_id])
            const sql2 = format(`insert into lesson_teachers(lesson_id, teacher_id) values %L`, queryData2);
            await pool.query(sql2);

            await pool.query('COMMIT');
        } catch(err) {
            console.log(err);
            await pool.query('ROLLBACK');
            return Promise.resolve(false);
        }
        
        return Promise.resolve(true);
    }
}

module.exports= School;