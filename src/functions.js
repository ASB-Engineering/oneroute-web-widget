export const getRequestError = (error) => {
  const { response } = error;
  if (response && (response.data.code === 401 || response.status === 401)) {
    return "";
  } else if (response && response.data.errors && response.data.errors[0]) {
    return response.data.errors[0].message;
  } else if (response && response.data.message) {
    return response.data.message;
  } else if (response && response.data.error) {
    return response.data.error;
  }
  return "There might be a problem with your internet connection. Please check and try again.";
};

export const formatTime = (date) => {
  var d = new Date(date);
  var hr = d.getHours();
  var min = d.getMinutes();
  if (min < 10) {
    min = "0" + min;
  }
  var ampm = " AM";
  if (hr > 12) {
    hr -= 12;
    ampm = " PM";
  }
  return hr + ":" + min + ampm || "";
};
