const { GoogleGenerativeAI } = require("@google/generative-ai");
(async () => {
  try {
    const ai = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    const models = await ai.listModels();
    console.log(models.map((m) => m.name));
  } catch (e) {
    console.error("ERR", e.message);
  }
})();
