import React from "react";
import dayjs from "dayjs";

export function formatDate(date) {

  const formattedDate = dayjs(date).format("DD-MM-YYYY");
  
  return <span>{formattedDate}</span>;
};