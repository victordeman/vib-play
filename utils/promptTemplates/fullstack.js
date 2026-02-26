export const FULLSTACK_TEMPLATES = {
  todo: {
    name: "Todo App",
    description: "A simple task management application with a frontend and backend.",
    spec: "Create a Todo application with React (frontend) and Express (backend). Include features like adding, editing, deleting tasks, and marking them as complete. Use SQLite for the database.",
  },
  saas: {
    name: "SaaS Landing Page",
    description: "A professional landing page for a SaaS product with a contact form.",
    spec: "Create a SaaS landing page with React (frontend) and Express (backend). Include sections for features, pricing, testimonials, and a contact form that saves inquiries to a database.",
  },
  ecommerce: {
    name: "E-commerce Storefront",
    description: "A basic e-commerce store with product listing and a shopping cart.",
    spec: "Create an e-commerce storefront with React (frontend) and Express (backend). Include a product list, a shopping cart, and a checkout simulation. Products should be fetched from the backend.",
  },
  ai_wrapper: {
    name: "AI Wrapper",
    description: "An AI-powered application that uses an LLM API to process user input.",
    spec: "Create an AI wrapper application with React (frontend) and Express (backend). The backend should proxy requests to an AI API (like OpenAI) and return the results to the frontend.",
  }
};

export const getFullStackPrompt = (templateKey, customPrompt) => {
  const template = FULLSTACK_TEMPLATES[templateKey];
  const spec = template ? template.spec : customPrompt;
  return `${spec}\n\nPlease generate a full-stack application for this request.`;
};
