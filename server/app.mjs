import express from "express";
import connectionPool from "./utils/db.mjs";

const app = express();
const port = 4001;

app.get("/test", (req, res) => {
  return res.json("Server API is working 🚀");
});

//GET-1
app.get("/assignments", async (req, res) => {
  let results;
  try {
    results = await connectionPool.query(`select * from assignments`);
  } catch {
    return res.status(500).json({
      message: "Server could not read assignment because database connection",
    });
  }

  return res.status(200).json({
    data: results.rows,
  });
});

//GET-2

app.get("/assignments/:assignmentId", async (req, res) => {
  const assignmentIdFromClient = req.params.assignmentId;

  let results;
  try {
    results = await connectionPool.query(
      `
      select * from assignments where assignment_id=$1
      `,
      [assignmentIdFromClient]
    );
  } catch {
    return res.status(500).json({
      message: "Server could not read assignment because database connection",
    });
  }

  if (!results.rows[0]) {
    return res.status(404).json({
      message: `Server could not find a requested assignment (assignment id: ${assignmentIdFromClient})`,
    });
  }

  return res.status(200).json({
    data: results.rows[0],
  });
});

//PUT รอแก้
app.put("/assignments/:assignmentId", async (req, res) => {
  const assignmentIdFromClient = req.params.assignmentId;
  const updatedAssignment = { ...req.body, updated_at: new Date() };

  await connectionPool.query(
    `
      update assignments
      set title = $2,
          content = $3,
          category = $4,
          length = $5,
          user_id = $6,
          status = $7,
          created_at = $8,
          updated_at = $9,
          published_at = $10
      where assignment_id = $1
    `,

    [
      assignmentIdFromClient,
      updatedAssignment.title,
      updatedAssignment.content,
      updatedAssignment.category,
      updatedAssignment.length,
      updatedAssignment.user_id,
      updatedAssignment.status,
      updatedAssignment.created_at,
      updatedAssignment.updated_at,
      updatedAssignment.published_at,
    ]
  );

  return res.status(200).json({
    message: "Updated assignment sucessfully",
  });
});

app.delete("/assignments/:assignmentId", async (req, res) => {
  const assignmentId = req.params.assignmentId;

  try {
    const result = await connectionPool.query(
      `DELETE FROM assignments WHERE assignment_id = $1`,
      [assignmentId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Server could not find a requested assignment to delete",
      });
    }

    return res.status(200).json({
      message: "Deleted assignment successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message:
        "Server could not delete assignment because of database connection error",
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running at ${port}`);
});
