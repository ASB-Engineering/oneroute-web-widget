import axios from "axios";

export const API = axios.create({
  baseURL: "https://oneroute-backend.herokuapp.com/api",
  headers: {},
  withCredentials: true,
});

export const getRequest = async ({ url, params }) => {
  var request = {
    url,
    method: "get",
    params,
  };

  const requestResponse = await API(request);

  return requestResponse;
};

export const postRequest = async ({ url, data, formData }) => {
  var request = {
    url,
    method: "post",
    data,
  };

  if (formData) {
    request.headers = {
      ...request.headers,
      "Content-Type": "multipart/form-data",
    };
  }

  const requestResponse = await API(request);

  return requestResponse;
};
