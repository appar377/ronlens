const route = window.location.pathname.replace(/\/+$/, "") || "/";
if (route === "/") await import("./home.js");
else await import("./app.js");
export {};
