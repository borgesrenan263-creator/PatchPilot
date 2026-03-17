import { db } from "../lib/db";

export const createMetric = async (
  projectId:number,
  responseTime:number,
  statusCode:number
)=>{

  await db.query(
    `INSERT INTO "Metric"
     ("projectId","responseTime","statusCode")
     VALUES ($1,$2,$3)`,
    [projectId,responseTime,statusCode]
  );

};
