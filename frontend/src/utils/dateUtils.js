// Date utility functions for consistent formatting across the app

export const formatDate = (date, format = 'dd/mm/yyyy') => {
  if (!date) return 'Not available';
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return 'Invalid date';
  
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear();
  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');
  const seconds = dateObj.getSeconds().toString().padStart(2, '0');
  
  switch (format) {
    case 'dd/mm/yyyy':
      return `${day}/${month}/${year}`;
    case 'dd/mm/yyyy hh:mm':
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    case 'dd/mm/yyyy hh:mm:ss':
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    case 'dd/mm/yyyy, hh:mm:ss':
      return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
    default:
      return `${day}/${month}/${year}`;
  }
};

export const formatDateTime = (date) => {
  return formatDate(date, 'dd/mm/yyyy, hh:mm:ss');
};

export const formatDateOnly = (date) => {
  return formatDate(date, 'dd/mm/yyyy');
};