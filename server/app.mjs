import express from "express";
import connectionPool from "./utils/db.mjs";

const app = express();
const port = 4001;

app.use(express.json());

app.get("/test", (req, res) => {
  return res.json("Server API is working 🚀");
});

app.post("/assignments", async (req, res) => {
  // เข้าถึง data ใน request body
  const { title, content, category } = req.body;

  // logic ในการเก็บข้อมูล
  // 1) access data ใน body จาก request ด้วย req.body
  const newAssignment = {
    ...req.body,
    created_at: new Date(),
    updated_at: new Date(),
    published_at: new Date(),
  };
  console.log(newAssignment);

  // 2) เขียน query เพื่อ insert ข้อมูล assignemts ด้วย connection pool
  try {
    await connectionPool.query(
      `insert into assignments (title,content,category)
      values ($1,$2,$3)`,
      [newAssignment.title, newAssignment.content, newAssignment.category]
    );
  } catch (error) {
    return res.status(500).json({
      message: "Sever could not create assignment because database issue",
    });
  }
  // ตรวจสอบข้อมูลใน post required
  if (!title || !content || !category) {
    return res.status(400).json({
      message:
        "Server could not create assignment because there are missing data from client",
    });
  }

  // 3) return ตัว response กลับไปหา client

  return res.status(201).json({
    message: "Created assignment successfully",
  });
});

// Build the Complete CRUD APIs Assignment //
// get data ทั้งหมด //
app.get("/assignments", async (req, res) => {
  // logic ในการเก็บข้อมูล
  // 1) เขียน query เพื่ออ่านข้อมูลใน assignments ด้วย connection pool
  let results;
  try {
    results = await connectionPool.query(`SELECT * FROM assignments`);
  } catch (error) {
    return res.status(500).json({
      message: "Server could not read assignment because database connection",
    });
  }

  // 2) return ตัว response กลับไปหา client
  return res.status(200).json({
    data: results.rows,
  });
});

// ดูทีละ id //
app.get("/assignments/:assignmentId", async (req, res) => {
  // logic ในการดูข้อมูล
  // 1) access ตัว endpoint parameter ด้วย req.params
  const assignmentIdFromClient = req.params.assignmentId;
  let results;
  // 2) เขียน query เพื่ออ่านข้อมูลโพสต์ ด้วย Connection Poll
  try {
    results = await connectionPool.query(
      `SELECT * FROM assignments WHERE assignment_id=$1`,
      [assignmentIdFromClient]
    );
  } catch (error) {
    return res.status(500).json({
      message: "Server could not read assignment because database connection",
    });
  }

  // เพิ่ม conditional logic ว่าถ้าข้อมูลที่ได้กลับมาจาก database เป็นค่า false (null / undefied)
  // ให้ return response ด้วย status code 404
  // พร้อมข้อความว่า { "message": "Server could not find a requested assignment" }
  // Add handle error 404
  if (!results.rows[0]) {
    return res.status(404).json({
      message: "Server could not find a requested assignment",
    });
  }

  // 3) Return ตัว response กลับไปหา client
  return res.status(200).json({
    data: results.rows[0],
  });
});

// Put the assignment
app.put("/assignments/:assignmentId", async (req, res) => {
  // 1) Access ตัว endpoint parameter ด้วย req.params
  // และข้อมูลโพสต์ที่ client ส่งมาแก้ไขจาก body ของ request
  const assignmentIdFromClient = req.params.assignmentId;
  const updatedAssignment = {
    ...req.body,
    updated_at: new Date(),
  };
  let results;
  // 2) เขียน query เพื่อแก้ไขข้อมูลโพสต์ด้วย Connection Pool
  try {
    results = await connectionPool.query(
      `
      update assignments
      set title = $2,
          content = $3,
          category = $4
      where assignment_id = $1`,
      [
        assignmentIdFromClient,
        updatedAssignment.title,
        updatedAssignment.content,
        updatedAssignment.category,
      ]
    );
  } catch {
    return res.status(500).json({
      message: "Server could not update assignment because database connection",
    });
  }
  if (results.rowCount === 0) {
    return res.status(404).json({
      message: "Server could not find a requested assignment to update",
    });
  }

  // 3) Return ตัว response กลับไปหา client
  return res.status(200).json({ message: "Updated assignment sucessfully" });
});

// Delete Existing Data //
app.delete("/assignments/:assignmentId", async (req, res) => {
  const assignmentIdFromClient = req.params.assignmentId;
  let results;
  try {
    results = await connectionPool.query(
      `
      delete from assignments where assignment_id = $1`,
      [assignmentIdFromClient]
    );
  } catch {
    return res.status(500).json({
      message: "Server could not delete assignment because database connection",
    });
  }
  if (results.rowCount === 0) {
    return res.status(404).json({
      message: "Server could not find a requested assignment to delete",
    });
  }
  return res.status(200).json({ message: "Deleted assignment sucessfully" });
});

app.listen(port, () => {
  console.log(`Server is running at ${port}`);
});
