import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Application root was not found.");
}

app.innerHTML = `
  <main class="welcome">
    <p class="eyebrow">A family tree, made yours</p>
    <h1>Family Tree Poster</h1>
    <p class="intro">
      A thoughtful, hands-on way to turn your family tree into a poster
      you can print and keep.
    </p>
    <p class="status">The application is taking root. More soon.</p>
  </main>
`;
