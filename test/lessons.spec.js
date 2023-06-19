const chai = require("chai");
const chaiHttp = require("chai-http");
const sinon = require("sinon");
const School = require("../models/school.js");
const server = require("../index.js");
const should = chai.should();

chai.use(chaiHttp);

describe("Lessons", () => {

    afterEach(function () {
      sinon.restore();
    });

  describe("/GET lessons", () => {

      it('it should GET lessons in one day', (done) => {
        const date = "2023-01-01";
        
        chai.request(server)
            .get("/")
            .query({ date })
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.an('array');

                res.body.forEach(lesson => {
                  lesson.should.have.property("id");
                  chai.assert.isNumber(lesson.id);

                  lesson.should.have.property("title");
                  chai.assert.isString(lesson.title)

                  lesson.should.have.property("date");
                  chai.assert.isAtLeast(Date.parse(lesson.date), Date.parse(date));

                  lesson.should.have.property("status");
                  chai.assert.include([0, 1], lesson.status);

                  lesson.should.have.property("visitCount");
                  chai.assert.isNumber(lesson.visitCount);
                  chai.assert.isAtLeast(lesson.visitCount, 0);

                  lesson.should.have.property("teachers");
                  chai.assert.isArray(lesson["teachers"]);
                  lesson.teachers.forEach(teacher => {
                    chai.assert.isObject(teacher);
                    teacher.should.have.property("id");
                    chai.assert.isNumber(teacher.id);

                    teacher.should.have.property("name");
                    chai.assert.isString(teacher.name);
                  });

                  lesson.should.have.property("students");
                  chai.assert.isArray(lesson["students"]);
                  lesson.students.forEach(student => {
                    chai.assert.isObject(student);
                    student.should.have.property("id");
                    chai.assert.isNumber(student.id);

                    student.should.have.property("name");
                    chai.assert.isNumber(student.id);

                    student.should.have.property("visit");
                    chai.assert.isBoolean(student.visit);
                  });
                });

              done();
            });          
      });

  });

  describe("/POST lessons", () => {

    it("it should not POST a lessons is empty", function(done) {

      const lessons = {};

      chai.request(server)
            .post("/lessons")
            .send(lessons)
            .end((err, res) => {
              res.should.have.status(400);
              res.body.should.have.property("message");
              chai.assert.strictEqual(res.body.message, "Body is empty!")

              done();
            });
    });

    it("it should not POST a lessons with params lessonsCount and lastDate", function(done) {

      const lessons = {
        teacherIds: [1 ,2],
        title: "Title lesson",
        days: [0, 1],
        firstDate: "2023-06-18",
        lastDate: "2023-06-30",
        lessonsCount: 3
      };

      chai.request(server)
            .post("/lessons")
            .send(lessons)
            .end((err, res) => {
              res.should.have.status(400);
              res.body.should.have.property("message");
              chai.assert.strictEqual(res.body.message, "Only one of the parameters must be used: lastDate or lessonsCount!")

              done();
            });
    });

    it("it should not post if title is empty", function(done) {

      const lessons = {
        teacherIds: [1 ,2],
        title: "",
        days: [0, 1],
        firstDate: "2023-06-18",
        lessonsCount: 3
      };

      chai.request(server)
            .post("/lessons")
            .send(lessons)
            .end((err, res) => {
              res.should.have.status(400);
              res.body.should.have.property("message");
              chai.assert.strictEqual(res.body.message, "Title is empty!")

              done();
            });
    });

    it("it should not post if title is empty", function(done) {

      const lessons = {
        teacherIds: [1 ,2],
        title: "",
        days: [0, 1],
        firstDate: "2023-06-18",
        lessonsCount: 3
      };

      chai.request(server)
            .post("/lessons")
            .send(lessons)
            .end((err, res) => {
              res.should.have.status(400);
              res.body.should.have.property("message");
              chai.assert.strictEqual(res.body.message, "Title is empty!")

              done();
            });
    });

    it("it should not post if teacherIds is not array", function(done) {

      const lessons = {
        teacherIds: "arr",
        title: "Title",
        days: [0, 1],
        firstDate: "2023-06-18",
        lessonsCount: 3
      };

      chai.request(server)
            .post("/lessons")
            .send(lessons)
            .end((err, res) => {
              res.should.have.status(400);
              res.body.should.have.property("message");
              chai.assert.strictEqual(res.body.message, "TeacherIds is not array!")

              done();
            });
    });

    it("it should not post if array teacherIds is empty", function(done) {

      const lessons = {
        teacherIds: [],
        title: "Title",
        days: [0, 1],
        firstDate: "2023-06-18",
        lessonsCount: 3
      };

      chai.request(server)
            .post("/lessons")
            .send(lessons)
            .end((err, res) => {
              res.should.have.status(400);
              res.body.should.have.property("message");
              chai.assert.strictEqual(res.body.message, "Array teacherIds is empty!")

              done();
            });
    });

    it("it should not post if an error occurred while checking teachers by id", function(done) {

      const lessons = {
        teacherIds: [1],
        title: "Title",
        days: [0, 1],
        firstDate: "2023-06-18",
        lessonsCount: 3
      };

      const error = new Error("Error checking teachers by id!");
      const arrIdTeachers = sinon.stub(School, "getTeachersById").rejects(error);

      chai.request(server)
            .post("/lessons")
            .send(lessons)
            .end((err, res) => {
              sinon.assert.calledWith(arrIdTeachers, [1]);
              res.should.have.status(400);
              res.body.should.have.property("message");
              chai.assert.strictEqual(res.body.message, "Error checking teachers by id!")

              done();
            });
    });

    it("it should not post if teachers with id is not found", function(done) {
      const idTeacher = 50;
      const lessons = {
        teacherIds: [idTeacher],
        title: "Title",
        days: [0, 1],
        firstDate: "2023-06-18",
        lessonsCount: 3
      };

      chai.request(server)
            .post("/lessons")
            .send(lessons)
            .end((err, res) => {
              res.should.have.status(400);
              res.body.should.have.property("message");
              chai.assert.strictEqual(res.body.message, `No teachers with id: ${idTeacher}!`)

              done();
            });
    });

    it("it should not post if days is not array", function(done) {

      const lessons = {
        teacherIds: [1],
        title: "Title",
        days: "",
        firstDate: "2023-06-18",
        lessonsCount: 3
      };

      chai.request(server)
            .post("/lessons")
            .send(lessons)
            .end((err, res) => {
              res.should.have.status(400);
              res.body.should.have.property("message");
              chai.assert.strictEqual(res.body.message, "Days is not array!")

              done();
            });
    });

    it("it should not post if invalid array days length", function(done) {

      const lessons = {
        teacherIds: [1],
        title: "Title",
        days: [],
        firstDate: "2023-06-18",
        lessonsCount: 3
      };

      chai.request(server)
            .post("/lessons")
            .send(lessons)
            .end((err, res) => {
              res.should.have.status(400);
              res.body.should.have.property("message");
              chai.assert.strictEqual(res.body.message, "Invalid array length!")

              done();
            });
    });

    it("it should not post if wrong days of the week", function(done) {

      const lessons = {
        teacherIds: [1],
        title: "Title",
        days: [20, 30],
        firstDate: "2023-06-18",
        lessonsCount: 3
      };

      chai.request(server)
            .post("/lessons")
            .send(lessons)
            .end((err, res) => {
              res.should.have.status(400);
              res.body.should.have.property("message");
              chai.assert.strictEqual(res.body.message, "Wrong days of the week!")

              done();
            });
    });

    it("it should not post if firstDate is invalid", function(done) {

      const lessons = {
        teacherIds: [1],
        title: "Title",
        days: [2, 3],
        firstDate: "",
        lessonsCount: 3
      };

      chai.request(server)
            .post("/lessons")
            .send(lessons)
            .end((err, res) => {
              res.should.have.status(400);
              res.body.should.have.property("message");
              chai.assert.strictEqual(res.body.message, "FirstDate is invalid!")

              done();
            });
    });

    it("it should not post if firstDate is less than current date", function(done) {

      const lessons = {
        teacherIds: [1],
        title: "Title",
        days: [2, 3],
        firstDate: "2023-01-01",
        lessonsCount: 3
      };

      chai.request(server)
            .post("/lessons")
            .send(lessons)
            .end((err, res) => {
              res.should.have.status(400);
              res.body.should.have.property("message");
              chai.assert.strictEqual(res.body.message, "FirstDate is less than current date!")

              done();
            });
    });

    it("it should not post if lessonsCount is invalid", function(done) {

      const lessons = {
        teacherIds: [1],
        title: "Title",
        days: [2, 3],
        firstDate: "2023-10-01",
        lessonsCount: 0
      };

      chai.request(server)
            .post("/lessons")
            .send(lessons)
            .end((err, res) => {
              res.should.have.status(400);
              res.body.should.have.property("message");
              chai.assert.strictEqual(res.body.message, "lessonsCount is invalid!")

              done();
            });
    });

    it("it should not post if lastDate is invalid", function(done) {

      const lessons = {
        teacherIds: [1],
        title: "Title",
        days: [2, 3],
        firstDate: "2023-10-01",
        lastDate: 2
      };

      chai.request(server)
            .post("/lessons")
            .send(lessons)
            .end((err, res) => {
              res.should.have.status(400);
              res.body.should.have.property("message");
              chai.assert.strictEqual(res.body.message, "lastDate is invalid!")

              done();
            });
    });

    it("it should not be published if an error occurred while adding lessons", function(done) {

      const lessons = {
        teacherIds: [1, 2],
        title: "Title",
        days: [2, 3],
        firstDate: "2023-10-01",
        lastDate: "2023-10-10"
      };

      sinon.stub(School, "addLessons").resolves(false);

      chai.request(server)
            .post("/lessons")
            .send(lessons)
            .end((err, res) => {
              res.should.have.status(400);
              res.body.should.have.property("message");
              chai.assert.strictEqual(res.body.message, "Failed to add lessons!")

              done();
            });
    });

    it("it should successful adding lessons", function(done) {

      const lessons = {
        teacherIds: [1, 2],
        title: "Title",
        days: [2, 3],
        firstDate: "2023-10-01",
        lastDate: "2023-10-10"
      };

      sinon.stub(School, "addLessons").resolves(true);

      chai.request(server)
            .post("/lessons")
            .send(lessons)
            .end((err, res) => {
              res.should.have.status(201);
              res.body.should.have.property("message");
              chai.assert.strictEqual(res.body.message, "OK!")

              done();
            });
    });
  });

  describe("/Defunct route", () => {

    it("should return NotFound with status 404", function(done){

      chai.request(server)
          .get("/error")
          .end((err, res) => {
              res.should.have.status(404);
              done();
          });
    });
  });

});