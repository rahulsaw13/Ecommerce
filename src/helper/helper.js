export const refactorPrefilledDate=(date)=>{
    const updateddate = new Date(date);
   
    const formattedDate = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      }).format(updateddate);
    return formattedDate;
}


export const refactorPrefilledDateForInput = (date) => {
  if (!date) return "";
  const updatedDate = new Date(date);

  const year = updatedDate.getFullYear();
  const month = String(updatedDate.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const day = String(updatedDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`; // ✅ "YYYY-MM-DD" format
};