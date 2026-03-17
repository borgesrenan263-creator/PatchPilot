export const startMonitorIfNotTest = () => {
  if (process.env.NODE_ENV === "test") return;

  setInterval(() => {
    console.log("Running monitor...");
    // sua função real aqui
  }, 5000);
};
