const School = require("../models/school.js");
const checkValidNumber = require("../tools/checkValidNumber.js");
const checkValidDate = require("../tools/checkValidDate.js");

exports.getLessons = async function (request, response){
    let params = {};

    let {date, status, lessonsPerPage, page, teacherIds, studentsCount} = request.query;
    
    lessonsPerPage = lessonsPerPage || 5;
    page = page || 1;
    const offset = (page - 1) * lessonsPerPage;
    
    let arrStudentsCount = null;
    if(studentsCount !== undefined) {
        arrStudentsCount = studentsCount.split(",");

        if(!checkValidNumber(arrStudentsCount) || arrStudentsCount.length > 2) {      
            response.status(400).json({ message: "Incorrect number of students!" })
            return;
        }
    }

    if(status !== undefined) {
        if(+status !== 0 && +status !== 1) {
            response.status(400).json({ message: "Status is not valid!" })
            return;
        } else {
            params.status = +status;
        }
    }  
    
    if(date) {
        const arrDates = date.split(",");
        
        const validDates = arrDates.every(date => checkValidDate(date));
        if(arrDates.length > 2 || arrDates[0] > arrDates[1] || !validDates) {
            response.status(400).json({ message: "Invalid date!" })
            return;
        }

        params.date = arrDates;
    }

    if(teacherIds !== undefined) {
        const arrTeacherIds = teacherIds.split(",");

        if(checkValidNumber(arrTeacherIds)) {
            
            let lessonIdTeacherId = null;
            try {
                lessonIdTeacherId = (await School.getLessonsByteacherIds(teacherIds)).rows;
            } catch (err) {
                console.log(err);
                response.status(400).json({ message: "Search error id lessons by id teachers!" })
                return;
            }
            const setLessonsId = new Set();
            
            lessonIdTeacherId.forEach(obj => {
                setLessonsId.add(obj.lesson_id);
            });
                
            params.arrLessonsId = Array.from(setLessonsId);
            
        } else {
            response.status(400).json({ message: "ID teacher is not valid!" })
            return;
        }
    }

    let lessons = null;
    try {
        lessons = (await School.getLessons(params, lessonsPerPage, offset)).rows;
    } catch(err) {
        console.log(err);
        response.status(400).json({ message: "Search error lessons!" })
        return;
    }

    if(lessons.length) {
   
        const idLessons = lessons.map(lesson => lesson.id);

        let teachers = null;
        let students = null;

        try {
            teachers = (await School.getTeachersByLessonId(idLessons)).rows;
        } catch(err) {
            console.log(err);
            response.status(400).json({ message: "Search error teachers by id lessons!" })
            return;
        }

        try {
            students = (await School.getStudentsByLessonId(idLessons)).rows;
        } catch(err) {
            console.log(err);
            response.status(400).json({ message: "Search error students by id lessons!" })
            return;
        }
        
        for(let indexLesson = 0; indexLesson < lessons.length; indexLesson++){
            const lesson = lessons[indexLesson];
            lesson.visitCount = 0;

            lesson.teachers = teachers.reduce(function(arr, teacher) {
                if(teacher.lesson_id === lesson.id) {
                    arr.push({
                        id: teacher.teacher_id,
                        name: teacher.name
                    })
                } 

                return arr;
            },  []);    

            lesson.students = students.reduce(function(arr, student) {
                if(student.lesson_id === lesson.id) {
                    arr.push({
                        id: student.student_id,
                        name: student.name,
                        visit: student.visit
                    });

                    if(student.visit) {
                        lesson.visitCount++;
                    }
                } 

                return arr;
            },  []);

            if(arrStudentsCount) {
                if(arrStudentsCount.length === 1) {
                    if(lesson.students.length !== +arrStudentsCount[arrStudentsCount.length-1]) {
                        lessons.splice(indexLesson, 1);
                        indexLesson--;
                    }
                } else {
                    if(lesson.students.length < +arrStudentsCount[0] || lesson.students.length > +arrStudentsCount[arrStudentsCount.length-1]) {
                        lessons.splice(indexLesson, 1);
                        indexLesson--;
                    }
                }
            }
            
        };
    }

    response.status(200).json(lessons);
};

exports.addLessons = async function(request, response){

    if(!Object.keys(request.body).length) {
        response.status(400).json({ message: "Body is empty!"});
        return;
    }
   
    let {title, teacherIds, days, firstDate, lessonsCount, lastDate} = request.body;
    
    if(lastDate !== undefined && lessonsCount !== undefined) {
        response.status(400).json({ message: "Only one of the parameters must be used: lastDate or lessonsCount!" })
        return;
    }

    if(title.trim() === "") {
        response.status(400).json({ message: "Title is empty!" })
        return;
    }

    if(!Array.isArray(teacherIds)) {
        response.status(400).json({ message: "TeacherIds is not array!" })
        return;
    }
    if(!teacherIds.length) {
        response.status(400).json({ message: "Array teacherIds is empty!" })
        return;
    }
    let arrIdTeachers = null;
    try {
        arrIdTeachers = (await School.getTeachersById(teacherIds)).rows[0].array;   
    } catch (err) {
        console.log(err);
        response.status(400).json({ message: "Error checking teachers by id!" })
        return;
    }
 
    const arrIdMissing = teacherIds.filter(val => !~arrIdTeachers.indexOf(val));
   
    if(arrIdMissing.length) {
        response.status(400).json({ message: `No teachers with id: ${arrIdMissing}!` })
        return;
    }

    if(!Array.isArray(days)) {
        response.status(400).json({ message: "Days is not array!" });
        return;
    }
    if(!days.length || days.length > 7) {
        response.status(400).json({ message: "Invalid array length!" });
        return;
    }
    const validDays = days.every(day => day >=0 && day < 7);
    if(!validDays) {
        response.status(400).json({ message: "Wrong days of the week!" });
        return;
    }

    if(!firstDate || !checkValidDate(firstDate)) {
        response.status(400).json({ message: "FirstDate is invalid!" });
        return;
    }

    if(Date.parse(firstDate) < new Date()) {
        response.status(400).json({ message: "FirstDate is less than current date!" });
        return;
    }

    const lessons = [];
    const maxLessonsCount = 300;
    if(lessonsCount !== undefined) {
        if(typeof lessonsCount !== "number" || lessonsCount <= 0) {
            response.status(400).json({ message: "lessonsCount is invalid!" });
            return;
        }  

        const excessLessonsCount = lessonsCount - maxLessonsCount;
        let lessonDay = new Date(firstDate);

        while (lessonsCount > 0) {
            getDay = lessonDay.getDay();
            if(~days.indexOf(getDay)) {
                const _firstDate = new Date(firstDate);
                if(lessonDay > _firstDate.setFullYear(_firstDate.getFullYear() + 1) || lessonsCount === excessLessonsCount) {
                    break; 
                }
            
                lessons.push({ date: lessonDay, title });
                lessonsCount--;
            } 
            
            lessonDay = new Date(lessonDay);
            lessonDay.setDate(lessonDay.getDate() + 1);
        }
    } else {
        if(!lastDate || !checkValidDate(lastDate)) {
            response.status(400).json({ message: "lastDate is invalid!" });
            return;
        }

        lessonsCount = 0; 
        
        let lessonDay = new Date(firstDate);

        const maxLastDate = new Date(lessonDay);
        maxLastDate.setFullYear(maxLastDate.getFullYear() + 1);
        
        while (lessonsCount < maxLessonsCount && lessonDay <= Date.parse(lastDate) && lessonDay <= maxLastDate) {

            getDay = lessonDay.getDay();
            
            if(~days.indexOf(getDay)) {
                lessons.push({ date: lessonDay, title });
                lessonsCount++;
            } 

            lessonDay = new Date(lessonDay);
            lessonDay.setDate(lessonDay.getDate() + 1);

        }
    }
   
    let result = await School.addLessons(lessons, teacherIds);
  
    if(result) {
        response.status(201).json({ message: "OK!" });
    } else {
        response.status(400).json({ message: "Failed to add lessons!"})
    }
};